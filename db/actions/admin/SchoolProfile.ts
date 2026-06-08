"use server";

import { eq } from "drizzle-orm";
import { db } from "@/drizzle/db";
import { schoolProfileTable } from "@/drizzle/schema";
import { revalidateSchoolProfileCache } from "@/lib/cacheRevalidation";
import { assertRole } from "@/lib/guards/serverGuards";
import { SchoolProfileInput, schoolProfileSchema } from "@/lib/validations/schoolProfile";

export async function upsertSchoolProfile(input: SchoolProfileInput) {
    await assertRole(["school_admin", "system_admin"]);

    const data = schoolProfileSchema.parse(input);

    const existing = await db.query.schoolProfileTable.findFirst();

    if (existing) {
        await db
            .update(schoolProfileTable)
            .set({ ...data, updatedAt: new Date() })
            .where(eq(schoolProfileTable.id, existing.id));
    } else {
        await db.insert(schoolProfileTable).values({
            ...data,
            timezone: data.timezone ?? "Asia/Karachi",
        });
    }

    await revalidateSchoolProfileCache();
}