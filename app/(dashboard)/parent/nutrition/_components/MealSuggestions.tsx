"use client";

import { useEffect, useState, useTransition } from "react";
import { Sparkles, UtensilsCrossed, ChevronRight, RefreshCw } from "lucide-react";
import { generateMealSuggestions } from "@/db/actions/Nutrition";
import type { MealSuggestion, NutritionTargets } from "@/db/actions/Nutrition";
import type { NutritionAverages } from "@/types/nutritionTypes";
import Link from "next/link";

const NUTRIENT_COLORS: Record<string, string> = {
    calories: "bg-orange-100 text-orange-700 dark:bg-orange-900/30 dark:text-orange-400",
    protein: "bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400",
    carbs: "bg-yellow-100 text-yellow-700 dark:bg-yellow-900/30 dark:text-yellow-400",
    fat: "bg-purple-100 text-purple-700 dark:bg-purple-900/30 dark:text-purple-400",
    fiber: "bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400",
};

export function suggestionsStorageKey(childName: string) {
    return `meal_suggestions_${childName.toLowerCase().replace(/\s+/g, "_")}`;
}

interface Props {
    childName: string;
    avg: NutritionAverages;
    targets: NutritionTargets;
    topMeals: { name: string; healthStatus: string }[];
    verdict: string;
    concerns: string[];
    // Actual canteen menu items — AI picks only from these
    menuItems: { id: string; name: string }[];
}

export function MealSuggestions({
    childName, avg, targets, topMeals, verdict, concerns, menuItems,
}: Props) {
    const [suggestions, setSuggestions] = useState<MealSuggestion[] | null>(null);
    const [isPending, startTransition] = useTransition();
    const [noMenu, setNoMenu] = useState(false);

    function persist(data: MealSuggestion[]) {
        try {
            localStorage.setItem(
                suggestionsStorageKey(childName),
                JSON.stringify({ suggestions: data, generatedAt: Date.now() }),
            );
        } catch { }
    }

    function load(skipCache = false) {
        if (menuItems.length === 0) { setNoMenu(true); return; }
        if (!skipCache) {
            try {
                const raw = localStorage.getItem(suggestionsStorageKey(childName));
                if (raw) {
                    const { suggestions: cached, generatedAt } = JSON.parse(raw);
                    if (Date.now() - generatedAt < 24 * 60 * 60 * 1000) {
                        setSuggestions(cached);
                        return;
                    }
                }
            } catch { }
        }
        startTransition(async () => {
            const data = await generateMealSuggestions(
                childName, avg, targets, topMeals, verdict, concerns, menuItems,
            );
            if (data) { persist(data); setSuggestions(data); }
        });
    }

    useEffect(() => { load(); }, []);

    if (noMenu) return null;

    return (
        <div className="mt-6 pt-6 border-t border-(--border-card) space-y-4">
            <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                    <UtensilsCrossed size={14} className="text-emerald-500" />
                    <span className="text-xs font-bold uppercase tracking-widest text-(--text-muted)">
                        Suggested from today's menu
                    </span>
                </div>
                {!isPending && (
                    <button onClick={() => load(true)} className="text-(--text-muted) hover:text-(--text-primary) transition-colors">
                        <RefreshCw size={13} />
                    </button>
                )}
            </div>

            {isPending && (
                <div className="space-y-3 animate-pulse">
                    {[1, 2, 3].map((i) => (
                        <div key={i} className="p-3 bg-(--bg-tertiary) rounded-xl space-y-2">
                            <div className="h-3 bg-(--border-card) rounded-full w-2/5" />
                            <div className="h-2.5 bg-(--border-card) rounded-full w-4/5" />
                        </div>
                    ))}
                </div>
            )}

            {!isPending && suggestions && suggestions.length > 0 && (
                <div className="space-y-3">
                    {suggestions.map((s, i) => (
                        <div key={i} className="flex flex-col gap-2 p-3 bg-(--bg-tertiary) rounded-xl">
                            <div className="flex items-start justify-between gap-2">
                                <p className="text-sm font-semibold text-(--text-primary) leading-tight">{s.name}</p>
                                <div className="flex gap-1 shrink-0 flex-wrap justify-end">
                                    {s.targetNutrients.slice(0, 2).map((n) => (
                                        <span key={n} className={`text-[10px] px-2 py-0.5 rounded-full font-bold uppercase tracking-wide ${NUTRIENT_COLORS[n] ?? "bg-(--bg-card) text-(--text-muted)"}`}>
                                            {n}
                                        </span>
                                    ))}
                                </div>
                            </div>
                            <p className="text-xs text-(--text-secondary) leading-relaxed">{s.description}</p>
                            <div className="flex flex-wrap gap-1.5">
                                {s.highlights.map((h, j) => (
                                    <span key={j} className="flex items-center gap-1 text-[10px] px-2 py-0.5 bg-(--bg-card) border border-(--border-card) rounded-full text-(--text-secondary) font-medium">
                                        <Sparkles size={8} className="text-violet-400" />
                                        {h}
                                    </span>
                                ))}
                            </div>
                        </div>
                    ))}
                    <Link
                        href="/parent/menu"
                        className="flex items-center justify-between w-full mt-1 px-4 py-2.5 bg-(--accent) text-(--accent-text) rounded-xl text-sm font-semibold hover:bg-(--accent-hover) transition-colors"
                    >
                        <span>Order these meals</span>
                        <ChevronRight size={16} />
                    </Link>
                </div>
            )}

            {!isPending && !suggestions && (
                <p className="text-xs text-(--text-muted)">No matching meals found in today's menu.</p>
            )}
        </div>
    );
}