"use server";

import {
  revalidateTag as _revalidateTag,
  updateTag as _updateTag,
} from "next/cache";

function revalidateTag(tag: string) {
  try {
    // Immediate invalidation — works when we're inside a Server Action.
    _updateTag(tag);
  } catch {
    _revalidateTag(tag, { expire: 0 });
  }
}

import {
  getGlobalTag,
  getIdTag,
  getUserTag,
  getCanteenTag,
  getStudentTag,
} from "@/lib/cache";

// ── Users ──────────────────────────────────────────────────────
export async function revalidateUserCache(clerkId: string) {
  revalidateTag(getGlobalTag("users"));
  revalidateTag(getIdTag("users", clerkId));
}

// ── Students ───────────────────────────────────────────────────
export async function revalidateStudentCache(studentId: string) {
  revalidateTag(getGlobalTag("students"));
  revalidateTag(getIdTag("students", studentId));
}

// ── Child Profiles ─────────────────────────────────────────────
export async function revalidateChildProfileCache(studentId: string) {
  revalidateTag(getGlobalTag("child-profiles"));
  revalidateTag(getIdTag("child-profiles", studentId));
  revalidateTag(getIdTag("students", studentId)); // bust parent too
}

// ── Parent-Child Links ─────────────────────────────────────────
export async function revalidateParentChildLinkCache(
  parentId: string,
  studentId: string,
) {
  revalidateTag(getGlobalTag("parent-child-links"));
  revalidateTag(getUserTag("parent-child-links", parentId));
  revalidateTag(getStudentTag("parent-child-links", studentId));
}

// ── Student Allergens ──────────────────────────────────────────
export async function revalidateStudentAllergenCache(studentId: string) {
  revalidateTag(getGlobalTag("student-allergens"));
  revalidateTag(getStudentTag("student-allergens", studentId));
}

// ── School Profile ─────────────────────────────────────────────
export async function revalidateSchoolProfileCache() {
  revalidateTag(getGlobalTag("school-profile"));
}

// ── Classes ────────────────────────────────────────────────────
export async function revalidateClassCache(classId: string) {
  revalidateTag(getGlobalTag("classes"));
  revalidateTag(getIdTag("classes", classId));
}

// ── Canteens ───────────────────────────────────────────────────
export async function revalidateCanteenCache(canteenId: string) {
  revalidateTag(getGlobalTag("canteens"));
  revalidateTag(getIdTag("canteens", canteenId));
}

// ── Canteen Staff Assignments ──────────────────────────────────
export async function revalidateCanteenStaffCache(
  canteenId: string,
  staffId: string,
) {
  revalidateTag(getGlobalTag("canteen-staff-assignments"));
  revalidateTag(getCanteenTag("canteen-staff-assignments", canteenId));
  revalidateTag(getUserTag("canteen-staff-assignments", staffId));
}

// ── Menu Items ─────────────────────────────────────────────────
export async function revalidateMenuItemCache(
  menuItemId: string,
  canteenId: string,
) {
  revalidateTag(getGlobalTag("menu-items"));
  revalidateTag(getIdTag("menu-items", menuItemId));
  revalidateTag(getCanteenTag("menu-items", canteenId));
}

// ── Daily Menus ────────────────────────────────────────────────
export async function revalidateDailyMenuCache(canteenId: string) {
  revalidateTag(getGlobalTag("daily-menus"));
  revalidateTag(getCanteenTag("daily-menus", canteenId));
}

// ── Inventory Items ────────────────────────────────────────────
export async function revalidateInventoryCache(
  inventoryItemId: string,
  canteenId: string,
) {
  revalidateTag(getGlobalTag("inventory-items"));
  revalidateTag(getIdTag("inventory-items", inventoryItemId));
  revalidateTag(getCanteenTag("inventory-items", canteenId));
}

// ── Inventory Usage Logs ───────────────────────────────────────
export async function revalidateInventoryLogCache(canteenId: string) {
  revalidateTag(getGlobalTag("inventory-usage-logs"));
  revalidateTag(getCanteenTag("inventory-usage-logs", canteenId));
}

// ── Orders ─────────────────────────────────────────────────────
export async function revalidateOrderCache(
  orderId: string,
  parentId: string | null,
  studentId: string,
  canteenId: string,
) {
  revalidateTag(getGlobalTag("orders"));
  revalidateTag(getIdTag("orders", orderId));
  if (parentId) {
    revalidateTag(getUserTag("orders", parentId));
  }
  revalidateTag(getStudentTag("orders", studentId));
  revalidateTag(getCanteenTag("orders", canteenId));
}

// ── Order Items ────────────────────────────────────────────────
export async function revalidateOrderItemCache(orderId: string) {
  revalidateTag(getGlobalTag("order-items"));
  revalidateTag(getIdTag("order-items", orderId));
}

// ── Transactions ───────────────────────────────────────────────
export async function revalidateTransactionCache(
  transactionId: string,
  parentId: string,
) {
  revalidateTag(getGlobalTag("transactions"));
  revalidateTag(getIdTag("transactions", transactionId));
  revalidateTag(getUserTag("transactions", parentId));
}

// ── Blocked Items ──────────────────────────────────────────────
export async function revalidateBlockedItemCache(
  parentId: string,
  studentId: string,
) {
  revalidateTag(getGlobalTag("blocked-items"));
  revalidateTag(getUserTag("blocked-items", parentId));
  revalidateTag(getStudentTag("blocked-items", studentId));
}

