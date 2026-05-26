import { db } from "@/drizzle/db";
import {
  aiMealSuggestionsTable,
  nutritionTrendsTable,
  nutritionTargetsTable,
} from "@/drizzle/schema";
import { eq, desc, and, gte } from "drizzle-orm";
import { unstable_cache } from "next/cache";
import { getGlobalTag, getUserTag } from "@/lib/cache";

/**
 * Recent AI meal suggestions for a student.
 * Used on the parent nutrition page's "Recommended" tab.
 */
export const getAiSuggestionsByStudent = unstable_cache(
  async (studentId: string, limit = 5) => {
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
  },
  ["ai-suggestions-by-student"],
  { tags: [getGlobalTag("ai-meal-suggestions")] },
);

/**
 * Nutrition trends for a student over the last N days.
 * Shown as informational tracking — not clinical predictions.
 */
export const getNutritionTrendsByStudent = unstable_cache(
  async (studentId: string, days = 30) => {
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
  },
  ["nutrition-trends-by-student"],
  { tags: [getGlobalTag("ai-meal-suggestions")] },
);

/**
 * National/school nutrition reference targets.
 * Used to contextualise a student's intake numbers.
 */
export const getNutritionTargets = unstable_cache(
  async () => {
    return db.query.nutritionTargetsTable.findMany();
  },
  ["nutrition-targets"],
  { tags: [getGlobalTag("ai-meal-suggestions")] },
);
