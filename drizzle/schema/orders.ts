import {
  boolean,
  date,
  decimal,
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
import { studentsTable } from "./students";
import { canteensTable } from "./canteens";
import { menuItemsTable } from "./menu";

export const orderStatusEnum = pgEnum("order_status", [
  "pending",
  "preparing",
  "ready",
  "delivered",
  "cancelled",
]);

// parentId = who ordered/paid; studentId = who eats.
// qrCode is generated on confirmation; qrUsed prevents duplicate scans (SRS-134).
// preparationDeadlineAt = last moment a parent can modify/cancel (SRS-127).
// After this timestamp, order is locked — set it when the order is placed,
// e.g. orderDate 08:00 minus 30 minutes = 07:30 the same morning.
export const ordersTable = pgTable(
  "orders",
  {
    id,
    studentId: uuid("student_id")
      .notNull()
      .references(() => studentsTable.id),
    parentId: uuid("parent_id")
      .notNull()
      .references(() => usersTable.id),
    canteenId: uuid("canteen_id")
      .notNull()
      .references(() => canteensTable.id),
    status: orderStatusEnum().notNull().default("pending"),
    totalAmount: decimal("total_amount", { precision: 10, scale: 2 }).notNull(),
    taxAmount: decimal("tax_amount", { precision: 10, scale: 2 })
      .notNull()
      .default("0"),
    notes: text(),

    // QR pickup (SRS-131 to SRS-136)
    qrCode: varchar("qr_code").unique(),
    qrUsed: boolean("qr_used").notNull().default(false),
    qrInvalidatedAt: timestamp("qr_invalidated_at", { withTimezone: true }),

    // Modification/cancellation deadline (SRS-127)
    // Set at order creation time. App checks this before allowing edits.
    preparationDeadlineAt: timestamp("preparation_deadline_at", {
      withTimezone: true,
    }),

    // Recurring order support (SRS-126)
    isRecurring: boolean("is_recurring").notNull().default(false),
    recurringGroupId: uuid("recurring_group_id"), // all orders in a recurring series share this UUID

    orderDate: date("order_date").notNull(),
    placedAt: createdAt,
    collectedAt: timestamp("collected_at", { withTimezone: true }),
  },
  (t) => [
    // Most common query: "give me all orders for this student"
    index("orders_student_idx").on(t.studentId),
    // Dashboard query: "show me today's pending orders for this canteen"
    index("orders_status_date_idx").on(t.status, t.orderDate),
    // Parent order history page
    index("orders_parent_date_idx").on(t.parentId, t.orderDate),
    // Canteen operations: all orders for a canteen on a date
    index("orders_canteen_date_idx").on(t.canteenId, t.orderDate),
  ],
);

export const orderItemsTable = pgTable("order_items", {
  id,
  orderId: uuid("order_id")
    .notNull()
    .references(() => ordersTable.id, { onDelete: "cascade" }),
  menuItemId: uuid("menu_item_id")
    .notNull()
    .references(() => menuItemsTable.id),
  quantity: integer().notNull().default(1),
  unitPrice: decimal("unit_price", { precision: 10, scale: 2 }).notNull(),
});
