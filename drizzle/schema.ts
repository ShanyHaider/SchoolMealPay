// Core auth & users
export * from "./schema/users";

// Students & parental linking
export * from "./schema/students";

// Canteen setup
export * from "./schema/canteens";

// Menu, daily scheduling & inventory
export * from "./schema/menu";

// Orders & order items  ← moved up, before inventoryLogs
export * from "./schema/orders";

// Inventory logs ← now after orders (fixes the circular ref)
export * from "./schema/inventoryLogs";

// Parental controls
export * from "./schema/parentalControls";
export * from "./schema/spendingApprovals";

// Payments
export * from "./schema/transactions";

// Subscriptions & billing
export * from "./schema/subscriptions";

// AI & nutrition
export * from "./schema/aiInsights";
export * from "./schema/nutritionTargets";

// Feedback & notifications
export * from "./schema/feedback";

// System administration
export * from "./schema/systemConfig";
export * from "./schema/auditLogs";

// Chatbot
export * from "./schema/chatbot";

// StripeWebhooks
export * from "./schema/stripeWebhooks";

export * from "./schema/staffInvitationTable";

export * from "./schema/schoolProfile";

export * from "./schema/pushSubscriptions";

export * from "./schema/marketing"

// Relations — must be last, after all tables are exported
export * from "./relations";