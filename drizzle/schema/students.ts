import {
  boolean,
  decimal,
  index,
  pgEnum,
  pgTable,
  text,
  unique,
  uuid,
  varchar,
} from "drizzle-orm/pg-core";
import { id, createdAt, updatedAt } from "../schemaHelpers";
import { usersTable } from "./users";

// ---------------------------------------------------------------------------
// Enums
// ---------------------------------------------------------------------------

export const allergenEnum = pgEnum("allergen", [
  "nuts",
  "gluten",
  "dairy",
  "eggs",
  "soy",
  "shellfish",
  "fish",
  "sesame",
]);

export const linkStatusEnum = pgEnum("link_status", [
  "pending",
  "approved",
  "rejected",
]);

// ---------------------------------------------------------------------------
// School profile (SRS-49 to SRS-52)
// Single-tenant: exactly one row. Seed this on first deploy.
// Stores everything an admin sets in School Profile Management.
// ---------------------------------------------------------------------------


// ---------------------------------------------------------------------------
// Classes — structured grade/section data managed by school admin.
// FIX: replaced free-text class/grade columns on students with a FK here.
// Prevents report breakage from "Grade 5" vs "5th Grade" vs "G5".
// e.g. { grade: "5", section: "A" } → "Grade 5 - A"
// ---------------------------------------------------------------------------
export const classesTable = pgTable("classes", {
  id,
  grade: varchar().notNull(), // "1" through "12", or "KG", "Pre-K"
  section: varchar().notNull(), // "A", "B", "C", "Blue", etc.
  createdAt,
  updatedAt,
});

// ---------------------------------------------------------------------------
// Students — not users, they don't log in.
// class/grade replaced by classId FK; allergies moved to studentAllergensTable.
// ---------------------------------------------------------------------------
export const studentsTable = pgTable("students", {
  id,
  name: varchar().notNull(),
  studentCode: varchar("student_code").notNull().unique(),
  classId: uuid("class_id").references(() => classesTable.id),
  imageUrl: varchar("image_url"),
  orderingEnabled: boolean("ordering_enabled").notNull().default(true),
  createdAt,
  updatedAt,
});

// Junction table: one row per allergen per student.
// Queryable: WHERE sa.allergen = 'nuts' to flag orders. (SRS-164)
export const studentAllergensTable = pgTable(
  "student_allergens",
  {
    id,
    studentId: uuid("student_id")
      .notNull()
      .references(() => studentsTable.id, { onDelete: "cascade" }),
    allergen: allergenEnum().notNull(),
  },
  (t) => [
    // A student can't have the same allergen listed twice
    unique().on(t.studentId, t.allergen),
    index("student_allergens_student_idx").on(t.studentId),
  ],
);

// ---------------------------------------------------------------------------
// Child profiles — dietary prefs & spending controls (parental data).
// FIX: removed free-text allergies field; it now lives in studentAllergensTable.
// FIX: removed free-text medicalConditions — stored as structured notes below.
// ---------------------------------------------------------------------------
export const childProfilesTable = pgTable("child_profiles", {
  id,
  studentId: uuid("student_id")
    .notNull()
    .unique()
    .references(() => studentsTable.id, { onDelete: "cascade" }),
  dietaryPreferences: text("dietary_preferences"), // still free-text — used for display/chatbot context only, not filtering
  medicalNotes: text("medical_notes"), // renamed from medicalConditions; display-only
  dailySpendingLimit: decimal("daily_spending_limit", {
    precision: 10,
    scale: 2,
  }),
  weeklySpendingLimit: decimal("weekly_spending_limit", {
    precision: 10,
    scale: 2,
  }),
  approvalThreshold: decimal("approval_threshold", { precision: 10, scale: 2 }),
  updatedAt,
});

// ---------------------------------------------------------------------------
// Parent-child links — approval workflow (SRS-53 to SRS-56)
// FIX: added unique constraint — prevents duplicate pending requests
// for the same parent+student pair.
// ---------------------------------------------------------------------------
export const parentChildLinksTable = pgTable(
  "parent_child_links",
  {
    id,
    parentId: uuid("parent_id")
      .notNull()
      .references(() => usersTable.id, { onDelete: "cascade" }),
    studentId: uuid("student_id")
      .notNull()
      .references(() => studentsTable.id, { onDelete: "cascade" }),
    status: linkStatusEnum().notNull().default("pending"),
    linkedAt: createdAt,
  },
  (t) => [
    // One link record per parent-student pair, regardless of status.
    // To re-request after rejection, the admin resets status on the existing row.
    unique().on(t.parentId, t.studentId),
    index("parent_child_links_parent_idx").on(t.parentId),
    index("parent_child_links_student_idx").on(t.studentId),
  ],
);