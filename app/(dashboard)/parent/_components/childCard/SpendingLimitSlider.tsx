// app/(dashboard)/parent/_components/children/SpendingLimitSlider.tsx
"use client";

import { Sliders } from "lucide-react";
import { SPENDING_SLIDER } from "@/constants/parentDashboardConstants";
import { formatPKR } from "@/lib/currency";

interface SpendingLimitSliderProps {
    sliderLimit: number;
    hasChanges: boolean;
    isPending: boolean;
    onChange: (value: number) => void;
    onSave: () => void;
}

export function SpendingLimitSlider({
    sliderLimit,
    hasChanges,
    isPending,
    onChange,
    onSave,
}: SpendingLimitSliderProps) {
    const pct =
        ((sliderLimit - SPENDING_SLIDER.MIN) / (SPENDING_SLIDER.MAX - SPENDING_SLIDER.MIN)) * 100;

    return (
        <div
            className="p-4 rounded-xl border space-y-3"
            style={{
                background: "var(--bg-secondary)",
                borderColor: "var(--border-card)",
            }}
        >
            {/* Header row */}
            <div className="flex items-center justify-between">
                <span
                    className="text-[10px] font-bold uppercase tracking-wider flex items-center gap-1.5"
                    style={{ color: "var(--text-secondary)" }}
                >
                    <Sliders size={12} /> Daily Spending Limit
                </span>

                {/* Live value badge */}
                <span
                    className="text-xs font-black tabular-nums"
                    style={{ color: "var(--text-primary)" }}
                >
                    {formatPKR(sliderLimit)}
                    <span
                        className="ml-1 text-[10px] font-medium"
                        style={{ color: "var(--text-muted)" }}
                    >
                        / {SPENDING_SLIDER.MAX.toLocaleString()} max
                    </span>
                </span>
            </div>

            {/* Track labels */}
            <div className="flex justify-between text-[9px] font-bold tabular-nums px-0.5" style={{ color: "var(--text-muted)" }}>
                <span>{formatPKR(SPENDING_SLIDER.MIN)}</span>
                <span>{formatPKR(SPENDING_SLIDER.MAX / 2)}</span>
                <span>{formatPKR(SPENDING_SLIDER.MAX)}</span>
            </div>

            {/* Slider + apply */}
            <div className="flex items-center gap-3">
                <div className="relative flex-1 h-5 flex items-center">
                    {/* Custom filled track */}
                    <div
                        className="absolute left-0 h-1.5 rounded-full pointer-events-none"
                        style={{
                            width: `${pct}%`,
                            background: "var(--accent)",
                            opacity: 0.85,
                        }}
                    />
                    <input
                        type="range"
                        min={SPENDING_SLIDER.MIN}
                        max={SPENDING_SLIDER.MAX}
                        step={SPENDING_SLIDER.STEP}
                        value={sliderLimit}
                        onChange={(e) => onChange(parseFloat(e.target.value))}
                        className="w-full h-1.5 rounded-full appearance-none cursor-pointer bg-transparent relative z-10"
                        style={{
                            // The track underneath the thumb
                            background: `linear-gradient(to right, var(--accent) ${pct}%, var(--border-card) ${pct}%)`,
                        }}
                        aria-label="Daily spending limit"
                    />
                </div>

                {hasChanges && (
                    <button
                        onClick={onSave}
                        disabled={isPending}
                        className="px-3 py-1.5 rounded-lg text-[10px] font-bold uppercase hover:opacity-90 active:scale-95 transition-all disabled:opacity-50"
                        style={{
                            background: "var(--accent)",
                            color: "var(--accent-text)",
                        }}
                    >
                        {isPending ? "…" : "Apply"}
                    </button>
                )}
            </div>

            {/* Contextual hint */}
            <p className="text-[9px] leading-relaxed" style={{ color: "var(--text-muted)" }}>
                Orders over this amount require your approval before they&apos;re placed.
            </p>
        </div>
    );
}