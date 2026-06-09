// db/schema/staffInvitations.ts
import { pgTable, pgEnum, varchar, uuid, timestamp } from "drizzle-orm/pg-core";
import { id, createdAt } from "../schemaHelpers";
import { usersTable } from "./users";

export const invitationStatusEnum = pgEnum("invitation_status", [
    "pending",
    "accepted",
    "expired",
]);

export const staffInvitationsTable = pgTable("staff_invitations", {
    id,
    email: varchar("email", { length: 255 }).notNull().unique(),
    name: varchar("name", { length: 255 }),           // exists in DB
    phone: varchar("phone", { length: 50 }),           // exists in DB
    clerkInvitationId: varchar("clerk_invitation_id", { length: 255 }), // exists in DB
    role: varchar("role", { length: 50 })
        .$type<"canteen_staff" | "school_admin">()
        .default("canteen_staff")
        .notNull(),
    canteenId: uuid("canteen_id"),
    status: varchar("status", { length: 20 }).default("pending").notNull(),
    invitedBy: uuid("invited_by")
        .references(() => usersTable.id, { onDelete: "set null" }), // no .notNull()
    createdAt
});