// ── Spending Approvals ─────────────────────────────────────────
export async function revalidateSpendingApprovalCache(
  approvalId: string,
  parentId: string,
) {
  revalidateTag(getGlobalTag("spending-approvals"));
  revalidateTag(getIdTag("spending-approvals", approvalId));
  revalidateTag(getUserTag("spending-approvals", parentId));
}

// ── School Subscription ────────────────────────────────────────
export async function revalidateSchoolSubscriptionCache() {
  revalidateTag(getGlobalTag("school-subscription"));
  revalidateTag(getGlobalTag("subscription-invoices"));
}

// ── Parent Pro Subscriptions ───────────────────────────────────
export async function revalidateParentProSubscriptionCache(parentId: string) {
  revalidateTag(getGlobalTag("parent-pro-subscriptions"));
  revalidateTag(getUserTag("parent-pro-subscriptions", parentId));
}

// ── AI Meal Suggestions ────────────────────────────────────────
export async function revalidateAiSuggestionCache(studentId: string) {
  revalidateTag(getGlobalTag("ai-meal-suggestions"));
  revalidateTag(getStudentTag("ai-meal-suggestions", studentId));
}

// ── Nutrition Trends ───────────────────────────────────────────
export async function revalidateNutritionTrendCache(studentId: string) {
  revalidateTag(getGlobalTag("nutrition-trends"));
  revalidateTag(getStudentTag("nutrition-trends", studentId));
}

// ── Nutrition Targets ──────────────────────────────────────────
export async function revalidateNutritionTargetCache(targetId: string) {
  revalidateTag(getGlobalTag("nutrition-targets"));
  revalidateTag(getIdTag("nutrition-targets", targetId));
}

// ── Meal Feedback ──────────────────────────────────────────────
export async function revalidateMealFeedbackCache(
  orderId: string,
  studentId: string,
) {
  revalidateTag(getGlobalTag("meal-feedback"));
  revalidateTag(getStudentTag("meal-feedback", studentId));
  revalidateTag(getIdTag("meal-feedback", orderId));
}

// ── System Feedback ────────────────────────────────────────────
export async function revalidateSystemFeedbackCache(userId: string) {
  revalidateTag(getGlobalTag("system-feedback"));
  revalidateTag(getUserTag("system-feedback", userId));
}

// ── Notifications ──────────────────────────────────────────────
export async function revalidateNotificationCache(userId: string) {
  revalidateTag(getGlobalTag("notifications"));
  revalidateTag(getUserTag("notifications", userId));
}

// ── Notification Templates ─────────────────────────────────────
export async function revalidateNotificationTemplateCache() {
  revalidateTag(getGlobalTag("notification-templates"));
}

// ── System Config ──────────────────────────────────────────────
export async function revalidateSystemConfigCache() {
  revalidateTag(getGlobalTag("system-config"));
}

// ── Audit Logs ─────────────────────────────────────────────────
export async function revalidateAuditLogCache() {
  revalidateTag(getGlobalTag("audit-logs"));
}

// ── Chatbot ────────────────────────────────────────────────────
export async function revalidateChatbotCache(
  conversationId: string,
  userId: string,
) {
  revalidateTag(getGlobalTag("chatbot-conversations"));
  revalidateTag(getGlobalTag("chatbot-messages"));
  revalidateTag(getIdTag("chatbot-conversations", conversationId));
  revalidateTag(getUserTag("chatbot-conversations", userId));
}

export async function revalidateParentProSubscription(parentId: string) {
  revalidateTag(getGlobalTag("parent-pro-subscriptions"));
  revalidateTag(getUserTag("parent-pro-subscriptions", parentId));
}

export async function revalidateSchoolSubscription() {
  revalidateTag(getGlobalTag("school-subscription"));
}

export async function revalidateInvoices() {
  revalidateTag(getGlobalTag("subscription-invoices"));
}

export async function revalidateWallet(parentId: string) {
  revalidateTag(getGlobalTag("transactions"));
  revalidateTag(getUserTag("transactions", parentId));
}

export async function revalidateSuperAdminSubscriptionCache() {
  revalidateTag(getGlobalTag("school-subscription"));
  revalidateTag(getGlobalTag("school-profile"));
}

/**
 * Triggers cache purges across global user profiles and validation directories.
 */
export async function revalidateSuperAdminUserCache() {
  revalidateTag(getGlobalTag("users"));
}

/**
 * Signals updates to the streaming, immutable system compliance log ledger.
 */
export async function revalidateSuperAdminAuditCache() {
  revalidateTag(getGlobalTag("audit-logs"));
}

export async function revalidateStaffCache(userId: string, clerkId: string) {
  revalidateTag(getGlobalTag("users")); // busts getAllStaff()
  revalidateTag(getIdTag("users", userId)); // busts per-row queries keyed by DB id
  revalidateTag(getIdTag("users", clerkId)); // busts per-row queries keyed by clerkId
  revalidateTag(getGlobalTag("canteen-staff-assignments")); // busts assignment list queries
}

export async function bustUserCache(clerkId: string, dbUserId?: string) {
  revalidateTag(getGlobalTag("users"));
  revalidateTag(getIdTag("users", clerkId));
  if (dbUserId) revalidateTag(getIdTag("users", dbUserId));
}
