"use client";

import React from "react";

interface NutrientBarProps {
  label: string;
  icon: React.ReactNode;
  value: number;
  target: number;
  unit: string;
  color: string;
  accentColor: string; // e.g. "orange" — used for the glow and over-target highlight
}

export function NutrientBar({
  label,
  icon,
  value,
  target,
  unit,
  color,
  accentColor,
}: NutrientBarProps) {
  const raw = (value / target) * 100;
  const pct = Math.min(raw, 100);
  const isOver = raw > 100;

  let status: string;
  let statusBg: string;
  let statusText: string;

  if (isOver) {
    status = "Exceeds target";
    statusBg = "bg-orange-50 dark:bg-orange-500/10";
    statusText = "text-orange-600 dark:text-orange-400";
  } else if (pct >= 80) {
    status = "On track";
    statusBg = "bg-emerald-50 dark:bg-emerald-500/10";
    statusText = "text-emerald-600 dark:text-emerald-400";
  } else if (pct >= 50) {
    status = "Moderate";
    statusBg = "bg-amber-50 dark:bg-amber-500/10";
    statusText = "text-amber-600 dark:text-amber-400";
  } else {
    status = "Low intake";
    statusBg = "bg-red-50 dark:bg-red-500/10";
    statusText = "text-red-500 dark:text-red-400";
  }

  return (
    <div className="space-y-2.5">
      {/* Label row */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <div className={`p-1.5 rounded-lg ${color} bg-opacity-10 ${statusText}`}>
            {icon}
          </div>
          <span className="text-sm font-semibold text-(--text-primary)">{label}</span>
        </div>
        <span className={`text-[10px] px-2.5 py-0.5 rounded-full font-bold uppercase tracking-wider ${statusBg} ${statusText}`}>
          {status}
        </span>
      </div>

      {/* Value row */}
      <div className="flex justify-between items-baseline text-xs">
        <span className="font-semibold text-(--text-primary)">
          {value}
          <span className="text-(--text-muted) font-normal ml-0.5">{unit}</span>
          <span className="text-(--text-muted) font-normal ml-1">avg / day</span>
        </span>
        <span className="text-(--text-muted)">target {target}{unit}</span>
      </div>

      {/* Bar */}
      <div className="relative h-2 bg-(--bg-tertiary) rounded-full overflow-hidden">
        <div
          className={`h-full rounded-full transition-all duration-700 ease-out ${color} ${isOver ? "opacity-60" : "opacity-90"}`}
          style={{ width: `${pct}%` }}
        />
      </div>

      {/* Over-target nudge */}
      {isOver && (
        <p className="text-[11px] text-orange-500 dark:text-orange-400">
          {Math.round(raw - 100)}% above target — AI analysis below may flag this.
        </p>
      )}
    </div>
  );
}