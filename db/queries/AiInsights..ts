import { db } from "@/drizzle/db";
import {
  aiMealSuggestionsTable,
  nutritionTrendsTable,
  nutritionTargetsTable,
} from "@/drizzle/schema";
import { eq, desc, and, gte } from "drizzle-orm";
import { cacheLife, cacheTag } from "next/cache";
import { getGlobalTag, getStudentTag } from "@/lib/cache";

/**
 * Recent AI meal suggestions for a student.
 * Used on the parent nutrition page's "Recommended" tab.
 */
export async function getAiSuggestionsByStudent(studentId: string, limit = 5) {
  "use cache";
  cacheLife("minutes");
  cacheTag(getGlobalTag("ai-meal-suggestions"), getStudentTag("ai-meal-suggestions", studentId));
  return db.query.aiMealSuggestionsTable.findMany({
    where: eq(aiMealSuggestionsTable.studentId, studentId),
    orderBy: [desc(aiMealSuggestionsTable.generatedAt)],
    limit,
    with: {
      menuItem: {
        columns: {
          id: true,
          name: true,
          price: true,
          category: true,
          calories: true,
          isVegetarian: true,
        },
      },
    },
  });
}

/**
 * Nutrition trends for a student over the last N days.
 * Shown as informational tracking — not clinical predictions.
 */
export async function getNutritionTrendsByStudent(studentId: string, days = 30) {
  "use cache";
  cacheLife("minutes");
  cacheTag(getGlobalTag("nutrition-trends"), getStudentTag("nutrition-trends", studentId));
  const since = new Date();
  since.setDate(since.getDate() - days);
  const sinceStr = since.toISOString().split("T")[0];

  return db.query.nutritionTrendsTable.findMany({
    where: and(
      eq(nutritionTrendsTable.studentId, studentId),
      gte(nutritionTrendsTable.periodEnd, sinceStr),
    ),
    orderBy: [desc(nutritionTrendsTable.periodEnd)],
  });
}

/**
 * National/school nutrition reference targets.
 * Used to contextualise a student's intake numbers.
 */
export async function getNutritionTargets() {
  "use cache";
  cacheLife("hours"); // Rarely changes
  cacheTag(getGlobalTag("nutrition-targets"));
  return db.query.nutritionTargetsTable.findMany();
}
