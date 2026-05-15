import {
  boolean,
  index,
  integer,
  pgTable,
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
    operatingHours: varchar("operating_hours"),
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
      .notNull()
      .references(() => usersTable.id),
    assignedAt: createdAt,
  },
  (t) => [index("canteen_staff_assignments_canteen_idx").on(t.canteenId)],
);
