"use server";

// db/actions/Admin.ts — full replacement
// Every public action now:
//   1. Calls assertRole() — auth + role check
//   2. Calls schema.parse() — validates and sanitises input
//   3. Runs the DB operation

import { db } from "@/drizzle/db";
import {
    studentsTable,
} from "@/drizzle/schema";
import { eq } from "drizzle-orm";
import { assertRole, assertSchoolStudentLimit } from "@/lib/guards/serverGuards";
import {
    createStudentSchema,
    updateStudentSchema,
    type CreateStudentInput,
    type UpdateStudentInput,

} from "@/lib/validations/validators";
import {
    revalidateStudentCache,
} from "@/lib/cacheRevalidation";



export async function createStudent(raw: CreateStudentInput) {
    await assertRole(["school_admin"]);
    await assertSchoolStudentLimit();
    const data = createStudentSchema.parse(raw);

    const [created] = await db
        .insert(studentsTable)
        .values({
            name: data.name,
            studentCode: data.studentCode.trim().toUpperCase(),
            classId: data.classId || undefined,
            imageUrl: data.imageUrl || undefined,
        })
        .returning();

    const allergens = data.allergenIds ?? [];
    if (allergens.length > 0) {
        const { studentAllergensTable } = await import("@/drizzle/schema");
        type AllergenValue = (typeof studentAllergensTable.$inferInsert)["allergen"];
        await db.insert(studentAllergensTable).values(
            allergens.map((allergen) => ({
                studentId: created.id,
                allergen: allergen as AllergenValue,
            })),
        );
    }

    revalidateStudentCache(created.id);
}

export async function updateStudent(id: string, raw: UpdateStudentInput) {
    await assertRole(["school_admin"]);
    const data = updateStudentSchema.parse(raw);

    await db
        .update(studentsTable)
        .set({ ...data, updatedAt: new Date() })
        .where(eq(studentsTable.id, id));

    revalidateStudentCache(id);
}

export async function deleteStudent(id: string) {
    await assertRole(["school_admin"]);
    await db.delete(studentsTable).where(eq(studentsTable.id, id));
    revalidateStudentCache(id);
}