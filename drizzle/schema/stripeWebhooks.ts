import { pgTable, varchar } from "drizzle-orm/pg-core";
import { createdAt } from "../schemaHelpers";

// ADDED: Crucial production idempotency log for incoming Stripe signals
export const stripeWebhookEventsTable = pgTable("stripe_webhook_events", {
  // Use the native Stripe-Event-ID ('evt_...') directly as the primary key
  id: varchar("id").primaryKey(),
  type: varchar().notNull(),
  processedAt: createdAt,
});
