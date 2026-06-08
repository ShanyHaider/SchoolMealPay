import { db } from "@/drizzle/db";
import {
    ordersTable,
    orderItemsTable,
    menuItemsTable,
    nutritionTrendsTable,
    nutritionTargetsTable,
    studentsTable,
} from "@/drizzle/schema";
import { eq, gte, and, inArray } from "drizzle-orm";
import { revalidateTag } from "next/cache";
import { getGlobalTag } from "@/lib/cache";

const NUTRIENTS = [
    { key: "calories", column: "calories" as const, label: "Calories" },
    { key: "protein_g", column: "proteinG" as const, label: "Protein" },
    { key: "fiber_g", column: "fiberG" as const, label: "Fiber" },
    { key: "carbs_g", column: "carbsG" as const, label: "Carbohydrates" },
    { key: "fat_g", column: "fatG" as const, label: "Fat" },
] as const;

function getTrendLevel(percent: number): "on_track" | "low" | "high" {
    if (percent < 80) return "low";
    if (percent > 120) return "high";
    return "on_track";
}

function getDisplayNote(
    nutrient: string,
    trendLevel: "on_track" | "low" | "high",
    percent: number,
): string {
    const pct = Math.round(percent);
    if (trendLevel === "on_track") {
        return `${nutrient} intake has been within the recommended range this period.`;
    }
    if (trendLevel === "low") {
        return `${nutrient} intake has averaged ${pct}% of the reference amount over this period.`;
    }
    return `${nutrient} intake has averaged ${pct}% of the reference amount — above the reference range.`;
}

/**
 * Generates nutrition trends for a single student over the past N days.
 * Call this from a weekly cron or on-demand.
 */
export async function generateNutritionTrendsForStudent(
    studentId: string,
    periodDays = 7,
) {
    const periodEnd = new Date();
    const periodStart = new Date();
    periodStart.setDate(periodEnd.getDate() - periodDays);

    const periodStartStr = periodStart.toISOString().split("T")[0];
    const periodEndStr = periodEnd.toISOString().split("T")[0];

    // 1. Fetch all delivered orders for this student in the period
    const orders = await db.query.ordersTable.findMany({
        where: and(
            eq(ordersTable.studentId, studentId),
            eq(ordersTable.status, "delivered"),
            gte(ordersTable.orderDate, periodStartStr),
        ),
        with: {
            orderItems: {
                with: { menuItem: true },
            },
        },
    });

    if (orders.length === 0) return;

    // 2. Get default nutrition target
    const target = await db.query.nutritionTargetsTable.findFirst({
        where: eq(nutritionTargetsTable.isDefault, true),
    });

    if (!target) return;

    // 3. Aggregate daily totals per nutrient
    // Group order items by date, sum nutrition per day, then average across days
    const dailyTotals: Record<string, Record<string, number>> = {};

    for (const order of orders) {
        const date = order.orderDate;
        if (!dailyTotals[date]) {
            dailyTotals[date] = {
                calories: 0,
                protein_g: 0,
                fiber_g: 0,
                carbs_g: 0,
                fat_g: 0,
            };
        }
        for (const item of order.orderItems) {
            const m = item.menuItem;
            if (!m) continue;
            const qty = item.quantity;
            dailyTotals[date].calories += (m.calories ?? 0) * qty;
            dailyTotals[date].protein_g +=
                parseFloat(m.proteinG ?? "0") * qty;
            dailyTotals[date].fiber_g += parseFloat(m.fiberG ?? "0") * qty;
            dailyTotals[date].carbs_g += parseFloat(m.carbsG ?? "0") * qty;
            dailyTotals[date].fat_g += parseFloat(m.fatG ?? "0") * qty;
        }
    }

    const days = Object.keys(dailyTotals).length;
    if (days === 0) return;

    // 4. Compute averages and upsert trend rows
    const targetMap: Record<string, number | null> = {
        calories: target.dailyCalories,
        protein_g: target.dailyProteinG ? parseFloat(target.dailyProteinG) : null,
        fiber_g: target.dailyFiberG ? parseFloat(target.dailyFiberG) : null,
        carbs_g: target.dailyCarbsG ? parseFloat(target.dailyCarbsG) : null,
        fat_g: target.dailyFatG ? parseFloat(target.dailyFatG) : null,
    };

    for (const nutrient of NUTRIENTS) {
        const totalAcrossDays = Object.values(dailyTotals).reduce(
            (sum, day) => sum + (day[nutrient.key] ?? 0),
            0,
        );
        const averageDaily = totalAcrossDays / days;
        const targetDaily = targetMap[nutrient.key];

        if (targetDaily === null || targetDaily === 0) continue;

        const percentOfTarget = (averageDaily / targetDaily) * 100;
        const trendLevel = getTrendLevel(percentOfTarget);
        const displayNote = getDisplayNote(
            nutrient.label,
            trendLevel,
            percentOfTarget,
        );

        await db.insert(nutritionTrendsTable).values({
            studentId,
            nutrient: nutrient.key,
            averageDaily: averageDaily.toFixed(2),
            targetDaily: targetDaily.toFixed(2),
            percentOfTarget: percentOfTarget.toFixed(1),
            trendLevel,
            periodStart: periodStartStr,
            periodEnd: periodEndStr,
            displayNote,
        });
    }

    revalidateTag(getGlobalTag("nutrition-trends"), "default");
}

/**
 * Run for all students — call this from your weekly cron route.
 */
export async function generateNutritionTrendsForAll() {
    const students = await db.query.studentsTable.findMany();
    for (const student of students) {
        await generateNutritionTrendsForStudent(student.id);
    }
}