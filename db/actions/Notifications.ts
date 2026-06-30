"use server";

import { db } from "@/drizzle/db";
import {
  notificationsTable,
  mealFeedbackTable,
  spendingApprovalsTable,
  blockedItemsTable,
  canteenStaffAssignmentsTable,
} from "@/drizzle/schema";
import { and, eq } from "drizzle-orm";
import {
  revalidateNotificationCache,
  revalidateMealFeedbackCache,
  revalidateSpendingApprovalCache,
  revalidateBlockedItemCache,
} from "@/lib/cacheRevalidation";
import { notify, notifyMany } from "@/lib/notification/notify";
import { PushEvents } from "@/lib/notification/webpush";

// ─── Notifications ─────────────────────────────────────────────────────────────

export async function createNotification(
  notification: typeof notificationsTable.$inferInsert,
) {
  const [created] = await db
    .insert(notificationsTable)
    .values(notification)
    .returning();

  revalidateNotificationCache(created.userId);
  return created;
}

export async function markNotificationRead(
  notificationId: string,
  userId: string,
) {
  await db
    .update(notificationsTable)
    .set({ isRead: true, readAt: new Date() })
    .where(eq(notificationsTable.id, notificationId));

  revalidateNotificationCache(userId);
}

export async function markAllNotificationsRead(userId: string) {
  await db
    .update(notificationsTable)
    .set({ isRead: true, readAt: new Date() })
    .where(
      and(
        eq(notificationsTable.userId, userId),
        eq(notificationsTable.isRead, false),
      ),
    );

  revalidateNotificationCache(userId);
}

// ─── Spending Approvals ────────────────────────────────────────────────────────

export async function createSpendingApproval(
  approval: typeof spendingApprovalsTable.$inferInsert,
) {
  const [created] = await db
    .insert(spendingApprovalsTable)
    .values(approval)
    .returning();

  revalidateSpendingApprovalCache(created.id, created.parentId);
  return created;
}

export async function resolveSpendingApproval(
  approvalId: string,
  parentId: string,
  decision: "approved" | "rejected",
  rejectionReason?: string,
) {
  await db
    .update(spendingApprovalsTable)
    .set({
      status: decision,
      respondedAt: new Date(),
      rejectionReason: rejectionReason ?? null,
    })
    .where(eq(spendingApprovalsTable.id, approvalId));

  revalidateSpendingApprovalCache(approvalId, parentId);

  notify({
    userId: parentId,
    type: `spending_${decision}`,
    event: PushEvents.spendingApprovalResolved(decision === "approved"),
  }).catch(console.error);
}

// ─── Meal Feedback ─────────────────────────────────────────────────────────────

export async function respondToFeedback(
  feedbackId: string,
  orderId: string,
  studentId: string,
  response: string,
) {
  await db
    .update(mealFeedbackTable)
    .set({ adminResponse: response })
    .where(eq(mealFeedbackTable.id, feedbackId));

  revalidateMealFeedbackCache(orderId, studentId);
}

// ─── Staff: new order / cancellation helpers ───────────────────────────────────
// Called from createOrder and cancelOrder so canteen staff are notified in
// real-time. We look up all staff assigned to the canteen and fan out.

export async function notifyStaffNewOrder(
  canteenId: string,
  studentName: string,
  itemCount: number,
) {
  const assignments = await db.query.canteenStaffAssignmentsTable.findMany({
    where: eq(canteenStaffAssignmentsTable.canteenId, canteenId),
  });

  const staffIds = assignments.map((a) => a.staffId);
  if (staffIds.length === 0) return;

  await notifyMany(staffIds, {
    type: "new_order",
    event: PushEvents.staff.newOrder(studentName, itemCount),
  });
}

export async function notifyStaffOrderCancelled(
  canteenId: string,
  studentName: string,
) {
  const assignments = await db.query.canteenStaffAssignmentsTable.findMany({
    where: eq(canteenStaffAssignmentsTable.canteenId, canteenId),
  });

  const staffIds = assignments.map((a) => a.staffId);
  if (staffIds.length === 0) return;

  await notifyMany(staffIds, {
    type: "order_cancelled",
    event: PushEvents.staff.orderCancelled(studentName),
  });
}

// ─── Blocked Items ─────────────────────────────────────────────────────────────

export async function blockMenuItem(
  parentId: string,
  studentId: string,
  menuItemId: string,
) {
  await db
    .insert(blockedItemsTable)
    .values({ parentId, studentId, menuItemId })
    .onConflictDoNothing();

  revalidateBlockedItemCache(parentId, studentId);
}

export async function unblockMenuItem(
  parentId: string,
  studentId: string,
  menuItemId: string,
) {
  await db
    .delete(blockedItemsTable)
    .where(
      and(
        eq(blockedItemsTable.parentId, parentId),
        eq(blockedItemsTable.studentId, studentId),
        eq(blockedItemsTable.menuItemId, menuItemId),
      ),
    );

  revalidateBlockedItemCache(parentId, studentId);
}