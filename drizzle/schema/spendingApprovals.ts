import {
  decimal,
  index,
  pgEnum,
  pgTable,
  text,
  timestamp,
  uuid,
} from "drizzle-orm/pg-core";
import { id, createdAt } from "../schemaHelpers";
import { usersTable } from "./users";
import { studentsTable } from "./students";
import { ordersTable } from "./orders";

export const approvalStatusEnum = pgEnum("approval_status", [
  "pending",
  "approved",
  "rejected",
]);

// When an order exceeds the parent's approvalThreshold (SRS-154),
// it is held here until the parent approves or rejects it.
// Query pattern: "show me all pending approvals for this parent"
// used on the parent dashboard to show orders awaiting action.
export const spendingApprovalsTable = pgTable(
  "spending_approvals",
  {
    id,
    orderId: uuid("order_id")
      .notNull()
      .unique()
      .references(() => ordersTable.id, { onDelete: "cascade" }),
    parentId: uuid("parent_id")
      .notNull()
      .references(() => usersTable.id),
    studentId: uuid("student_id")
      .notNull()
      .references(() => studentsTable.id),
    orderAmount: decimal("order_amount", { precision: 10, scale: 2 }).notNull(),
    status: approvalStatusEnum().notNull().default("pending"),
    respondedAt: timestamp("responded_at", { withTimezone: true }),
    rejectionReason: text("rejection_reason"),
    createdAt,
  },
  (t) => [
    index("spending_approvals_parent_status_idx").on(t.parentId, t.status),
    index("spending_approvals_student_idx").on(t.studentId),
  ],
);
