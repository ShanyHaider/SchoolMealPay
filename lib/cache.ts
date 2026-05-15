// ─── cache.ts ─────────────────────────────────────────────────
// Tag builders only — no "use server" needed here.
// Import these in both queries (to tag) and actions (to revalidate).

export type CacheTag =
  // Auth & Users
  | "users"
  // Students & Linking
  | "students"
  | "child-profiles"
  | "parent-child-links"
  | "student-allergens"
  // School
  | "school-profile"
  | "classes"
  // Canteens
  | "canteens"
  | "canteen-staff-assignments"
  // Menu & Inventory
  | "menu-items"
  | "daily-menus"
  | "inventory-items"
  | "inventory-usage-logs"
  // Orders
  | "orders"
  | "order-items"
  // Payments
  | "transactions"
  // Parental Controls
  | "blocked-items"
  | "spending-approvals"
  // Subscriptions
  | "school-subscription"
  | "subscription-invoices"
  | "parent-pro-subscriptions"
  // AI & Nutrition
  | "ai-meal-suggestions"
  | "nutrition-trends"
  | "nutrition-targets"
  // Feedback & Notifications
  | "meal-feedback"
  | "system-feedback"
  | "notifications"
  | "notification-templates"
  // System
  | "system-config"
  | "audit-logs"
  // Chatbot
  | "chatbot-conversations"
  | "chatbot-messages";

// ─── Tag Builders ──────────────────────────────────────────────
// Pure functions — no Next.js APIs, safe to import anywhere.

export function getGlobalTag(tag: CacheTag) {
  return `global:${tag}` as const;
}

export function getIdTag(tag: CacheTag, id: string) {
  return `id:${id}:${tag}` as const;
}

export function getUserTag(tag: CacheTag, userId: string) {
  return `user:${userId}:${tag}` as const;
}

export function getCanteenTag(tag: CacheTag, canteenId: string) {
  return `canteen:${canteenId}:${tag}` as const;
}

export function getStudentTag(tag: CacheTag, studentId: string) {
  return `student:${studentId}:${tag}` as const;
}
