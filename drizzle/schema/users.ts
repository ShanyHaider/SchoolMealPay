import { boolean, pgEnum, pgTable, varchar } from "drizzle-orm/pg-core";
import { createdAt, id, updatedAt } from "../schemaHelpers";

export const roleEnum = pgEnum("role", [
  "system_admin",
  "school_admin",
  "canteen_staff",
  "parent",
]);

export const usersTable = pgTable("users", {
  id,
  clerkId: varchar("clerk_id").notNull().unique(), // Clerk auth user ID
  email: varchar().notNull().unique(),
  name: varchar().notNull(),
  phone: varchar(),
  imageUrl: varchar("image_url"),
  role: roleEnum().notNull().default("parent"),
  isActive: boolean("is_active").notNull().default(true),
  createdAt,
  updatedAt,
});
