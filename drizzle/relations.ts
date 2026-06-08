import { relations } from "drizzle-orm";
import {
  usersTable,
  studentsTable,
  childProfilesTable,
  studentAllergensTable,
  parentChildLinksTable,
  classesTable,
  canteensTable,
  canteenStaffAssignmentsTable,
  menuItemsTable,
  dailyMenusTable,
  inventoryItemsTable,
  inventoryUsageLogsTable,
  ordersTable,
  orderItemsTable,
  transactionsTable,
  blockedItemsTable,
  spendingApprovalsTable,
  mealFeedbackTable,
  systemFeedbackTable,
  notificationsTable,
  aiMealSuggestionsTable,
  nutritionTrendsTable,
  chatbotConversationsTable,
  chatbotMessagesTable,
  parentProSubscriptionsTable,
  subscriptionInvoicesTable,
  schoolSubscriptionTable,
  parentWalletsTable,
  auditLogsTable,
  pushSubscriptionsTable,
} from "./schema";
import { staffInvitationsTable } from "./schema/staffInvitationTable";

// ─── Users ─────────────────────────────────────────────────────
export const usersRelations = relations(usersTable, ({ many, one }) => ({
  parentChildLinks: many(parentChildLinksTable),
  // relationName must match canteenStaffAssignmentsRelations
  canteenStaffAssignment: one(canteenStaffAssignmentsTable, {
    fields: [usersTable.id],
    references: [canteenStaffAssignmentsTable.staffId],
    relationName: "staffUser",
  }),
  assignedCanteens: many(canteenStaffAssignmentsTable, {
    relationName: "assignedByUser",
  }),
  orders: many(ordersTable),
  transactions: many(transactionsTable),
  notifications: many(notificationsTable),
  blockedItems: many(blockedItemsTable),
  spendingApprovals: many(spendingApprovalsTable),
  systemFeedback: many(systemFeedbackTable),
  mealFeedback: many(mealFeedbackTable),
  parentProSubscription: one(parentProSubscriptionsTable, {
    fields: [usersTable.id],
    references: [parentProSubscriptionsTable.parentId],
  }),
  chatbotConversations: many(chatbotConversationsTable),

  // ADDED: One-to-one link to retrieve parent ledger balances
  wallet: one(parentWalletsTable, {
    fields: [usersTable.id],
    references: [parentWalletsTable.parentId],
  }),

  pushSubscriptions: many(pushSubscriptionsTable),
}));

// ─── Students ──────────────────────────────────────────────────
// parentLinks = ALL link records (any status).
// Filter in query: with: { parentLinks: { where: eq(status, "approved") } }
export const studentsRelations = relations(studentsTable, ({ one, many }) => ({
  class: one(classesTable, {
    fields: [studentsTable.classId],
    references: [classesTable.id],
  }),
  childProfile: one(childProfilesTable, {
    fields: [studentsTable.id],
    references: [childProfilesTable.studentId],
  }),
  allergens: many(studentAllergensTable),
  parentLinks: many(parentChildLinksTable),
  orders: many(ordersTable),
  blockedItems: many(blockedItemsTable),
  spendingApprovals: many(spendingApprovalsTable),
  mealFeedback: many(mealFeedbackTable),
  aiSuggestions: many(aiMealSuggestionsTable),
  nutritionTrends: many(nutritionTrendsTable),
}));

// ─── Classes ───────────────────────────────────────────────────
export const classesRelations = relations(classesTable, ({ many }) => ({
  students: many(studentsTable),
}));

// ─── Child Profiles ────────────────────────────────────────────
export const childProfilesRelations = relations(
  childProfilesTable,
  ({ one }) => ({
    student: one(studentsTable, {
      fields: [childProfilesTable.studentId],
      references: [studentsTable.id],
    }),
  }),
);

// ─── Student Allergens ─────────────────────────────────────────
export const studentAllergensRelations = relations(
  studentAllergensTable,
  ({ one }) => ({
    student: one(studentsTable, {
      fields: [studentAllergensTable.studentId],
      references: [studentsTable.id],
    }),
  }),
);

// ─── Parent-Child Links ────────────────────────────────────────
export const parentChildLinksRelations = relations(
  parentChildLinksTable,
  ({ one }) => ({
    parent: one(usersTable, {
      fields: [parentChildLinksTable.parentId],
      references: [usersTable.id],
    }),
    student: one(studentsTable, {
      fields: [parentChildLinksTable.studentId],
      references: [studentsTable.id],
    }),
  }),
);

// ─── Canteens ──────────────────────────────────────────────────
export const canteensRelations = relations(canteensTable, ({ many }) => ({
  staffAssignments: many(canteenStaffAssignmentsTable),
  menuItems: many(menuItemsTable),
  dailyMenus: many(dailyMenusTable),
  inventoryItems: many(inventoryItemsTable),
  orders: many(ordersTable),
}));

