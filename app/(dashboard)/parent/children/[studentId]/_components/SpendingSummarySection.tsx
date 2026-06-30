"use client";

import { TrendingUp, CreditCard, AlertTriangle } from "lucide-react";
import { Section } from "./ui";
import { formatPKR } from "@/lib/currency";
import { SpendingSummary } from "@/types/childProfileTypes";

function SpendBar({
  label,
  spend,
  limit,
  icon,
}: {
  label: string;
  spend: number;
  limit: number | null;
  icon: React.ReactNode;
}) {
  const pct = limit ? Math.min((spend / limit) * 100, 100) : null;
  const nearLimit = pct !== null && pct >= 80;
  const atLimit = pct !== null && pct >= 100;

  return (
    <div className="flex flex-col gap-2">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-1.5 text-xs font-semibold text-(--text-secondary)">
          {icon}
          {label}
        </div>
        <div className="flex items-center gap-1.5">
          {nearLimit && (
            <AlertTriangle
              size={11}
              className={atLimit ? "text-red-500" : "text-amber-500"}
            />
          )}
          <span className="text-sm font-bold text-(--text-primary)">
            {formatPKR(spend)}
          </span>
          {limit && (
            <span className="text-xs text-(--text-muted) font-medium">
              / {formatPKR(limit)}
            </span>
          )}
        </div>
      </div>

      {pct !== null && (
        <div className="h-1.5 w-full bg-(--bg-secondary) rounded-full overflow-hidden">
          <div
            className={`h-full rounded-full transition-all ${
              atLimit ? "bg-red-500"
              : nearLimit ? "bg-amber-500"
              : "bg-green-500"
            }`}
            style={{ width: `${pct}%` }}
          />
        </div>
      )}

      {!limit && (
        <p className="text-[10px] text-(--text-muted)">No limit set</p>
      )}
    </div>
  );
}

export function SpendingSummarySection({
  summary,
}: {
  summary: SpendingSummary;
}) {
  return (
    <Section
      icon={<TrendingUp size={15} />}
      title="Spending this period"
      subtitle="Live totals across active and delivered orders."
    >
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
        <SpendBar
          label="Today"
          spend={summary.todaySpend}
          limit={summary.dailyLimit}
          icon={<CreditCard size={12} />}
        />
        <SpendBar
          label="This week"
          spend={summary.weeklySpend}
          limit={summary.weeklyLimit}
          icon={<TrendingUp size={12} />}
        />
      </div>
    </Section>
  );
}
