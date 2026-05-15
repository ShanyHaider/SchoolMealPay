"use server";

import { db } from "@/drizzle/db";
import {
  studentsTable,
  childProfilesTable,
  studentAllergensTable,
  parentChildLinksTable,
} from "@/drizzle/schema";
import { and, eq } from "drizzle-orm";
import {
  revalidateStudentCache,
  revalidateChildProfileCache,
  revalidateStudentAllergenCache,
  revalidateParentChildLinkCache,
} from "@/lib/cacheRevalidation";

// ─── Students ──────────────────────────────────────────────────

export async function createStudent(
  student: typeof studentsTable.$inferInsert,
) {
  const [created] = await db.insert(studentsTable).values(student).returning();

  revalidateStudentCache(created.id);
  return created;
}

export async function updateStudent(
  studentId: string,
  updates: Partial<typeof studentsTable.$inferInsert>,
) {
  await db
    .update(studentsTable)
    .set({ ...updates, updatedAt: new Date() })
    .where(eq(studentsTable.id, studentId));

  revalidateStudentCache(studentId);
}

export async function toggleStudentOrdering(
  studentId: string,
  enabled: boolean,
) {
  await db
    .update(studentsTable)
    .set({ orderingEnabled: enabled, updatedAt: new Date() })
    .where(eq(studentsTable.id, studentId));

  revalidateStudentCache(studentId);
}

// ─── Child Profile ─────────────────────────────────────────────

export async function upsertChildProfile(
  profile: typeof childProfilesTable.$inferInsert,
) {
  await db
    .insert(childProfilesTable)
    .values(profile)
    .onConflictDoUpdate({
      target: [childProfilesTable.studentId],
      set: profile,
    });

  revalidateChildProfileCache(profile.studentId!);
}

// ─── Allergens ─────────────────────────────────────────────────

// Replaces all allergens for a student in one operation
export async function setStudentAllergens(
  studentId: string,
  allergens: (typeof studentAllergensTable.$inferInsert)["allergen"][],
) {
  // Delete all existing then re-insert selected ones
  await db
    .delete(studentAllergensTable)
    .where(eq(studentAllergensTable.studentId, studentId));

  if (allergens.length > 0) {
    await db
      .insert(studentAllergensTable)
      .values(allergens.map((allergen) => ({ studentId, allergen })));
  }

  revalidateStudentAllergenCache(studentId);
  // Also bust student cache since allergens are usually fetched with student
  revalidateStudentCache(studentId);
}

// ─── Parent-Child Links ────────────────────────────────────────

export async function requestParentChildLink(
  parentId: string,
  studentId: string,
) {
  const [link] = await db
    .insert(parentChildLinksTable)
    .values({ parentId, studentId, status: "pending" })
    .onConflictDoNothing()
    .returning();

  revalidateParentChildLinkCache(parentId, studentId);
  return link;
}

export async function approveParentChildLink(
  parentId: string,
  studentId: string,
) {
  await db
    .update(parentChildLinksTable)
    .set({ status: "approved" })
    .where(
      and(
        eq(parentChildLinksTable.parentId, parentId),
        eq(parentChildLinksTable.studentId, studentId),
      ),
    );

  revalidateParentChildLinkCache(parentId, studentId);
}

export async function rejectParentChildLink(
  parentId: string,
  studentId: string,
) {
  await db
    .update(parentChildLinksTable)
    .set({ status: "rejected" })
    .where(
      and(
        eq(parentChildLinksTable.parentId, parentId),
        eq(parentChildLinksTable.studentId, studentId),
      ),
    );

  revalidateParentChildLinkCache(parentId, studentId);
}