// ─── Canteen Staff Assignments ─────────────────────────────────
// Two FKs to usersTable — must use relationName on both sides
export const canteenStaffAssignmentsRelations = relations(
  canteenStaffAssignmentsTable,
  ({ one }) => ({
    staff: one(usersTable, {
      fields: [canteenStaffAssignmentsTable.staffId],
      references: [usersTable.id],
      relationName: "staffUser",
    }),
    canteen: one(canteensTable, {
      fields: [canteenStaffAssignmentsTable.canteenId],
      references: [canteensTable.id],
    }),
    assignedByUser: one(usersTable, {
      fields: [canteenStaffAssignmentsTable.assignedBy],
      references: [usersTable.id],
      relationName: "assignedByUser",
    }),
  }),
);

// ─── Menu Items ────────────────────────────────────────────────
export const menuItemsRelations = relations(
  menuItemsTable,
  ({ one, many }) => ({
    canteen: one(canteensTable, {
      fields: [menuItemsTable.canteenId],
      references: [canteensTable.id],
    }),
    dailyMenus: many(dailyMenusTable),
    orderItems: many(orderItemsTable),
    blockedItems: many(blockedItemsTable),
    aiSuggestions: many(aiMealSuggestionsTable),
  }),
);

// ─── Daily Menus ───────────────────────────────────────────────
export const dailyMenusRelations = relations(dailyMenusTable, ({ one }) => ({
  canteen: one(canteensTable, {
    fields: [dailyMenusTable.canteenId],
    references: [canteensTable.id],
  }),
  menuItem: one(menuItemsTable, {
    fields: [dailyMenusTable.menuItemId],
    references: [menuItemsTable.id],
  }),
}));

// ─── Inventory Items ───────────────────────────────────────────
export const inventoryItemsRelations = relations(
  inventoryItemsTable,
  ({ one, many }) => ({
    canteen: one(canteensTable, {
      fields: [inventoryItemsTable.canteenId],
      references: [canteensTable.id],
    }),
    usageLogs: many(inventoryUsageLogsTable),
  }),
);

// ─── Inventory Usage Logs ──────────────────────────────────────
export const inventoryUsageLogsRelations = relations(
  inventoryUsageLogsTable,
  ({ one }) => ({
    canteen: one(canteensTable, {
      fields: [inventoryUsageLogsTable.canteenId],
      references: [canteensTable.id],
    }),
    inventoryItem: one(inventoryItemsTable, {
      fields: [inventoryUsageLogsTable.inventoryItemId],
      references: [inventoryItemsTable.id],
    }),
    order: one(ordersTable, {
      fields: [inventoryUsageLogsTable.orderId],
      references: [ordersTable.id],
    }),
    performedByUser: one(usersTable, {
      fields: [inventoryUsageLogsTable.performedBy],
      references: [usersTable.id],
    }),
  }),
);

// ─── Orders ────────────────────────────────────────────────────
export const ordersRelations = relations(ordersTable, ({ one, many }) => ({
  student: one(studentsTable, {
    fields: [ordersTable.studentId],
    references: [studentsTable.id],
  }),
  parent: one(usersTable, {
    fields: [ordersTable.parentId],
    references: [usersTable.id],
  }),
  canteen: one(canteensTable, {
    fields: [ordersTable.canteenId],
    references: [canteensTable.id],
  }),
  orderItems: many(orderItemsTable),
  transactions: many(transactionsTable),
  mealFeedback: one(mealFeedbackTable, {
    fields: [ordersTable.id],
    references: [mealFeedbackTable.orderId],
  }),
  spendingApproval: one(spendingApprovalsTable, {
    fields: [ordersTable.id],
    references: [spendingApprovalsTable.orderId],
  }),
}));

// ─── Order Items ───────────────────────────────────────────────
export const orderItemsRelations = relations(orderItemsTable, ({ one }) => ({
  order: one(ordersTable, {
    fields: [orderItemsTable.orderId],
    references: [ordersTable.id],
  }),
  menuItem: one(menuItemsTable, {
    fields: [orderItemsTable.menuItemId],
    references: [menuItemsTable.id],
  }),
}));

// ─── Transactions ──────────────────────────────────────────────
export const transactionsRelations = relations(
  transactionsTable,
  ({ one }) => ({
    order: one(ordersTable, {
      fields: [transactionsTable.orderId],
      references: [ordersTable.id],
    }),
    parent: one(usersTable, {
      fields: [transactionsTable.parentId],
      references: [usersTable.id],
    }),
  }),
);

// ─── Blocked Items ─────────────────────────────────────────────
export const blockedItemsRelations = relations(
  blockedItemsTable,
  ({ one }) => ({
    parent: one(usersTable, {
      fields: [blockedItemsTable.parentId],
      references: [usersTable.id],
    }),
    student: one(studentsTable, {
      fields: [blockedItemsTable.studentId],
      references: [studentsTable.id],
    }),
    menuItem: one(menuItemsTable, {
      fields: [blockedItemsTable.menuItemId],
      references: [menuItemsTable.id],
    }),
  }),
);

