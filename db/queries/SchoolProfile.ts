"use server";

import { db } from "@/drizzle/db";
import { count } from "drizzle-orm";
import {
    schoolProfileTable,
    studentsTable,
    canteensTable,
    classesTable,
} from "@/drizzle/schema";
import { cacheLife, cacheTag } from "next/cache";
import { getGlobalTag } from "@/lib/cache";

export async function getSchoolProfile() {
    "use cache";
    cacheLife("hours");
    cacheTag(getGlobalTag("school-profile"));

    return (await db.query.schoolProfileTable.findFirst()) ?? null;
}

export async function getSchoolStats() {
    "use cache";
    cacheLife("minutes");
    cacheTag(
        getGlobalTag("students"),
        getGlobalTag("canteens"),
        getGlobalTag("classes"),
        getGlobalTag("school-subscription"),
    );

    const [[studentRow], [canteenRow], [classRow]] = await Promise.all([
        db.select({ count: count() }).from(studentsTable),
        db.select({ count: count() }).from(canteensTable),
        db.select({ count: count() }).from(classesTable),
    ]);

    return {
        studentCount: studentRow?.count ?? 0,
        canteenCount: canteenRow?.count ?? 0,
        classCount: classRow?.count ?? 0,
    };
}