"use client";

import { useEffect, useState, useTransition } from "react";
import { Sparkles, RefreshCw, ChefHat, AlertTriangle, CheckCircle, Lightbulb } from "lucide-react";
import {
    generatePopulationNutritionInsight,
    type PopulationTrend,
} from "@/db/actions/admin/Nutrition";

const RATING_CONFIG = {
    Good: {
        bg: "bg-emerald-50 dark:bg-emerald-500/10",
        text: "text-emerald-700 dark:text-emerald-400",
        dot: "bg-emerald-500",
        Icon: CheckCircle,
    },
    "Needs Attention": {
        bg: "bg-amber-50 dark:bg-amber-500/10",
        text: "text-amber-700 dark:text-amber-400",
        dot: "bg-amber-500",
        Icon: AlertTriangle,
    },
    Critical: {
        bg: "bg-red-50 dark:bg-red-500/10",
        text: "text-red-600 dark:text-red-400",
        dot: "bg-red-500",
        Icon: AlertTriangle,
    },
} as const;

const PRIORITY_COLORS = [
    "bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400",
    "bg-orange-100 text-orange-700 dark:bg-orange-900/30 dark:text-orange-400",
    "bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400",
    "bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400",
];

function priorityColor(score: number) {
    if (score >= 9) return PRIORITY_COLORS[0];
    if (score >= 7) return PRIORITY_COLORS[1];
    if (score >= 5) return PRIORITY_COLORS[2];
    return PRIORITY_COLORS[3];
}

function priorityLabel(score: number) {
    if (score >= 9) return "Urgent";
    if (score >= 7) return "High";
    if (score >= 5) return "Medium";
    return "Low";
}

type InsightResult = Awaited<ReturnType<typeof generatePopulationNutritionInsight>>;

interface Props {
    schoolName: string;
    trends: PopulationTrend[];
    currentMenuItems: { id: string; name: string }[];
}

export function AdminAiInsightPanel({ schoolName, trends, currentMenuItems }: Props) {
    const [result, setResult] = useState<InsightResult | null>(null);
    const [isPending, startTransition] = useTransition();

    function load() {
        startTransition(async () => {
            const data = await generatePopulationNutritionInsight(schoolName, trends, currentMenuItems);
            setResult(data);
        });
    }

    useEffect(() => { load(); }, []);

    const config = result?.overallRating ? RATING_CONFIG[result.overallRating] : null;

    return (
        <div className="bg-(--bg-card) border border-(--border-card) rounded-3xl p-6 space-y-5">
            {/* Header */}
            <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                    <Sparkles size={15} className="text-violet-500" />
                    <span className="text-xs font-bold uppercase tracking-widest text-(--text-muted)">
                        AI Population Analysis
                    </span>
                </div>
                {!isPending && (
                    <button
                        onClick={load}
                        className="text-(--text-muted) hover:text-(--text-primary) transition-colors"
                        aria-label="Refresh analysis"
                    >
                        <RefreshCw size={13} />
                    </button>
                )}
            </div>

            {/* Loading skeleton */}
            {isPending && (
                <div className="space-y-3 animate-pulse">
                    <div className="h-4 bg-(--bg-tertiary) rounded-full w-3/4" />
                    <div className="h-3 bg-(--bg-tertiary) rounded-full w-full" />
                    <div className="h-3 bg-(--bg-tertiary) rounded-full w-5/6" />
                    <div className="grid grid-cols-2 gap-3 pt-2">
                        {[1, 2, 3, 4].map((i) => (
                            <div key={i} className="h-16 bg-(--bg-tertiary) rounded-xl" />
                        ))}
                    </div>
                </div>
            )}

            {!isPending && result && (
                <>
                    {/* Rating badge + headline */}
                    <div className="space-y-3">
                        {config && (
                            <div className={`inline-flex items-center gap-2 px-3 py-1.5 rounded-full text-xs font-bold ${config.bg} ${config.text}`}>
                                <config.Icon size={12} />
                                {result.overallRating}
                            </div>
                        )}
                        <p className="text-base font-semibold text-(--text-primary) leading-snug">
                            {result.headline}
                        </p>
                    </div>

                    {/* Key findings */}
                    {result.keyFindings.length > 0 && (
                        <div className="space-y-2">
                            <p className="text-xs font-bold uppercase tracking-widest text-(--text-muted)">
                                Key Findings
                            </p>
                            <ul className="space-y-2">
                                {result.keyFindings.map((f, i) => (
                                    <li key={i} className="flex items-start gap-2.5 text-sm text-(--text-secondary)">
                                        <Lightbulb size={13} className="mt-0.5 shrink-0 text-violet-400" />
                                        {f}
                                    </li>
                                ))}
                            </ul>
                        </div>
                    )}

                    {/* Menu gap suggestions */}
                    {result.menuGapSuggestions.length > 0 && (
                        <div className="space-y-3 pt-4 border-t border-(--border-card)">
                            <div className="flex items-center gap-2">
                                <ChefHat size={14} className="text-emerald-500" />
                                <p className="text-xs font-bold uppercase tracking-widest text-(--text-muted)">
                                    Recommended Menu Additions
                                </p>
                            </div>
                            <div className="space-y-2">
                                {result.menuGapSuggestions
                                    .sort((a, b) => b.priorityScore - a.priorityScore)
                                    .map((s, i) => (
                                        <div
                                            key={i}
                                            className="flex flex-col gap-1.5 p-3.5 bg-(--bg-tertiary) rounded-xl"
                                        >
                                            <div className="flex items-start justify-between gap-2">
                                                <p className="text-sm font-semibold text-(--text-primary) leading-tight">
                                                    {s.mealName}
                                                </p>
                                                <span className={`shrink-0 text-[10px] px-2 py-0.5 rounded-full font-bold uppercase tracking-wide ${priorityColor(s.priorityScore)}`}>
                                                    {priorityLabel(s.priorityScore)}
                                                </span>
                                            </div>
                                            <p className="text-xs text-(--text-secondary) leading-relaxed">
                                                {s.reason}
                                            </p>
                                            <div className="flex gap-1 flex-wrap mt-0.5">
                                                {s.targetNutrients.map((n) => (
                                                    <span
                                                        key={n}
                                                        className="text-[10px] px-2 py-0.5 rounded-full bg-(--bg-card) border border-(--border-card) text-(--text-muted) font-medium uppercase tracking-wide"
                                                    >
                                                        {n}
                                                    </span>
                                                ))}
                                            </div>
                                        </div>
                                    ))}
                            </div>
                        </div>
                    )}
                </>
            )}

            {!isPending && !result && (
                <p className="text-xs text-(--text-muted)">Could not load AI analysis.</p>
            )}
        </div>
    );
}