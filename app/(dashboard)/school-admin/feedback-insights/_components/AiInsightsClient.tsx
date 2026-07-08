"use client";

import { useState } from "react";
import { DemandForecastPanel } from "../../_components/DemandForecastPanel";
import { FeedbackSentimentPanel } from "../../_components/FeedbackSentimentPanel";

interface Props {
    canteens: { id: string; name: string }[];
}

export function AiInsightsClient({ canteens }: Props) {
    const [canteenId, setCanteenId] = useState(canteens[0]?.id);

    return (
        <div className="space-y-5">
            {canteens.length > 1 && (
                <div className="flex gap-2 flex-wrap">
                    {canteens.map((c) => (
                        <button
                            key={c.id}
                            onClick={() => setCanteenId(c.id)}
                            className={`px-3 py-1.5 rounded-full text-xs font-bold border transition-colors ${canteenId === c.id
                                    ? "bg-(--accent) text-(--accent-text) border-(--accent)"
                                    : "bg-(--bg-tertiary) text-(--text-secondary) border-(--border-card)"
                                }`}
                        >
                            {c.name}
                        </button>
                    ))}
                </div>
            )}

            {canteenId && (
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
                    <DemandForecastPanel canteenId={canteenId} />
                    <FeedbackSentimentPanel canteenId={canteenId} />
                </div>
            )}
        </div>
    );
}