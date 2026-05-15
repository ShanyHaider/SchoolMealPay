import {
  boolean,
  index,
  integer,
  pgEnum,
  pgTable,
  text,
  timestamp,
  uuid,
  varchar,
} from "drizzle-orm/pg-core";
import { id, createdAt } from "../schemaHelpers";
import { usersTable } from "./users";
import { ordersTable } from "./orders";
import { studentsTable } from "./students";

export const feedbackTypeEnum = pgEnum("feedback_type", [
  "meal",
  "system",
  "feature_request",
  "bug_report",
]);

export const notificationChannelEnum = pgEnum("notification_channel", [
  "in_app",
  "email",
  "sms",
  "push",
]);

// Meal feedback submitted 2 hours after collection (SRS-219 to SRS-222).
// userId is null when anonymous (SRS-222).
export const mealFeedbackTable = pgTable(
  "meal_feedback",
  {
    id,
    orderId: uuid("order_id")
      .notNull()
      .references(() => ordersTable.id),
    studentId: uuid("student_id")
      .notNull()
      .references(() => studentsTable.id),
    userId: uuid("user_id").references(() => usersTable.id),
    rating: integer().notNull(), // 1–5
    comment: text(),
    isAnonymous: boolean("is_anonymous").notNull().default(false),
    isFlagged: boolean("is_flagged").notNull().default(false),
    adminResponse: text("admin_response"),
    submittedAt: createdAt,
  },
  (t) => [
    index("meal_feedback_student_idx").on(t.studentId),
    index("meal_feedback_order_idx").on(t.orderId),
  ],
);

// System/app feedback from any user (SRS-223 to SRS-226).
export const systemFeedbackTable = pgTable(
  "system_feedback",
  {
    id,
    userId: uuid("user_id")
      .notNull()
      .references(() => usersTable.id),
    type: feedbackTypeEnum().notNull(),
    rating: integer(), // optional usability rating
    message: text().notNull(),
    isFlagged: boolean("is_flagged").notNull().default(false),
    resolvedAt: timestamp("resolved_at", { withTimezone: true }),
    createdAt,
  },
  (t) => [
    index("system_feedback_user_idx").on(t.userId),
    index("system_feedback_type_idx").on(t.type),
  ],
);

// All notification events sent to users (SRS-210 to SRS-218).
// Dashboard queries: "show me unread notifications for this user"
// requires an index on (userId, isRead).
export const notificationsTable = pgTable(
  "notifications",
  {
    id,
    userId: uuid("user_id")
      .notNull()
      .references(() => usersTable.id, { onDelete: "cascade" }),
    type: varchar().notNull(), // e.g. "order_confirmed", "payment_failed", "meal_ready"
    title: varchar().notNull(),
    message: text().notNull(),
    channel: notificationChannelEnum().notNull().default("in_app"),
    isRead: boolean("is_read").notNull().default(false),
    sentAt: createdAt,
    readAt: timestamp("read_at", { withTimezone: true }),
  },
  (t) => [
    // Most common: show unread notifications for dashboard
    index("notifications_user_unread_idx").on(t.userId, t.isRead),
    index("notifications_user_sent_idx").on(t.userId, t.sentAt),
  ],
);
