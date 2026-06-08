// db/schema/staffInvitations.ts
import { pgTable, pgEnum, varchar, uuid } from "drizzle-orm/pg-core";
import { id, createdAt } from "../schemaHelpers";
import { usersTable } from "./users";
import { canteensTable } from "./canteens";

export const invitationStatusEnum = pgEnum("invitation_status", [
    "pending",
    "accepted",
    "expired",
]);

export const staffInvitationsTable = pgTable("staff_invitations", {
    id,
    email: varchar().notNull().unique(),
    name: varchar().notNull(),
    phone: varchar(),
    canteenId: uuid("canteen_id").references(() => canteensTable.id, {
        onDelete: "set null",
    }),
    invitedBy: uuid("invited_by")
        .notNull()
        .references(() => usersTable.id),
    clerkInvitationId: varchar("clerk_invitation_id"),
    status: invitationStatusEnum().notNull().default("pending"),
    createdAt,
});