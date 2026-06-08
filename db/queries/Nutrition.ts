import { db } from "@/drizzle/db";
import { nutritionTrendsTable, nutritionTargetsTable } from "@/drizzle/schema";
import { eq, desc } from "drizzle-orm";
import { cacheLife, cacheTag } from "next/cache";
import { getGlobalTag, getStudentTag } from "@/lib/cache";

export async function getNutritionTrendsByStudent(studentId: string) {
    "use cache";
    cacheLife("hours");
    cacheTag(
        getGlobalTag("nutrition-trends"),
        getStudentTag("nutrition-trends", studentId),
    );
    return db.query.nutritionTrendsTable.findMany({
        where: eq(nutritionTrendsTable.studentId, studentId),
        orderBy: desc(nutritionTrendsTable.periodEnd),
    });
}

export async function getLatestNutritionTrendsByStudent(studentId: string) {
    "use cache";
    cacheLife("hours");
    cacheTag(
        getGlobalTag("nutrition-trends"),
        getStudentTag("nutrition-trends", studentId),
    );
    // Get the most recent trend entry per nutrient
    const all = await db.query.nutritionTrendsTable.findMany({
        where: eq(nutritionTrendsTable.studentId, studentId),
        orderBy: desc(nutritionTrendsTable.periodEnd),
    });

    // Keep only the latest entry per nutrient
    const seen = new Set<string>();
    return all.filter((t) => {
        if (seen.has(t.nutrient)) return false;
        seen.add(t.nutrient);
        return true;
    });
}

export async function getNutritionTargets() {
    "use cache";
    cacheLife("days");
    cacheTag(getGlobalTag("nutrition-targets"));
    return db.query.nutritionTargetsTable.findMany();
}

export async function getDefaultNutritionTarget() {
    "use cache";
    cacheLife("days");
    cacheTag(getGlobalTag("nutrition-targets"));
    return db.query.nutritionTargetsTable.findFirst({
        where: eq(nutritionTargetsTable.isDefault, true),
    });
}