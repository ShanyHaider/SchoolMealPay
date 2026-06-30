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
import { notify, notifyMany } from "@/lib/notification/notify";
import { PushEvents } from "@/lib/notification/webpush";
import { notifyAdminLinkRequested } from "@/db/actions/Admin";

// ─── Students ─────────────────────────────────────────────────────────────────

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

    // Notify all approved parents linked to this student
    const [links, student] = await Promise.all([
        db.query.parentChildLinksTable.findMany({
            where: and(
                eq(parentChildLinksTable.studentId, studentId),
                eq(parentChildLinksTable.status, "approved"),
            ),
        }),
        db.query.studentsTable.findFirst({
            where: eq(studentsTable.id, studentId),
            columns: { name: true },
        }),
    ]);

    const name = student?.name ?? "Your child";
    const parentIds = links.map((l) => l.parentId);

    if (parentIds.length > 0) {
        notifyMany(parentIds, {
            type: enabled ? "ordering_enabled" : "ordering_disabled",
            event: enabled
                ? PushEvents.orderingEnabled(name)
                : PushEvents.orderingDisabled(name),
        }).catch(console.error);
    }
}

// ─── Child Profile ─────────────────────────────────────────────────────────────

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

export async function setStudentAllergens(
    studentId: string,
    allergens: (typeof studentAllergensTable.$inferInsert)["allergen"][],
) {
    await db
        .delete(studentAllergensTable)
        .where(eq(studentAllergensTable.studentId, studentId));

    if (allergens.length > 0) {
        await db
            .insert(studentAllergensTable)
            .values(allergens.map((allergen) => ({ studentId, allergen })));
    }

    revalidateStudentAllergenCache(studentId);
    revalidateStudentCache(studentId);
    revalidatePath("/parent/children");
    revalidatePath("/school-admin/students");
}

// ─── Parent-Child Links ────────────────────────────────────────────────────────

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

    // Notify school admins a new link request needs review
    if (link) {
        notifyAdminLinkRequested(parentId, studentId).catch(console.error);
    }

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
    const [student] = await db
        .select({ id: studentsTable.id })
        .from(studentsTable)
        .where(eq(studentsTable.studentCode, studentCode.trim()))
        .limit(1);

    if (!student) {
        throw new Error("Student not found. Please check the ID and try again.");
    }

    const [link] = await db
        .insert(parentChildLinksTable)
        .values({ parentId, studentId: student.id, status: "pending" })
        .onConflictDoNothing()
        .returning();

    revalidateParentChildLinkCache(parentId, student.id);
    revalidatePath("/parent/children");
    revalidatePath("/school-admin/students");

    if (link) {
        notifyAdminLinkRequested(parentId, student.id).catch(console.error);
    }

    return link;
}