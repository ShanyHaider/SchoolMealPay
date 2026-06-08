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
import { revalidatePath } from "next/cache";

// ─── Students ──────────────────────────────────────────────────


export async function toggleStudentOrdering(
    studentId: string,
    enabled: boolean,
) {
    await db
        .update(studentsTable)
        .set({ orderingEnabled: enabled, updatedAt: new Date() })
        .where(eq(studentsTable.id, studentId));

    revalidateStudentCache(studentId);
    revalidatePath("/parent/children");
    revalidatePath("/school-admin/students");
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
    revalidatePath("/parent/children");
    revalidatePath(`/parent/children/${profile.studentId}`);

}

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

    revalidatePath("/parent/children");
    revalidatePath("/school-admin/students");
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
    revalidatePath("/parent/children");
    revalidatePath("/school-admin/students");

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
    revalidatePath("/parent/children");
    revalidatePath("/school-admin/students");
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
    revalidatePath("/parent/children");
    revalidatePath("/school-admin/students");
}

export async function requestParentChildLinkByCode(
    parentId: string,
    studentCode: string,
) {
    // 1. Resolve studentCode → student UUID
    const [student] = await db
        .select({ id: studentsTable.id })
        .from(studentsTable)
        .where(eq(studentsTable.studentCode, studentCode.trim()))
        .limit(1);

    if (!student) {
        throw new Error("Student not found. Please check the ID and try again.");
    }

    // 2. Insert the link using the real UUID
    const [link] = await db
        .insert(parentChildLinksTable)
        .values({ parentId, studentId: student.id, status: "pending" })
        .onConflictDoNothing()
        .returning();

    revalidateParentChildLinkCache(parentId, student.id);
    revalidatePath("/parent/children");
    revalidatePath("/school-admin/students");

    return link;
}