"use server";

// db/actions/Admin.ts — full replacement
// Every public action now:
//   1. Calls assertRole() — auth + role check
//   2. Calls schema.parse() — validates and sanitises input
//   3. Runs the DB operation

import { db } from "@/drizzle/db";
import {
    classesTable
} from "@/drizzle/schema";
import { eq } from "drizzle-orm";
import { assertRole } from "@/lib/guards/serverGuards";
import {
    createClassSchema,
    updateClassSchema,
    type CreateClassInput,
    type UpdateClassInput,
} from "@/lib/validations/validators";
import {
    revalidateClassCache,
} from "@/lib/cacheRevalidation";

// ─── Classes ──────────────────────────────────────────────────────────────

export async function createClass(raw: CreateClassInput) {
    await assertRole(["school_admin"]);
    const data = createClassSchema.parse(raw);

    const [created] = await db.insert(classesTable).values(data).returning();
    revalidateClassCache(created.id);
}

export async function updateClass(id: string, raw: UpdateClassInput) {
    await assertRole(["school_admin"]);
    const data = updateClassSchema.parse(raw);

    await db
        .update(classesTable)
        .set({ ...data, updatedAt: new Date() })
        .where(eq(classesTable.id, id));

    revalidateClassCache(id);
}

export async function deleteClass(id: string) {
    await assertRole(["school_admin"]);

    await db.delete(classesTable).where(eq(classesTable.id, id));
    revalidateClassCache(id);
}
