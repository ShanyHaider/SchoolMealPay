"use client";

import { useEffect, useState, useTransition } from "react";
import { TrendingUp, TrendingDown, Minus, RefreshCw, Package } from "lucide-react";
import { generateDemandForecast } from "@/db/actions/admin/DemandForecast";

const TREND_ICON = { increasing: TrendingUp, decreasing: TrendingDown, stable: Minus };
const TREND_COLOR = {
    increasing: "text-emerald-600 bg-emerald-50 dark:bg-emerald-500/10",
    decreasing: "text-red-600 bg-red-50 dark:bg-red-500/10",
    stable: "text-(--text-muted) bg-(--bg-tertiary)",
};

export function DemandForecastPanel({ canteenId }: { canteenId: string }) {
    const [data, setData] = useState<Awaited<ReturnType<typeof generateDemandForecast>> | null>(null);
    const [isPending, startTransition] = useTransition();

    function load() {
        startTransition(async () => setData(await generateDemandForecast(canteenId)));
    }
    useEffect(() => { load(); }, []);

    return (
        <div className="bg-(--bg-card) border border-(--border-card) rounded-3xl p-6 space-y-5">
            <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                    <Package size={15} className="text-blue-500" />
                    <span className="text-xs font-bold uppercase tracking-widest text-(--text-muted)">
                        7-Day Demand Forecast
                    </span>
                </div>
                {!isPending && (
                    <button onClick={load} className="text-(--text-muted) hover:text-(--text-primary)">
                        <RefreshCw size={13} />
                    </button>
                )}
            </div>

            {isPending && (
                <div className="space-y-3 animate-pulse">
                    {[1, 2, 3].map((i) => <div key={i} className="h-14 bg-(--bg-tertiary) rounded-xl" />)}
                </div>
            )}

            {!isPending && data && data.forecasts.length === 0 && (
                <p className="text-xs text-(--text-muted)">Not enough order history yet to forecast.</p>
            )}

            {!isPending && data && data.forecasts.slice(0, 6).map((f) => {
                const Icon = TREND_ICON[f.trend];
                const totalNext7 = f.predictions.reduce((s, p) => s + p.predictedQuantity, 0);
                return (
                    <div key={f.menuItemId} className="flex items-center justify-between p-3.5 bg-(--bg-tertiary) rounded-xl">
                        <div>
                            <p className="text-sm font-semibold text-(--text-primary)">{f.menuItemName}</p>
                            <p className="text-xs text-(--text-muted)">~{totalNext7} servings expected this week</p>
                        </div>
                        <span className={`flex items-center gap-1 text-[10px] px-2 py-1 rounded-full font-bold uppercase ${TREND_COLOR[f.trend]}`}>
                            <Icon size={11} /> {f.trend}
                        </span>
                    </div>
                );
            })}
        </div>
    );
}