import {
  decimal,
  index,
  integer,
  pgEnum,
  pgTable,
  timestamp,
  uuid,
  varchar,
} from "drizzle-orm/pg-core";
import { id, createdAt } from "../schemaHelpers";
import { usersTable } from "./users";
import { ordersTable } from "./orders";

export const paymentMethodEnum = pgEnum("payment_method", [
  "stripe",
  "jazzcash",
  "easypaisa",
]);

export const transactionStatusEnum = pgEnum("transaction_status", [
  "pending",
  "success",
  "failed",
  "refunded",
]);

// Every payment attempt is recorded, including failures (SRS-144).
// transactionRef is the ID returned by the payment gateway.
// Query pattern: "show me all transactions for this parent" (payment history page)
// and "show me all failed transactions" (admin dashboard for retries).
export const transactionsTable = pgTable(
  "transactions",
  {
    id,
    orderId: uuid("order_id")
      .notNull()
      .references(() => ordersTable.id),
    parentId: uuid("parent_id")
      .notNull()
      .references(() => usersTable.id),
    transactionRef: varchar("transaction_ref").unique(),
    amount: decimal({ precision: 10, scale: 2 }).notNull(),
    paymentMethod: paymentMethodEnum("payment_method").notNull(),
    status: transactionStatusEnum().notNull().default("pending"),
    failureReason: varchar("failure_reason"),
    retryCount: integer("retry_count").notNull().default(0), // was decimal — now proper integer
    processedAt: timestamp("processed_at", { withTimezone: true }),
    createdAt,
  },
  (t) => [
    index("transactions_parent_idx").on(t.parentId),
    index("transactions_status_idx").on(t.status),
    index("transactions_order_idx").on(t.orderId),
  ],
);
