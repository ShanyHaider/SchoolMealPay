import {
  pgTable,
  text,
  timestamp,
  uuid,
  pgEnum,
  boolean,
} from "drizzle-orm/pg-core";
import { usersTable } from "./users"; // adjust import path

export const demoStatusEnum = pgEnum("demo_status", [
  "pending",
  "completed",
  "cancelled",
]);
export const contactStatusEnum = pgEnum("contact_status", [
  "unread",
  "read",
  "resolved",
]);

export const newsletterSubscribersTable = pgTable("newsletter_subscribers", {
  id: uuid("id").primaryKey().defaultRandom(),
  email: text("email").notNull().unique(),
  subscribedAt: timestamp("subscribed_at").defaultNow().notNull(),
  isActive: boolean("is_active").default(true).notNull(),
  convertedUserId: uuid("converted_user_id").references(() => usersTable.id, {
    onDelete: "set null",
  }),
});

export const demoRequestsTable = pgTable("demo_requests", {
  id: uuid("id").primaryKey().defaultRandom(),
  name: text("name").notNull(),
  email: text("email").notNull(),
  school: text("school").notNull(),
  role: text("role").notNull(),
  phone: text("phone"),
  preferredDate: text("preferred_date"),
  preferredSlot: text("preferred_slot").notNull(),
  status: demoStatusEnum("status").default("pending").notNull(),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  convertedUserId: uuid("converted_user_id").references(() => usersTable.id, {
    onDelete: "set null",
  }),
});

export const contactSubmissionsTable = pgTable("contact_submissions", {
  id: uuid("id").primaryKey().defaultRandom(),
  name: text("name").notNull(),
  email: text("email").notNull(),
  topic: text("topic").notNull(),
  message: text("message").notNull(),
  status: contactStatusEnum("status").default("unread").notNull(),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  convertedUserId: uuid("converted_user_id").references(() => usersTable.id, {
    onDelete: "set null",
  }),
});

export const processedClerkEmailsTable = pgTable("processed_clerk_emails", {
  id: text("id").primaryKey(), // Clerk's email object id, e.g. "email_xxx"
  slug: text("slug").notNull(),
  processedAt: timestamp("processed_at").defaultNow().notNull(),
});