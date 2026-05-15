import {
  boolean,
  index,
  jsonb,
  pgTable,
  text,
  uuid,
  varchar,
} from "drizzle-orm/pg-core";
import { id, createdAt, updatedAt } from "../schemaHelpers";
import { usersTable } from "./users";

// Key-value store for global system settings (SRS-205 to SRS-209).
// Examples of keys: "default_currency", "session_timeout_minutes",
// "password_min_length", "2fa_required", "maintenance_mode".
// value stored as JSONB to handle strings, numbers, booleans, arrays.
// All changes are captured in audit_logs — never update silently.
// FIX: updatedBy was varchar — now a proper uuid FK to usersTable.
export const systemConfigTable = pgTable(
  "system_config",
  {
    id,
    key: varchar().notNull().unique(),
    value: jsonb().notNull(),
    description: text(),
    isSecret: boolean("is_secret").notNull().default(false),
    updatedBy: uuid("updated_by").references(() => usersTable.id),
    createdAt,
    updatedAt,
  },
  (t) => [index("system_config_key_idx").on(t.key)],
);

// Configurable templates for each notification event type (SRS-211).
// Variables in body/title use {{placeholder}} syntax.
// e.g. "Hi {{parent_name}}, {{student_name}}'s meal is ready for pickup."
export const notificationTemplatesTable = pgTable(
  "notification_templates",
  {
    id,
    eventType: varchar("event_type").notNull().unique(),
    title: varchar().notNull(),
    body: text().notNull(),
    channels: jsonb().notNull(), // e.g. ["in_app", "email"]
    isActive: boolean("is_active").notNull().default(true),
    createdAt,
    updatedAt,
  },
  (t) => [index("notification_templates_event_type_idx").on(t.eventType)],
);
