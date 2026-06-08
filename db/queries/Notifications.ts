import { db } from "@/drizzle/db";
import {
  notificationsTable,
  mealFeedbackTable,
  systemFeedbackTable,
  spendingApprovalsTable,
  blockedItemsTable,
} from "@/drizzle/schema";
import { and, eq } from "drizzle-orm";
import { cacheLife, cacheTag } from "next/cache";
import { getGlobalTag, getUserTag, getStudentTag } from "@/lib/cache";

// ─── Notifications ─────────────────────────────────────────────

export async function getNotificationsByUser(userId: string) {
  "use cache";
  cacheLife("seconds");
  cacheTag(getGlobalTag("notifications"), getUserTag("notifications", userId));
  return db.query.notificationsTable.findMany({
    where: eq(notificationsTable.userId, userId),
  });
}

export async function getUnreadNotifications(userId: string) {
  "use cache";
  cacheLife("seconds");
  cacheTag(getGlobalTag("notifications"), getUserTag("notifications", userId));
  return db.query.notificationsTable.findMany({
    where: and(
      eq(notificationsTable.userId, userId),
      eq(notificationsTable.isRead, false),
    ),
  });
}

// ─── Meal Feedback ─────────────────────────────────────────────

export async function getMealFeedbackByStudent(studentId: string) {
  "use cache";
  cacheLife("minutes");
  cacheTag(getGlobalTag("meal-feedback"), getStudentTag("meal-feedback", studentId));
  return db.query.mealFeedbackTable.findMany({
    where: eq(mealFeedbackTable.studentId, studentId),
    with: { order: true },
  });
}

export async function getAllMealFeedback() {
  "use cache";
  cacheLife("minutes");
  cacheTag(getGlobalTag("meal-feedback"));
  return db.query.mealFeedbackTable.findMany({
    with: { student: true, order: true },
  });
}

// ─── System Feedback ───────────────────────────────────────────

export async function getAllSystemFeedback() {
  "use cache";
  cacheLife("minutes");
  cacheTag(getGlobalTag("system-feedback"));
  return db.query.systemFeedbackTable.findMany({ with: { user: true } });
}

// ─── Spending Approvals ────────────────────────────────────────

export async function getPendingApprovals(parentId: string) {
  "use cache";
  cacheLife("seconds");
  cacheTag(getGlobalTag("spending-approvals"), getUserTag("spending-approvals", parentId));
  return db.query.spendingApprovalsTable.findMany({
    where: and(
      eq(spendingApprovalsTable.parentId, parentId),
      eq(spendingApprovalsTable.status, "pending"),
    ),
    with: {
      order: { with: { orderItems: { with: { menuItem: true } } } },
      student: true,
    },
  });
}

// ─── Blocked Items ─────────────────────────────────────────────

export async function getBlockedItems(parentId: string, studentId: string) {
  "use cache";
  cacheLife("minutes");
  cacheTag(
    getGlobalTag("blocked-items"),
    getUserTag("blocked-items", parentId),
    getStudentTag("blocked-items", studentId),
  );
  return db.query.blockedItemsTable.findMany({
    where: and(
      eq(blockedItemsTable.parentId, parentId),
      eq(blockedItemsTable.studentId, studentId),
    ),
    with: { menuItem: true },
  });
}
