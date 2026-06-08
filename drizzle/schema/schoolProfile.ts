import { pgEnum, pgTable, text, varchar } from "drizzle-orm/pg-core";
import { id, createdAt, updatedAt } from "../schemaHelpers";

export const schoolTypeEnum = pgEnum("school_type", ["primary", "secondary", "both"]);

export const schoolProfileTable = pgTable("school_profile", {
    id,
    name: varchar().notNull(),
    address: text(),
    city: varchar(),
    phone: varchar(),
    email: varchar(),
    logoUrl: varchar("logo_url"),
    primaryColor: varchar("primary_color").default("#000000"),
    timezone: varchar().notNull().default("Asia/Karachi"),
    academicYear: varchar("academic_year"),
    schoolType: schoolTypeEnum("school_type"),
    createdAt,
    updatedAt,
});