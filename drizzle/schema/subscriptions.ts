import {
  boolean,
  decimal,
  integer,
  pgEnum,
  pgTable,
  timestamp,
  uuid,
  varchar,
} from "drizzle-orm/pg-core";
import { id, createdAt, updatedAt } from "../schemaHelpers";
import { usersTable } from "./users";

export const subscriptionTierEnum = pgEnum("subscription_tier", [
  "free",
  "premium_school",
  "parent_pro",
]);

export const billingCycleEnum = pgEnum("billing_cycle", ["monthly", "annual"]);

export const subscriptionStatusEnum = pgEnum("subscription_status", [
  "trialing",
  "active",
  "past_due",
  "cancelled",
  "expired",
  "unpaid",
  "incomplete",
]);

export const invoiceStatusEnum = pgEnum("invoice_status", [
  "pending",
  "paid",
  "failed",
]);

// The school's current subscription state (SRS-17 to SRS-30).
// Single-tenant: exactly one row. Seed with tier="premium_school", status="active"
// and skip all tier-gating logic in app code — show billing screens as mockups.
// FIX: removed studentCount — was a denormalized counter that drifts on bulk
// deletes. Derive it at query time: SELECT COUNT(*) FROM students.
export const schoolSubscriptionTable = pgTable("school_subscription", {
  id,
  tier: subscriptionTierEnum().notNull().default("free"),
  status: subscriptionStatusEnum().notNull().default("trialing"),
  billingCycle: billingCycleEnum("billing_cycle"),

  // Trial tracking (SRS-36 to SRS-40)
  trialStartedAt: timestamp("trial_started_at", { withTimezone: true }),
  trialEndsAt: timestamp("trial_ends_at", { withTimezone: true }),
  trialUsed: boolean("trial_used").notNull().default(false),

  // Active subscription window
  currentPeriodStart: timestamp("current_period_start", { withTimezone: true }),
  currentPeriodEnd: timestamp("current_period_end", { withTimezone: true }),

  // Free tier student cap (SRS-19, SRS-42) — limit only, no counter
  studentLimit: integer("student_limit").notNull().default(50),

  // Gateway references
  gatewaySubscriptionId: varchar("gateway_subscription_id"),
  gatewayCustomerId: varchar("gateway_customer_id"),

  cancelledAt: timestamp("cancelled_at", { withTimezone: true }),
  revertToFreeAt: timestamp("revert_to_free_at", { withTimezone: true }),

  stripeCustomerId: varchar("stripe_customer_id").unique(),
  stripeSubscriptionId: varchar("stripe_subscription_id").unique(),

  createdAt,
  updatedAt,
});

// FIX: added subscriptionId FK — invoices were floating with no parent reference.
// FIX: status is now a proper enum instead of a free-text varchar.
export const subscriptionInvoicesTable = pgTable("subscription_invoices", {
  id,
  subscriptionId: uuid("subscription_id")
    .notNull()
    .references(() => schoolSubscriptionTable.id),
  amount: decimal({ precision: 10, scale: 2 }).notNull(),
  status: invoiceStatusEnum().notNull().default("pending"),
  // FIX: made nullable — parent Pro invoices don't always have a billing cycle
  billingCycle: billingCycleEnum("billing_cycle"),
  // FIX: added Stripe invoice tracking columns the webhook needs
  stripeInvoiceId: varchar("stripe_invoice_id").unique(),
  currency: varchar({ length: 3 }).notNull().default("PKR"),
  billingPeriodStart: timestamp("billing_period_start", { withTimezone: true }),
  billingPeriodEnd: timestamp("billing_period_end", { withTimezone: true }),
  gatewayInvoiceId: varchar("gateway_invoice_id"),
  paidAt: timestamp("paid_at", { withTimezone: true }),
  dueAt: timestamp("due_at", { withTimezone: true }),
  createdAt,
});

// Per-parent Parent Pro subscriptions (SRS-31 to SRS-35).
export const parentProSubscriptionsTable = pgTable("parent_pro_subscriptions", {
  id,
  parentId: uuid("parent_id")
    .notNull()
    .unique()
    .references(() => usersTable.id, { onDelete: "cascade" }),
  status: subscriptionStatusEnum().notNull().default("trialing"),

  // 7-day free trial (SRS-34)
  trialStartedAt: timestamp("trial_started_at", { withTimezone: true }),
  trialEndsAt: timestamp("trial_ends_at", { withTimezone: true }),
  trialUsed: boolean("trial_used").notNull().default(false),

  currentPeriodStart: timestamp("current_period_start", { withTimezone: true }),
  currentPeriodEnd: timestamp("current_period_end", { withTimezone: true }),

  gatewaySubscriptionId: varchar("gateway_subscription_id"),
  cancelledAt: timestamp("cancelled_at", { withTimezone: true }),

  // ADDED: Safe targeted Stripe integration columns
  stripeCustomerId: varchar("stripe_customer_id").unique(),
  stripeSubscriptionId: varchar("stripe_subscription_id").unique(),

  createdAt,
  updatedAt,
});
