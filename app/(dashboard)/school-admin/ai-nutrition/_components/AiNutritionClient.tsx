"use client";

import { PopulationTrendGrid } from "./PopulationTrendGrid";
import { AdminAiInsightPanel } from "./AdminAiInsightPanel";
import { AdminNutritionChat } from "./AdminNutritionChat";
import { PopulationTrend } from "@/db/actions/admin/Nutrition";

interface Props {
    userId: string; // add this
    schoolName: string;
    trends: PopulationTrend[];
    currentMenuItems: { id: string; name: string }[];
    totalStudents: number;
    periodLabel: string; // e.g. "Last 4 weeks"
}

export function AiNutritionClient({
    schoolName,
    trends,
    currentMenuItems,
    totalStudents,
    periodLabel,
    userId,
}: Props) {
    return (
        <div className="space-y-6">
            {/* Period + student count context */}
            <div className="flex items-center gap-3 flex-wrap">
                <span className="text-xs px-3 py-1.5 rounded-full bg-(--bg-tertiary) border border-(--border-card) text-(--text-muted) font-medium">
                    {periodLabel}
                </span>
                <span className="text-xs px-3 py-1.5 rounded-full bg-(--bg-tertiary) border border-(--border-card) text-(--text-muted) font-medium">
                    {totalStudents} students
                </span>
            </div>

            {/* Nutrient trend cards */}
            <section className="space-y-3">
                <h2 className="text-sm font-bold text-(--text-primary)">
                    Population Nutrition Overview
                </h2>
                <PopulationTrendGrid trends={trends} />
            </section>

            {/* AI insight + chat side by side on large screens */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
                <section>
                    <AdminAiInsightPanel
                        schoolName={schoolName}
                        trends={trends}
                        currentMenuItems={currentMenuItems}
                    />
                </section>
                <section>
                    <AdminNutritionChat
                        userId={userId}
                        schoolName={schoolName}
                        trends={trends}
                        currentMenuItems={currentMenuItems}
                    />
                </section>
            </div>
        </div>
    );
}