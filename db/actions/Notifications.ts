"use server";

import { db } from "@/drizzle/db";
import {
  notificationsTable,
  mealFeedbackTable,
  systemFeedbackTable,
  spendingApprovalsTable,
  blockedItemsTable,
} from "@/drizzle/schema";
import { and, eq } from "drizzle-orm";
import {
  revalidateNotificationCache,
  revalidateMealFeedbackCache,
  revalidateSystemFeedbackCache,
  revalidateSpendingApprovalCache,
  revalidateBlockedItemCache,
} from "@/lib/cacheRevalidation";

// ─── Notifications ─────────────────────────────────────────────

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

// ─── Meal Feedback ─────────────────────────────────────────────

export async function submitMealFeedback(
  feedback: typeof mealFeedbackTable.$inferInsert,
) {
  const [created] = await db
    .insert(mealFeedbackTable)
    .values(feedback)
    .returning();

  revalidateMealFeedbackCache(created.orderId, created.studentId);
  return created;
}

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

// ─── System Feedback ───────────────────────────────────────────

export async function submitSystemFeedback(
  feedback: typeof systemFeedbackTable.$inferInsert,
) {
  const [created] = await db
    .insert(systemFeedbackTable)
    .values(feedback)
    .returning();

  revalidateSystemFeedbackCache(created.userId);
  return created;
}

// ─── Spending Approvals ────────────────────────────────────────

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
}

// ─── Blocked Items ─────────────────────────────────────────────

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
