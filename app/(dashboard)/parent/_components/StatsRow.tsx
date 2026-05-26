"use client";

import React from "react";
import { Users, ShoppingBag, Wallet, Bell } from "lucide-react";

interface StatsRowProps {
  childCount: number;
  activeOrderCount: number;
  monthlySpend: number;
  unreadCount: number;
}

interface StatCardProps {
  label: string;
  value: string | number;
  icon: React.ComponentType<{ size: number }>;
  colorStyle: string;
  sub: string;
}

function StatCard({
  label,
  value,
  icon: Icon,
  colorStyle,
  sub,
}: StatCardProps) {
  return (
    <div className="w-full bg-[var(--bg-card)] border border-[var(--border-card)] rounded-2xl p-5 shadow-sm flex flex-col justify-between">
      <div className="flex items-center justify-between gap-4 mb-3">
        <span className="text-xs font-bold tracking-tight text-zinc-400 uppercase">
          {label}
        </span>
        <div
          className={`w-9 h-9 rounded-xl border flex items-center justify-center shrink-0 ${colorStyle}`}
        >
          <Icon size={16} />
        </div>
      </div>
      <div className="flex flex-col gap-0.5">
        <div className="text-2xl font-extrabold tracking-tight text-zinc-900 dark:text-zinc-50">
          {value}
        </div>
        <div className="text-xs font-medium text-zinc-400 dark:text-zinc-500">
          {sub}
        </div>
      </div>
    </div>
  );
}

export function StatsRow({
  childCount,
  activeOrderCount,
  monthlySpend,
  unreadCount,
}: StatsRowProps) {
  return (
    <div className="grid grid-cols-2 md:grid-cols-4 gap-4 w-full">
      <StatCard
        label="Children"
        value={childCount}
        icon={Users}
        colorStyle="text-blue-500 bg-blue-500/10 border-blue-500/20"
        sub={
          childCount === 1 ? "1 linked profile" : (
            `${childCount} linked profiles`
          )
        }
      />
      <StatCard
        label="Active Orders"
        value={activeOrderCount}
        icon={ShoppingBag}
        colorStyle="text-amber-500 bg-amber-500/10 border-amber-500/20"
        sub={activeOrderCount === 0 ? "No active orders" : "In progress"}
      />
      <StatCard
        label="Monthly Spend"
        value={`$${monthlySpend.toFixed(2)}`}
        icon={Wallet}
        colorStyle="text-green-500 bg-green-500/10 border-green-500/20"
        sub="This month"
      />
      <StatCard
        label="Notifications"
        value={unreadCount}
        icon={Bell}
        colorStyle="text-purple-500 bg-purple-500/10 border-purple-500/20"
        sub={unreadCount === 0 ? "All caught up" : `${unreadCount} unread`}
      />
    </div>
  );
}
