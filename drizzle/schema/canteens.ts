// db/schema/canteens.ts
// operatingHours varchar → operatingFrom + operatingUntil time columns
// Run a migration: drop operating_hours, add operating_from / operating_until

import {
  boolean,
  index,
  integer,
  pgTable,
  time,
  uuid,
  varchar,
} from "drizzle-orm/pg-core";
import { id, createdAt, updatedAt } from "../schemaHelpers";
import { usersTable } from "./users";

export const canteensTable = pgTable(
  "canteens",
  {
    id,
    name: varchar().notNull(),
    location: varchar(),
    // Replaces the old `operating_hours` varchar.
    // Stored as SQL TIME (HH:MM:SS); we only write/read HH:MM from the UI.
    operatingFrom: time("operating_from"),
    operatingUntil: time("operating_until"),
    capacity: integer(),
    isActive: boolean("is_active").notNull().default(true),
    createdAt,
    updatedAt,
  },
  (t) => [index("canteens_active_idx").on(t.isActive)],
);

// A staff member can only be assigned to one canteen at a time (SRS-102).
// assignedBy is logged for compliance (SRS-104).
export const canteenStaffAssignmentsTable = pgTable(
  "canteen_staff_assignments",
  {
    id,
    staffId: uuid("staff_id")
      .notNull()
      .unique()
      .references(() => usersTable.id, { onDelete: "cascade" }),
    canteenId: uuid("canteen_id")
      .notNull()
      .references(() => canteensTable.id, { onDelete: "cascade" }),
    assignedBy: uuid("assigned_by")
      .references(() => usersTable.id, { onDelete: "set null" }),
    assignedAt: createdAt,
  },
  (t) => [index("canteen_staff_assignments_canteen_idx").on(t.canteenId)],
);