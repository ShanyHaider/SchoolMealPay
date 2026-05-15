import { decimal, index, pgEnum, pgTable, uuid } from "drizzle-orm/pg-core";
import { id, createdAt } from "../schemaHelpers";
import { usersTable } from "./users";
import { canteensTable } from "./canteens";
import { inventoryItemsTable } from "./menu";
import { ordersTable } from "./orders";

export const inventoryChangeReasonEnum = pgEnum("inventory_change_reason", [
  "order_fulfilled", // automatic reduction when order delivered (SRS-169)
  "manual_add", // staff restocking
  "manual_remove", // staff correction
  "waste", // spoilage / wastage (SRS-170)
  "expired",
]);

// Append-only log of every inventory movement (SRS-170).
// Powers waste analysis reports (SRS-189) and ingredient-vs-order tracking.
// orderId is null for manual adjustments.
// FIX: added indexes — "give me all movements for this canteen" and
// "give me all waste entries for analysis" are common queries.
export const inventoryUsageLogsTable = pgTable(
  "inventory_usage_logs",
  {
    id,
    canteenId: uuid("canteen_id")
      .notNull()
      .references(() => canteensTable.id),
    inventoryItemId: uuid("inventory_item_id")
      .notNull()
      .references(() => inventoryItemsTable.id),
    orderId: uuid("order_id").references(() => ordersTable.id),
    performedBy: uuid("performed_by").references(() => usersTable.id),
    reason: inventoryChangeReasonEnum().notNull(),
    quantityBefore: decimal("quantity_before", {
      precision: 10,
      scale: 3,
    }).notNull(),
    quantityChanged: decimal("quantity_changed", {
      precision: 10,
      scale: 3,
    }).notNull(),
    quantityAfter: decimal("quantity_after", {
      precision: 10,
      scale: 3,
    }).notNull(),
    createdAt,
  },
  (t) => [
    index("inv_logs_canteen_item_idx").on(t.canteenId, t.inventoryItemId),
    index("inv_logs_reason_idx").on(t.reason),
  ],
);
