"use client";

// app/(dashboard)/system-admin/_components/SystemAdminClient.tsx

import { useState } from "react";
import {
  DollarSign,
  Building2,
  ShoppingBag,
  Activity,
  CheckCircle,
  XCircle,
} from "lucide-react";

import { SystemAdminStatCard } from "./SystemAdminStatCard";
import { UserLedgerTable, type UserRow } from "./UserLedgerTable";
import { SchoolSettingsPanel, type SchoolSettingsData } from "./SchoolSettingsPanel";
import { AuditLogTable, type AuditLogRow } from "./AuditLogTable";

// ─── Prop types ────────────────────────────────────────────────────────────

interface SystemAdminClientProps {
  stats: {
    revenue: number;
    activeOrdersCount: number;
    schoolsCount: number;
    latencyMs: number;
  };
  subscriptionData: SchoolSettingsData;
  users: UserRow[];
  auditLogs: AuditLogRow[];
  currentAdminUserId: string;
}

// ─── Stat card config ──────────────────────────────────────────────────────

function buildStatCards(stats: SystemAdminClientProps["stats"]) {
  return [
    {
      label: "Total Processing Volume",
      value: `Rs. ${stats.revenue.toLocaleString()}`,
      desc: "System-wide successful purchases",
      icon: DollarSign,
      iconClassName: "text-emerald-500",
    },
    {
      label: "Daily Pre-Orders",
      value: stats.activeOrdersCount.toString(),
      desc: "Active orders scheduled today",
      icon: ShoppingBag,
      iconClassName: "text-amber-500",
    },
    {
      label: "Registered Campuses",
      value: stats.schoolsCount.toString(),
      desc: "Active academic clients",
      icon: Building2,
      iconClassName: "text-blue-500",
    },
    {
      label: "Database Latency",
      value: `${stats.latencyMs}ms`,
      desc: "Single-tenant query time",
      icon: Activity,
      iconClassName:
        stats.latencyMs < 100
          ? "text-green-500"
          : stats.latencyMs < 300
            ? "text-amber-500"
            : "text-red-500",
    },
  ] as const;
}

// ─── Toast banner ──────────────────────────────────────────────────────────

function ToastBanner({
  message,
}: {
  message: { type: "success" | "error"; text: string } | null;
}) {
  if (!message) return null;

  const isSuccess = message.type === "success";
  return (
    <div
      className="flex items-center gap-3 p-4 rounded-xl border animate-in fade-in-0 duration-300"
      style={{
        background: isSuccess ? "rgba(34,197,94,0.08)" : "rgba(239,68,68,0.08)",
        borderColor: isSuccess ? "rgba(34,197,94,0.2)" : "rgba(239,68,68,0.2)",
        color: isSuccess ? "#22c55e" : "#ef4444",
      }}
    >
      {isSuccess ? <CheckCircle size={16} /> : <XCircle size={16} />}
      <span className="text-sm font-medium">{message.text}</span>
    </div>
  );
}

// ─── Component ─────────────────────────────────────────────────────────────

export function SystemAdminClient({
  stats,
  subscriptionData,
  users,
  auditLogs,
  currentAdminUserId,
}: SystemAdminClientProps) {
  const [message, setMessage] = useState<{
    type: "success" | "error";
    text: string;
  } | null>(null);

  const showMessage = (text: string, type: "success" | "error") => {
    setMessage({ type, text });
    setTimeout(() => setMessage(null), 5000);
  };

  const statCards = buildStatCards(stats);

  return (
    <div className="space-y-8">
      {/* Toast */}
      <ToastBanner message={message} />

      {/* Stats grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {statCards.map((card) => (
          <SystemAdminStatCard key={card.label} {...card} />
        ))}
      </div>

      {/* User ledger + school settings side-by-side */}
      <div className="grid grid-cols-1 lg:grid-cols-[1fr_340px] gap-6 items-start">
        <UserLedgerTable
          users={users}
          currentAdminUserId={currentAdminUserId}
          onMessage={showMessage}
        />
        <SchoolSettingsPanel
          subscriptionData={subscriptionData}
          currentAdminUserId={currentAdminUserId}
          onMessage={showMessage}
        />
      </div>

      {/* Audit log — full view on this page */}
      <AuditLogTable auditLogs={auditLogs} />
    </div>
  );
}