// ─── Spending Approvals ────────────────────────────────────────
export const spendingApprovalsRelations = relations(
  spendingApprovalsTable,
  ({ one }) => ({
    order: one(ordersTable, {
      fields: [spendingApprovalsTable.orderId],
      references: [ordersTable.id],
    }),
    parent: one(usersTable, {
      fields: [spendingApprovalsTable.parentId],
      references: [usersTable.id],
    }),
    student: one(studentsTable, {
      fields: [spendingApprovalsTable.studentId],
      references: [studentsTable.id],
    }),
  }),
);

// ─── Meal Feedback ─────────────────────────────────────────────
export const mealFeedbackRelations = relations(
  mealFeedbackTable,
  ({ one }) => ({
    order: one(ordersTable, {
      fields: [mealFeedbackTable.orderId],
      references: [ordersTable.id],
    }),
    student: one(studentsTable, {
      fields: [mealFeedbackTable.studentId],
      references: [studentsTable.id],
    }),
    user: one(usersTable, {
      fields: [mealFeedbackTable.userId],
      references: [usersTable.id],
    }),
  }),
);

// ─── System Feedback ───────────────────────────────────────────
export const systemFeedbackRelations = relations(
  systemFeedbackTable,
  ({ one }) => ({
    user: one(usersTable, {
      fields: [systemFeedbackTable.userId],
      references: [usersTable.id],
    }),
  }),
);

// ─── Notifications ─────────────────────────────────────────────
export const notificationsRelations = relations(
  notificationsTable,
  ({ one }) => ({
    user: one(usersTable, {
      fields: [notificationsTable.userId],
      references: [usersTable.id],
    }),
  }),
);

// ─── AI Meal Suggestions ───────────────────────────────────────
export const aiMealSuggestionsRelations = relations(
  aiMealSuggestionsTable,
  ({ one }) => ({
    student: one(studentsTable, {
      fields: [aiMealSuggestionsTable.studentId],
      references: [studentsTable.id],
    }),
    menuItem: one(menuItemsTable, {
      fields: [aiMealSuggestionsTable.menuItemId],
      references: [menuItemsTable.id],
    }),
  }),
);

// ─── Nutrition Trends ──────────────────────────────────────────
export const nutritionTrendsRelations = relations(
  nutritionTrendsTable,
  ({ one }) => ({
    student: one(studentsTable, {
      fields: [nutritionTrendsTable.studentId],
      references: [studentsTable.id],
    }),
  }),
);

// ─── Subscriptions ─────────────────────────────────────────────
export const schoolSubscriptionRelations = relations(
  schoolSubscriptionTable,
  ({ many }) => ({
    invoices: many(subscriptionInvoicesTable),
  }),
);

export const subscriptionInvoicesRelations = relations(
  subscriptionInvoicesTable,
  ({ one }) => ({
    subscription: one(schoolSubscriptionTable, {
      fields: [subscriptionInvoicesTable.subscriptionId],
      references: [schoolSubscriptionTable.id],
    }),
  }),
);

export const parentProSubscriptionsRelations = relations(
  parentProSubscriptionsTable,
  ({ one }) => ({
    parent: one(usersTable, {
      fields: [parentProSubscriptionsTable.parentId],
      references: [usersTable.id],
    }),
  }),
);

// ─── Chatbot ───────────────────────────────────────────────────
export const chatbotConversationsRelations = relations(
  chatbotConversationsTable,
  ({ one, many }) => ({
    user: one(usersTable, {
      fields: [chatbotConversationsTable.userId],
      references: [usersTable.id],
    }),
    messages: many(chatbotMessagesTable),
  }),
);

export const chatbotMessagesRelations = relations(
  chatbotMessagesTable,
  ({ one }) => ({
    conversation: one(chatbotConversationsTable, {
      fields: [chatbotMessagesTable.conversationId],
      references: [chatbotConversationsTable.id],
    }),
  }),
);

export const parentWalletsRelations = relations(
  parentWalletsTable,
  ({ one }) => ({
    parent: one(usersTable, {
      fields: [parentWalletsTable.parentId],
      references: [usersTable.id],
    }),
  }),
);

export const auditLogsRelations = relations(
  auditLogsTable,
  ({ one }) => ({
    user: one(usersTable, {
      fields: [auditLogsTable.userId],
      references: [usersTable.id],
    }),
  }),
);


// in relations.ts — add these two
export const staffInvitationsRelations = relations(
  staffInvitationsTable,
  ({ one }) => ({
    canteen: one(canteensTable, {
      fields: [staffInvitationsTable.canteenId],
      references: [canteensTable.id],
    }),
    invitedBy: one(usersTable, {
      fields: [staffInvitationsTable.invitedBy],
      references: [usersTable.id],
    }),
  }),
);