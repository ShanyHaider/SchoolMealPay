// app/(dashboard)/school-admin/ai-nutrition/page.tsx

import { requireSchoolFeature } from "@/lib/guards/pageGuards";
import { db } from "@/drizzle/db";
import {
    nutritionTrendsTable,
    studentsTable,
    menuItemsTable,
} from "@/drizzle/schema";
import { eq, gte, sql } from "drizzle-orm";
import { AiNutritionClient } from "./_components/AiNutritionClient";
import type { NutrientKey } from "@/db/actions/ai/nutrition";
import { getSchoolProfile } from "@/db/queries/Admin";
import { auth } from '@clerk/nextjs/server';
import { redirect } from "next/navigation";
import type { PopulationTrend } from "@/db/actions/admin/Nutrition";


// ── Helpers ───────────────────────────────────────────────────────────────────

/** Aggregate per-student trends into a population-level view */
function aggregateTrends(
    rawTrends: {
        nutrient: string;
        averageDaily: string;
        targetDaily: string;
        percentOfTarget: string;
        trendLevel: "on_track" | "low" | "high";
    }[],
    totalStudents: number,
): PopulationTrend[] {
    // Group by nutrient
    const byNutrient = new Map<string, {
        sum: number; target: number; lowCount: number; highCount: number; count: number;
    }>();

    for (const t of rawTrends) {
        const key = t.nutrient as NutrientKey;
        const existing = byNutrient.get(key) ?? { sum: 0, target: 0, lowCount: 0, highCount: 0, count: 0 };
        existing.sum += parseFloat(t.averageDaily);
        existing.target = parseFloat(t.targetDaily); // same for all rows of same nutrient
        if (t.trendLevel === "low") existing.lowCount++;
        if (t.trendLevel === "high") existing.highCount++;
        existing.count++;
        byNutrient.set(key, existing);
    }

    const nutrientOrder: NutrientKey[] = ["calories", "protein", "carbs", "fat", "fiber"];

    return nutrientOrder
        .filter((n) => byNutrient.has(n))
        .map((nutrient) => {
            const d = byNutrient.get(nutrient)!;
            const averageDaily = Math.round(d.sum / d.count);
            const targetDaily = Math.round(d.target);
            const percentOfTarget = Math.round((averageDaily / targetDaily) * 100);

            // Most prevalent trend level wins
            let trendLevel: "on_track" | "low" | "high" = "on_track";
            if (d.lowCount > d.highCount && d.lowCount > d.count * 0.3) trendLevel = "low";
            else if (d.highCount > d.lowCount && d.highCount > d.count * 0.3) trendLevel = "high";

            const affectedStudentCount = Math.max(d.lowCount, d.highCount);

            return {
                nutrient,
                averageDaily,
                targetDaily,
                percentOfTarget,
                trendLevel,
                affectedStudentCount,
                totalStudentCount: totalStudents,
            };
        });
}

// ── Page ──────────────────────────────────────────────────────────────────────

export default async function AiNutritionPage() {
    await requireSchoolFeature("hasAiNutrition");

    const { userId } = await auth();
    if (!userId) redirect("/sign-in");

    const school = await getSchoolProfile();
    if (!school) throw new Error("School profile not found");

    // ── Fetch student count for this school ───────────────────────────────────
    const [{ count: totalStudents }] = await db
        .select({ count: sql<number>`count(*)::int` })
        .from(studentsTable);

    // ── Fetch the last 4 weeks of nutrition trends for all students ───────────
    const fourWeeksAgo = new Date();
    fourWeeksAgo.setDate(fourWeeksAgo.getDate() - 28);
    const periodStart = fourWeeksAgo.toISOString().split("T")[0];

    const rawTrends = await db
        .select({
            nutrient: nutritionTrendsTable.nutrient,
            averageDaily: nutritionTrendsTable.averageDaily,
            targetDaily: nutritionTrendsTable.targetDaily,
            percentOfTarget: nutritionTrendsTable.percentOfTarget,
            trendLevel: nutritionTrendsTable.trendLevel,
        })
        .from(nutritionTrendsTable)
        .where(gte(nutritionTrendsTable.periodStart, periodStart));

    // ── Today's active menu items ─────────────────────────────────────────────
    const menuItems = await db
        .select({ id: menuItemsTable.id, name: menuItemsTable.name })
        .from(menuItemsTable)
        .where(eq(menuItemsTable.isAvailable, true));

    // ── Aggregate into population trends ──────────────────────────────────────
    const populationTrends = aggregateTrends(rawTrends, totalStudents);

    return (
        <div className="max-w-6xl mx-auto space-y-6">
            <div>
                <h1 className="text-2xl font-bold tracking-tight" style={{ color: "var(--text-primary)" }}>
                    AI Nutrition
                </h1>
                <p className="text-sm mt-1" style={{ color: "var(--text-secondary)" }}>
                    Nutrition trends and AI meal suggestions across your student population.
                </p>
            </div>

            {!school ? (
                <div
                    className="rounded-2xl border p-10 text-center space-y-2"
                    style={{ background: "var(--bg-card)", borderColor: "var(--border-card)" }}
                >
                    <p className="text-sm font-medium" style={{ color: "var(--text-primary)" }}>
                        School profile not set up
                    </p>
                    <p className="text-xs" style={{ color: "var(--text-muted)" }}>
                        Complete your school profile setup before using AI Nutrition.
                    </p>
                </div>
            ) : totalStudents === 0 || rawTrends.length === 0 ? (
                <div
                    className="rounded-2xl border p-10 text-center space-y-2"
                    style={{ background: "var(--bg-card)", borderColor: "var(--border-card)" }}
                >
                    <p className="text-sm font-medium" style={{ color: "var(--text-primary)" }}>
                        Not enough data yet
                    </p>
                    <p className="text-xs" style={{ color: "var(--text-muted)" }}>
                    </p>
                </div>
            ) : (
                <AiNutritionClient
                    userId={userId}
                    schoolName={school.name}
                    trends={populationTrends}
                    currentMenuItems={menuItems}
                    totalStudents={totalStudents}
                    periodLabel="Last 4 weeks"
                />
            )}
        </div>
    );
}