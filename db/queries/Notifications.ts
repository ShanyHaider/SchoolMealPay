import { db } from "@/drizzle/db";
import {
  notificationsTable,
  mealFeedbackTable,
  systemFeedbackTable,
  spendingApprovalsTable,
  blockedItemsTable,
} from "@/drizzle/schema";
import { and, eq } from "drizzle-orm";
import { unstable_cache } from "next/cache";
import { getGlobalTag, getIdTag, getUserTag, getStudentTag } from "@/lib/cache";

// ─── Notifications ─────────────────────────────────────────────

export function getNotificationsByUser(userId: string) {
  return unstable_cache(
    () =>
      db.query.notificationsTable.findMany({
        where: eq(notificationsTable.userId, userId),
      }),
    [getUserTag("notifications", userId)],
    {
      tags: [
        getGlobalTag("notifications"),
        getUserTag("notifications", userId),
      ],
    },
  )();
}

export function getUnreadNotifications(userId: string) {
  return unstable_cache(
    () =>
      db.query.notificationsTable.findMany({
        where: and(
          eq(notificationsTable.userId, userId),
          eq(notificationsTable.isRead, false),
        ),
      }),
    [getUserTag("notifications", userId)],
    {
      tags: [
        getGlobalTag("notifications"),
        getUserTag("notifications", userId),
      ],
    },
  )();
}

// ─── Meal Feedback ─────────────────────────────────────────────

export function getMealFeedbackByStudent(studentId: string) {
  return unstable_cache(
    () =>
      db.query.mealFeedbackTable.findMany({
        where: eq(mealFeedbackTable.studentId, studentId),
        with: { order: true },
      }),
    [getStudentTag("meal-feedback", studentId)],
    {
      tags: [
        getGlobalTag("meal-feedback"),
        getStudentTag("meal-feedback", studentId),
      ],
    },
  )();
}

export function getAllMealFeedback() {
  return unstable_cache(
    () =>
      db.query.mealFeedbackTable.findMany({
        with: { student: true, order: true },
      }),
    [getGlobalTag("meal-feedback")],
    { tags: [getGlobalTag("meal-feedback")] },
  )();
}

// ─── System Feedback ───────────────────────────────────────────

export function getAllSystemFeedback() {
  return unstable_cache(
    () => db.query.systemFeedbackTable.findMany({ with: { user: true } }),
    [getGlobalTag("system-feedback")],
    { tags: [getGlobalTag("system-feedback")] },
  )();
}

// ─── Spending Approvals ────────────────────────────────────────

export function getPendingApprovals(parentId: string) {
  return unstable_cache(
    () =>
      db.query.spendingApprovalsTable.findMany({
        where: and(
          eq(spendingApprovalsTable.parentId, parentId),
          eq(spendingApprovalsTable.status, "pending"),
        ),
        with: {
          order: { with: { orderItems: { with: { menuItem: true } } } },
          student: true,
        },
      }),
    [getUserTag("spending-approvals", parentId)],
    {
      tags: [
        getGlobalTag("spending-approvals"),
        getUserTag("spending-approvals", parentId),
      ],
    },
  )();
}

// ─── Blocked Items ─────────────────────────────────────────────

export function getBlockedItems(parentId: string, studentId: string) {
  return unstable_cache(
    () =>
      db.query.blockedItemsTable.findMany({
        where: and(
          eq(blockedItemsTable.parentId, parentId),
          eq(blockedItemsTable.studentId, studentId),
        ),
        with: { menuItem: true },
      }),
    [getUserTag("blocked-items", parentId)],
    {
      tags: [
        getGlobalTag("blocked-items"),
        getUserTag("blocked-items", parentId),
        getStudentTag("blocked-items", studentId),
      ],
    },
  )();
}
