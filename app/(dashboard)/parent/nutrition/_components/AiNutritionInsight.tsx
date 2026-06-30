"use client";

import { useEffect, useState, useTransition } from "react";
import { Sparkles, ShieldAlert, RefreshCw, ArrowRightLeft } from "lucide-react";
import { generateNutritionSummary } from "@/db/actions/ai/nutrition";
import type { NutritionTargets, NutritionSummary } from "@/db/actions/ai/nutrition";
import type { NutritionAverages } from "@/types/nutritionTypes";
import { MealSuggestions } from "./MealSuggestions";

const VERDICT_CONFIG = {
    Healthy: { bg: "bg-emerald-50 dark:bg-emerald-500/10", text: "text-emerald-700 dark:text-emerald-400", dot: "bg-emerald-500" },
    "Needs Improvement": { bg: "bg-amber-50 dark:bg-amber-500/10", text: "text-amber-700 dark:text-amber-400", dot: "bg-amber-500" },
    Concerning: { bg: "bg-red-50 dark:bg-red-500/10", text: "text-red-600 dark:text-red-400", dot: "bg-red-500" },
} as const;

interface Props {
    studentId: string;
    childName: string;
    avg: NutritionAverages;
    targets: NutritionTargets;
    topMeals: { name: string; healthStatus: string }[];
    menuItems: { id: string; name: string }[];
}

export function AiNutritionInsight({ studentId, childName, avg, targets, topMeals, menuItems }: Props) {
    const [result, setResult] = useState<NutritionSummary | null>(null);
    const [isPending, startTransition] = useTransition();

    function load() {
        startTransition(async () => {
            const data = await generateNutritionSummary(childName, avg, targets, topMeals);
            setResult(data);
        });
    }

    useEffect(() => { load(); }, []);

    const verdict = result?.verdict ?? null;
    const config = verdict ? VERDICT_CONFIG[verdict] : null;

    return (
        <div className="space-y-4">
            <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                    <Sparkles size={14} className="text-violet-500" />
                    <span className="text-xs font-bold uppercase tracking-widest text-(--text-muted)">AI Analysis</span>
                </div>
                {!isPending && (
                    <button onClick={load} className="text-(--text-muted) hover:text-(--text-primary) transition-colors">
                        <RefreshCw size={13} />
                    </button>
                )}
            </div>

            {isPending && (
                <div className="space-y-2 animate-pulse">
                    <div className="h-3 bg-(--bg-tertiary) rounded-full w-full" />
                    <div className="h-3 bg-(--bg-tertiary) rounded-full w-4/5" />
                    <div className="h-3 bg-(--bg-tertiary) rounded-full w-3/5" />
                </div>
            )}

            {!isPending && result && (
                <div className="space-y-4">
                    {config && (
                        <div className={`inline-flex items-center gap-2 px-3 py-1 rounded-full text-xs font-bold ${config.bg} ${config.text}`}>
                            <span className={`w-1.5 h-1.5 rounded-full ${config.dot}`} />
                            {result.verdict}
                        </div>
                    )}

                    <p className="text-sm text-(--text-secondary) leading-relaxed">{result.summary}</p>

                    {result.concerns.length > 0 && (
                        <div className="space-y-1.5">
                            <p className="text-xs font-bold uppercase tracking-widest text-(--text-muted)">Concerns</p>
                            {result.concerns.map((c, i) => (
                                <div key={i} className="flex items-start gap-2 text-sm text-red-600 dark:text-red-400">
                                    <ShieldAlert size={13} className="mt-0.5 shrink-0" />
                                    {c}
                                </div>
                            ))}
                        </div>
                    )}

                    {result.swaps.length > 0 && (
                        <div className="space-y-2">
                            <p className="text-xs font-bold uppercase tracking-widest text-(--text-muted)">Suggested Swaps</p>
                            {result.swaps.map((s, i) => (
                                <div key={i} className="flex flex-col gap-0.5 p-3 bg-(--bg-tertiary) rounded-xl text-sm">
                                    <div className="flex items-center gap-2 font-medium text-(--text-primary)">
                                        {s.current && s.current !== "None" && (
                                            <>
                                                <span>{s.current}</span>
                                                <ArrowRightLeft size={12} className="text-(--text-muted) shrink-0" />
                                            </>
                                        )}
                                        <span className="text-emerald-600 dark:text-emerald-400">{s.suggestion}</span>
                                    </div>
                                    <p className="text-xs text-(--text-muted)">{s.reason}</p>
                                </div>
                            ))}
                        </div>
                    )}

                    {(result.verdict === "Needs Improvement" || result.verdict === "Concerning") && (
                        <MealSuggestions
                            studentId={studentId}
                            childName={childName}
                            avg={avg}
                            targets={targets}
                            topMeals={topMeals}
                            verdict={result.verdict}
                            concerns={result.concerns}
                            menuItems={menuItems}
                        />
                    )}
                </div>
            )}

            {!isPending && !result && (
                <p className="text-xs text-(--text-muted)">Could not load AI analysis.</p>
            )}
        </div>
    );
}