"use client";

// app/(dashboard)/parent/_components/StatsRow.tsx
// Subscription-aware: locks the Nutrition stat card for free users.

import React from "react";
import Link from "next/link";
import { Users, ShoppingBag, Wallet, Bell, Salad, Lock } from "lucide-react";

interface StatsRowProps {
  childCount: number;
  activeOrderCount: number;
  monthlySpend: number;
  unreadCount: number;
  /** Pass subscriptionStatus so locked cards render correctly without an extra fetch */
  subscriptionStatus: string | null | undefined;
}

interface StatCardProps {
  label: string;
  value: string | number;
  icon: React.ComponentType<{ size: number; className?: string }>;
  colorStyle: string;
  sub: string;
  locked?: boolean;
  lockedHref?: string;
}

function StatCard({ label, value, icon: Icon, colorStyle, sub, locked, lockedHref }: StatCardProps) {
  const content = (
    <div
      className={`w-full rounded-xl border p-5 shadow-sm flex flex-col justify-between transition-all ${locked ? "opacity-60 cursor-pointer hover:opacity-80" : ""
        }`}
      style={{
        background: "var(--bg-card)",
        borderColor: "var(--border-card)",
        boxShadow: "var(--shadow-card)",
      }}
    >
      <div className="flex items-center justify-between gap-4 mb-3">
        <span
          className="text-xs font-bold tracking-tight uppercase"
          style={{ color: "var(--text-muted)" }}
        >
          {label}
        </span>
        <div className={`w-9 h-9 rounded-xl border flex items-center justify-center shrink-0 ${colorStyle}`}>
          {locked ? <Lock size={14} /> : <Icon size={16} />}
        </div>
      </div>
      <div className="flex flex-col gap-0.5">
        <div
          className="text-2xl font-extrabold tracking-tight"
          style={{ color: "var(--text-primary)" }}
        >
          {locked ? (
            <span className="text-sm font-bold uppercase tracking-wider" style={{ color: "var(--text-muted)" }}>
              Pro only
            </span>
          ) : (
            value
          )}
        </div>
        <div className="text-xs font-medium" style={{ color: "var(--text-muted)" }}>
          {locked ? "Upgrade to unlock" : sub}
        </div>
      </div>
    </div>
  );

  if (locked && lockedHref) {
    return <Link href={lockedHref}>{content}</Link>;
  }

  return content;
}

export function StatsRow({
  childCount,
  activeOrderCount,
  monthlySpend,
  unreadCount,
  subscriptionStatus,
}: StatsRowProps) {
  const isPro = subscriptionStatus === "active" || subscriptionStatus === "trialing";

  return (
    <div className="grid grid-cols-2 md:grid-cols-4 gap-4 w-full">
      <StatCard
        label="Children"
        value={childCount}
        icon={Users}
        colorStyle="text-blue-500 bg-blue-500/10 border-blue-500/20"
        sub={childCount === 1 ? "1 linked profile" : `${childCount} linked profiles`}
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
        value={`Rs. ${monthlySpend.toFixed(2)}`}
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