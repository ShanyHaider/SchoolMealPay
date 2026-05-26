import { index, jsonb, pgTable, uuid, varchar } from "drizzle-orm/pg-core";
import { id, createdAt } from "../schemaHelpers";
import { usersTable } from "./users";

// Immutable audit trail for all sensitive actions (SRS-51, SRS-89, SRS-104, SRS-195, SRS-209).
// Never update or delete rows in this table.
// Query pattern: "show me what user X changed" and
// "show me all changes to canteen Y" for compliance audits.
export const auditLogsTable = pgTable(
  "audit_logs",
  {
    id,
    userId: uuid("user_id").references(() => usersTable.id, {
      onDelete: "set null",
    }),
    action: varchar().notNull(), // e.g. "role_updated", "canteen_staff_assigned"
    entityType: varchar("entity_type").notNull(), // e.g. "user", "canteen", "order"
    entityId: uuid("entity_id"),
    oldValues: jsonb("old_values"),
    newValues: jsonb("new_values"),
    ipAddress: varchar("ip_address"),
    createdAt,
  },
  (t) => [
    index("audit_logs_entity_idx").on(t.entityType, t.entityId),
    index("audit_logs_user_idx").on(t.userId),
    index("audit_logs_created_idx").on(t.createdAt),
  ],
);
