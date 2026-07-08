// db/actions/admin/SyncNutritionTrends.ts
"use server";

import { db } from "@/drizzle/db";
import {
    studentsTable,
    ordersTable,
    orderItemsTable,
    menuItemsTable,
    nutritionTrendsTable,
} from "@/drizzle/schema";
import { eq, gte, and } from "drizzle-orm";
import { assertRole } from "@/lib/guards/serverGuards";

type NutrientKey = "calories" | "protein" | "carbs" | "fat" | "fiber";

const TARGETS: Record<NutrientKey, number> = {
    calories: 2000,
    protein: 50,
    carbs: 260,
    fat: 70,
    fiber: 25,
};

export async function syncNutritionTrends() {
    await assertRole(["school_admin", "system_admin"]);

    // Last 28 days
    const since = new Date();
    since.setDate(since.getDate() - 28);
    const periodStart = since.toISOString().split("T")[0];
    const periodEnd = new Date().toISOString().split("T")[0];

    const students = await db.select({ id: studentsTable.id }).from(studentsTable);

    for (const student of students) {
        // Get delivered orders in the period
        const orders = await db
            .select({
                calories: menuItemsTable.calories,
                proteinG: menuItemsTable.proteinG,
                carbsG: menuItemsTable.carbsG,
                fatG: menuItemsTable.fatG,
                fiberG: menuItemsTable.fiberG,
                quantity: orderItemsTable.quantity,
                orderDate: ordersTable.orderDate,
            })
            .from(ordersTable)
            .innerJoin(orderItemsTable, eq(orderItemsTable.orderId, ordersTable.id))
            .innerJoin(menuItemsTable, eq(menuItemsTable.id, orderItemsTable.menuItemId))
            .where(
                and(
                    eq(ordersTable.studentId, student.id),
                    eq(ordersTable.status, "delivered"),
                    gte(ordersTable.orderDate, periodStart),
                )
            );

        if (orders.length === 0) continue;

        // Sum per day
        const byDay = new Map<string, Record<NutrientKey, number>>();
        for (const row of orders) {
            const day = row.orderDate;
            if (!byDay.has(day)) byDay.set(day, { calories: 0, protein: 0, carbs: 0, fat: 0, fiber: 0 });
            const d = byDay.get(day)!;
            const qty = row.quantity;
            d.calories += (row.calories ?? 0) * qty;
            d.protein += parseFloat(row.proteinG ?? "0") * qty;
            d.carbs += parseFloat(row.carbsG ?? "0") * qty;
            d.fat += parseFloat(row.fatG ?? "0") * qty;
            d.fiber += parseFloat(row.fiberG ?? "0") * qty;
        }

        const days = byDay.size;
        const totals: Record<NutrientKey, number> = { calories: 0, protein: 0, carbs: 0, fat: 0, fiber: 0 };
        for (const day of byDay.values()) {
            for (const k of Object.keys(totals) as NutrientKey[]) {
                totals[k] += day[k];
            }
        }

        // Upsert one row per nutrient per student
        for (const nutrient of Object.keys(TARGETS) as NutrientKey[]) {
            const averageDaily = Math.round(totals[nutrient] / days);
            const targetDaily = TARGETS[nutrient];
            const percentOfTarget = Math.round((averageDaily / targetDaily) * 100);
            const trendLevel =
                percentOfTarget < 70 ? "low" :
                    percentOfTarget > 130 ? "high" :
                        "on_track";

            await db
                .insert(nutritionTrendsTable)
                .values({
                    studentId: student.id,
                    nutrient,
                    averageDaily: averageDaily.toString(),
                    targetDaily: targetDaily.toString(),
                    percentOfTarget: percentOfTarget.toString(),
                    trendLevel,
                    periodStart,
                    periodEnd,
                })
                .onConflictDoUpdate({
                    target: [nutritionTrendsTable.studentId, nutritionTrendsTable.nutrient, nutritionTrendsTable.periodStart],
                    set: {
                        averageDaily: averageDaily.toString(),
                        percentOfTarget: percentOfTarget.toString(),
                        trendLevel,
                        periodEnd,
                    },
                });
        }

        
    }

    return { synced: students.length };
}