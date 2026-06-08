"use client";

import React from "react";

const STATS = [
  {
    value: "5,000+",
    label: "Students served",
  },
  {
    value: "50+",
    label: "Schools onboarded",
  },
  {
    value: "4.9★",
    label: "Average rating",
  },
];

export function StatsStrip() {
  return (
    // Replaced flex-wrap with a smart responsive grid that centers beautifully
    <div className="mx-auto mt-14 max-w-2xl px-4">
      <div className="grid grid-cols-2 gap-x-4 gap-y-8 sm:grid-cols-3">
        {STATS.map((stat, index) => (
          <div
            key={stat.label}
            className={`flex flex-col items-center text-center ${
              index === 2 ? "col-span-2 sm:col-span-1" : "col-span-1"
            }`}
          >
            {/* Font weight adjusted to font-black to match your hero styling */}
            <div className="text-3xl font-black tracking-tight text-(--text-primary) sm:text-4xl">
              {stat.value}
            </div>

            <div className="mt-1.5 text-xs font-semibold text-(--text-secondary) sm:text-sm">
              {stat.label}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
