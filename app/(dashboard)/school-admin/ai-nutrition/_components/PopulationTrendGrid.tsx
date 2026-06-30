"use client";

import { PopulationTrend } from "@/db/actions/admin/Nutrition";
import { NutrientKey } from "@/db/actions/ai/nutrition";
import { Users, TrendingDown, TrendingUp, Minus } from "lucide-react";

const NUTRIENT_META: Record<NutrientKey, { label: string; unit: string; color: string }> = {
    calories: { label: "Calories", unit: "kcal", color: "bg-orange-500" },
    protein: { label: "Protein", unit: "g", color: "bg-blue-500" },
    carbs: { label: "Carbs", unit: "g", color: "bg-yellow-400" },
    fat: { label: "Fat", unit: "g", color: "bg-purple-500" },
    fiber: { label: "Fiber", unit: "g", color: "bg-emerald-500" },
};

const LEVEL_CONFIG = {
    on_track: {
        label: "On track",
        bg: "bg-emerald-50 dark:bg-emerald-500/10",
        text: "text-emerald-700 dark:text-emerald-400",
        icon: <Minus size={11} />,
    },
    low: {
        label: "Below target",
        bg: "bg-red-50 dark:bg-red-500/10",
        text: "text-red-600 dark:text-red-400",
        icon: <TrendingDown size={11} />,
    },
    high: {
        label: "Above target",
        bg: "bg-orange-50 dark:bg-orange-500/10",
        text: "text-orange-600 dark:text-orange-400",
        icon: <TrendingUp size={11} />,
    },
};

interface Props {
    trends: PopulationTrend[];
}

export function PopulationTrendGrid({ trends }: Props) {
    return (
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3">
            {trends.map((t) => {
                const meta = NUTRIENT_META[t.nutrient];
                const level = LEVEL_CONFIG[t.trendLevel];
                const pct = Math.min(t.percentOfTarget, 100);
                const affectedPct = Math.round((t.affectedStudentCount / t.totalStudentCount) * 100);

                return (
                    <div
                        key={t.nutrient}
                        className="flex flex-col gap-3 p-4 rounded-2xl border border-(--border-card) bg-(--bg-card)"
                    >
                        {/* Header */}
                        <div className="flex items-center justify-between">
                            <span className="text-xs font-bold uppercase tracking-widest text-(--text-muted)">
                                {meta.label}
                            </span>
                            <span className={`inline-flex items-center gap-1 text-[10px] font-bold px-2 py-0.5 rounded-full ${level.bg} ${level.text}`}>
                                {level.icon}
                                {level.label}
                            </span>
                        </div>

                        {/* Value */}
                        <div>
                            <p className="text-2xl font-bold text-(--text-primary) tabular-nums">
                                {t.averageDaily}
                                <span className="text-xs font-normal text-(--text-muted) ml-1">{meta.unit}</span>
                            </p>
                            <p className="text-xs text-(--text-muted) mt-0.5">
                                avg / student / day
                            </p>
                        </div>

                        {/* Progress bar */}
                        <div className="space-y-1">
                            <div className="h-1.5 bg-(--bg-tertiary) rounded-full overflow-hidden">
                                <div
                                    className={`h-full rounded-full transition-all duration-700 ${meta.color}`}
                                    style={{ width: `${pct}%`, opacity: t.trendLevel === "high" ? 0.6 : 0.9 }}
                                />
                            </div>
                            <p className="text-[10px] text-(--text-muted) tabular-nums">
                                {t.percentOfTarget}% of {t.targetDaily}{meta.unit} target
                            </p>
                        </div>

                        {/* Affected students */}
                        <div className="flex items-center gap-1.5 pt-1 border-t border-(--border-card)">
                            <Users size={10} className="text-(--text-muted)" />
                            <span className="text-[10px] text-(--text-muted)">
                                <span className="font-semibold text-(--text-secondary)">{affectedPct}%</span> of students affected
                            </span>
                        </div>
                    </div>
                );
            })}
        </div>
    );
}