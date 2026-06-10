"use client";

// app/(dashboard)/system-admin/_components/SystemHealthClient.tsx

import {
    Activity,
    Database,
    Users,
    GraduationCap,
    ShoppingBag,
    CheckCircle2,
    XCircle,
    Clock,
    Server,
    AlertTriangle,
    Zap,
} from "lucide-react";
import type { SystemHealthData } from "@/db/queries/SuperAdminSystemHealth";

// ─── Helpers ──────────────────────────────────────────────────────────────────

function fmtDate(iso: string) {
    const d = new Date(iso);
    return d.toLocaleDateString("en-US", { month: "short", day: "numeric" });
}

// ─── Status badge ─────────────────────────────────────────────────────────────

function StatusPill({ status }: { status: "healthy" | "degraded" | "down" }) {
    const map = {
        healthy: {
            bg: "rgba(34,197,94,0.1)",
            color: "#22c55e",
            border: "rgba(34,197,94,0.25)",
            label: "Healthy",
        },
        degraded: {
            bg: "rgba(245,158,11,0.1)",
            color: "#f59e0b",
            border: "rgba(245,158,11,0.25)",
            label: "Degraded",
        },
        down: {
            bg: "rgba(239,68,68,0.1)",
            color: "#ef4444",
            border: "rgba(239,68,68,0.25)",
            label: "Down",
        },
    };
    const s = map[status];
    return (
        <span
            className="px-2 py-0.5 rounded text-[10px] font-bold uppercase tracking-wider border"
            style={{ background: s.bg, color: s.color, borderColor: s.border }}
        >
            {s.label}
        </span>
    );
}

// ─── Stat card ────────────────────────────────────────────────────────────────

function HealthStatCard({
    label,
    value,
    icon: Icon,
    iconClassName,
    sub,
}: {
    label: string;
    value: string | number;
    icon: React.ElementType;
    iconClassName: string;
    sub?: string;
}) {
    return (
        <div
            className="rounded-2xl border p-5 flex items-start justify-between shadow-sm"
            style={{ background: "var(--bg-card)", borderColor: "var(--border-card)" }}
        >
            <div className="space-y-1">
                <p className="text-xs font-bold text-(--text-secondary) uppercase tracking-wider">
                    {label}
                </p>
                <h3 className="text-2xl font-black text-(--text-primary)">{value}</h3>
                {sub && <p className="text-[10px] text-(--text-muted) font-medium">{sub}</p>}
            </div>
            <div
                className={`p-2.5 rounded-xl bg-(--bg-secondary) border border-(--border-card) ${iconClassName}`}
            >
                <Icon size={18} />
            </div>
        </div>
    );
}

// ─── Mini sparkline (pure SVG, no deps) ──────────────────────────────────────

function Sparkline({
    data,
    colour,
}: {
    data: number[];
    colour: string;
}) {
    if (data.length < 2) return null;
    const max = Math.max(...data, 1);
    const W = 160;
    const H = 36;
    const pts = data.map((v, i) => {
        const x = (i / (data.length - 1)) * W;
        const y = H - (v / max) * H;
        return `${x},${y}`;
    });
    const polyline = pts.join(" ");
    const area = `0,${H} ${polyline} ${W},${H}`;
    return (
        <svg
            width={W}
            height={H}
            viewBox={`0 0 ${W} ${H}`}
            fill="none"
            className="overflow-visible"
        >
            <polygon points={area} fill={colour} fillOpacity={0.12} />
            <polyline points={polyline} stroke={colour} strokeWidth={1.5} strokeLinejoin="round" />
        </svg>
    );
}

// ─── Activity chart card ──────────────────────────────────────────────────────

function ActivityChartCard({
    recentActivity,
}: {
    recentActivity: SystemHealthData["recentActivity"];
}) {
    const orderData = recentActivity.map((d) => d.orders);
    const txData = recentActivity.map((d) => d.transactions);

    const maxY = Math.max(...orderData, ...txData, 1);
    const W = 100;
    const H = 64;

    function toPoints(data: number[]) {
        return data
            .map((v, i) => {
                const x = (i / (data.length - 1)) * W;
                const y = H - (v / maxY) * H;
                return `${x.toFixed(1)},${y.toFixed(1)}`;
            })
            .join(" ");
    }

    const orderPts = toPoints(orderData);
    const txPts = toPoints(txData);

    return (
        <div
            className="rounded-2xl border p-5 shadow-sm"
            style={{ background: "var(--bg-card)", borderColor: "var(--border-card)" }}
        >
            <div className="flex items-center justify-between mb-4">
                <div>
                    <h3 className="text-sm font-bold text-(--text-primary) uppercase tracking-widest">
                        7-Day Activity
                    </h3>
                    <p className="text-[10px] text-(--text-secondary) mt-0.5">
                        Orders and transactions over the last week
                    </p>
                </div>
                <div className="flex items-center gap-4 text-[10px] font-bold text-(--text-secondary)">
                    <span className="flex items-center gap-1.5">
                        <span className="w-2.5 h-0.5 bg-blue-500 rounded-full inline-block" />
                        Orders
                    </span>
                    <span className="flex items-center gap-1.5">
                        <span className="w-2.5 h-0.5 bg-emerald-500 rounded-full inline-block" />
                        Transactions
                    </span>
                </div>
            </div>

            {/* Bar chart */}
            <div className="flex items-end justify-between gap-1.5 h-20">
                {recentActivity.map((day, i) => {
                    const orderH = maxY > 0 ? (day.orders / maxY) * 100 : 0;
                    const txH = maxY > 0 ? (day.transactions / maxY) * 100 : 0;
                    return (
                        <div
                            key={day.date}
                            className="flex-1 flex flex-col items-center gap-1 group"
                        >
                            <div className="flex items-end gap-0.5 h-16 w-full justify-center">
                                <div
                                    className="w-[45%] rounded-t-sm bg-blue-500/60 group-hover:bg-blue-500 transition-colors"
                                    style={{ height: `${orderH}%`, minHeight: orderH > 0 ? 2 : 0 }}
                                />
                                <div
                                    className="w-[45%] rounded-t-sm bg-emerald-500/60 group-hover:bg-emerald-500 transition-colors"
                                    style={{ height: `${txH}%`, minHeight: txH > 0 ? 2 : 0 }}
                                />
                            </div>
                            <p className="text-[9px] text-(--text-muted) font-mono whitespace-nowrap">
                                {fmtDate(day.date)}
                            </p>
                        </div>
                    );
                })}
            </div>
        </div>
    );
}

// ─── Order status breakdown ───────────────────────────────────────────────────

const STATUS_COLOUR: Record<string, { bg: string; color: string; border: string }> = {
    pending: {
        bg: "rgba(245,158,11,0.1)",
        color: "#f59e0b",
        border: "rgba(245,158,11,0.2)",
    },
    preparing: {
        bg: "rgba(59,130,246,0.1)",
        color: "#3b82f6",
        border: "rgba(59,130,246,0.2)",
    },
    ready: {
        bg: "rgba(168,85,247,0.1)",
        color: "#a855f7",
        border: "rgba(168,85,247,0.2)",
    },
    delivered: {
        bg: "rgba(34,197,94,0.1)",
        color: "#22c55e",
        border: "rgba(34,197,94,0.2)",
    },
    cancelled: {
        bg: "rgba(239,68,68,0.1)",
        color: "#ef4444",
        border: "rgba(239,68,68,0.2)",
    },
};

function OrderStatusCard({
    breakdown,
}: {
    breakdown: SystemHealthData["orderStatusBreakdown"];
}) {
    const total = breakdown.reduce((s, r) => s + r.count, 0);

    return (
        <div
            className="rounded-2xl border p-5 shadow-sm"
            style={{ background: "var(--bg-card)", borderColor: "var(--border-card)" }}
        >
            <div className="mb-4">
                <h3 className="text-sm font-bold text-(--text-primary) uppercase tracking-widest">
                    Order Status Breakdown
                </h3>
                <p className="text-[10px] text-(--text-secondary) mt-0.5">
                    All-time distribution across statuses
                </p>
            </div>

            {total === 0 ? (
                <p className="text-xs text-(--text-muted) italic">No orders recorded yet.</p>
            ) : (
                <div className="space-y-2.5">
                    {breakdown.map((row) => {
                        const pct = Math.round((row.count / total) * 100);
                        const c =
                            STATUS_COLOUR[row.status] ?? {
                                bg: "rgba(113,113,122,0.1)",
                                color: "#71717a",
                                border: "rgba(113,113,122,0.2)",
                            };
                        return (
                            <div key={row.status}>
                                <div className="flex items-center justify-between mb-1">
                                    <span
                                        className="px-1.5 py-0.5 rounded text-[9px] font-bold uppercase tracking-wider border"
                                        style={{
                                            background: c.bg,
                                            color: c.color,
                                            borderColor: c.border,
                                        }}
                                    >
                                        {row.status}
                                    </span>
                                    <span className="text-[10px] font-bold text-(--text-secondary)">
                                        {row.count.toLocaleString()} ({pct}%)
                                    </span>
                                </div>
                                <div className="h-1.5 rounded-full bg-(--bg-secondary) overflow-hidden">
                                    <div
                                        className="h-full rounded-full transition-all"
                                        style={{ width: `${pct}%`, background: c.color }}
                                    />
                                </div>
                            </div>
                        );
                    })}
                </div>
            )}
        </div>
    );
}

// ─── Environment card ─────────────────────────────────────────────────────────

function EnvironmentCard({ env }: { env: SystemHealthData["environment"] }) {
    const rows = [
        { label: "Node Environment", value: env.nodeEnv },
        { label: "App Version", value: env.nextVersion },
        { label: "Server Timezone", value: env.timezone },
        {
            label: "Checked At",
            value: new Date(env.checkedAt).toLocaleTimeString("en-US", {
                hour: "2-digit",
                minute: "2-digit",
                second: "2-digit",
            }),
        },
    ];

    return (
        <div
            className="rounded-2xl border p-5 shadow-sm"
            style={{ background: "var(--bg-card)", borderColor: "var(--border-card)" }}
        >
            <div className="flex items-center gap-2 mb-4">
                <Server size={14} className="text-(--text-muted)" />
                <h3 className="text-sm font-bold text-(--text-primary) uppercase tracking-widest">
                    Environment
                </h3>
            </div>
            <div className="space-y-2.5">
                {rows.map((r) => (
                    <div
                        key={r.label}
                        className="flex items-center justify-between py-1.5 border-b border-(--border-primary) last:border-0"
                    >
                        <p className="text-[10px] font-bold text-(--text-secondary) uppercase tracking-wider">
                            {r.label}
                        </p>
                        <p className="text-[11px] font-mono font-bold text-(--text-primary)">
                            {r.value}
                        </p>
                    </div>
                ))}
            </div>
        </div>
    );
}

// ─── Recent audit activity list ───────────────────────────────────────────────

function RecentActivityCard({
    events,
}: {
    events: SystemHealthData["recentErrors"];
}) {
    return (
        <div
            className="rounded-2xl border overflow-hidden shadow-sm"
            style={{ background: "var(--bg-card)", borderColor: "var(--border-card)" }}
        >
            <div className="p-5 border-b border-(--border-primary) flex items-center gap-2">
                <Activity size={14} className="text-(--text-muted)" />
                <div>
                    <h3 className="text-sm font-bold text-(--text-primary) uppercase tracking-widest">
                        Recent Audit Events
                    </h3>
                    <p className="text-[10px] text-(--text-secondary) mt-0.5">
                        Last 10 administrative actions recorded
                    </p>
                </div>
            </div>
            <div className="divide-y divide-(--border-primary)">
                {events.length === 0 ? (
                    <p className="p-6 text-xs text-(--text-muted) italic text-center">
                        No events recorded yet.
                    </p>
                ) : (
                    events.map((e) => (
                        <div
                            key={e.id}
                            className="px-5 py-3 flex items-center justify-between hover:bg-black/5 dark:hover:bg-white/5 transition-colors"
                        >
                            <div>
                                <p className="text-xs font-bold text-(--text-primary)">
                                    {e.action.replace(/_/g, " ")}
                                </p>
                                <p className="text-[10px] text-(--text-muted) font-mono mt-0.5">
                                    {e.entityType} • {e.user?.name ?? "System"}
                                </p>
                            </div>
                            <p className="text-[10px] text-(--text-muted) whitespace-nowrap ml-4">
                                {new Date(e.createdAt).toLocaleTimeString("en-US", {
                                    hour: "2-digit",
                                    minute: "2-digit",
                                })}
                            </p>
                        </div>
                    ))
                )}
            </div>
        </div>
    );
}

// ─── Root component ───────────────────────────────────────────────────────────

interface SystemHealthClientProps {
    health: SystemHealthData;
}

export function SystemHealthClient({ health }: SystemHealthClientProps) {
    const { db, counts, recentErrors, orderStatusBreakdown, recentActivity, environment } =
        health;

    return (
        <div className="space-y-6">
            {/* DB status banner */}
            <div
                className="rounded-2xl border p-4 flex items-center justify-between shadow-sm"
                style={{ background: "var(--bg-card)", borderColor: "var(--border-card)" }}
            >
                <div className="flex items-center gap-3">
                    <div className="p-2.5 rounded-xl bg-(--bg-secondary) border border-(--border-card)">
                        <Database size={16} className="text-(--text-muted)" />
                    </div>
                    <div>
                        <p className="text-xs font-bold text-(--text-secondary) uppercase tracking-wider">
                            Database
                        </p>
                        <p className="text-sm font-black text-(--text-primary)">
                            Neon PostgreSQL
                        </p>
                    </div>
                </div>
                <div className="flex items-center gap-3">
                    <div className="text-right">
                        <p className="text-[10px] text-(--text-muted) uppercase tracking-wider font-bold">
                            Query latency
                        </p>
                        <p
                            className="text-lg font-black"
                            style={{
                                color:
                                    db.latencyMs < 200
                                        ? "#22c55e"
                                        : db.latencyMs < 600
                                            ? "#f59e0b"
                                            : "#ef4444",
                            }}
                        >
                            {db.latencyMs}ms
                        </p>
                    </div>
                    <StatusPill status={db.status} />
                </div>
            </div>

            {/* Stat cards grid */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
                <HealthStatCard
                    label="Total Users"
                    value={counts.totalUsers.toLocaleString()}
                    icon={Users}
                    iconClassName="text-blue-500"
                    sub="Registered accounts across all roles"
                />
                <HealthStatCard
                    label="Total Students"
                    value={counts.totalStudents.toLocaleString()}
                    icon={GraduationCap}
                    iconClassName="text-purple-500"
                    sub="Active student profiles"
                />
                <HealthStatCard
                    label="Total Orders"
                    value={counts.totalOrders.toLocaleString()}
                    icon={ShoppingBag}
                    iconClassName="text-amber-500"
                    sub={`${counts.pendingOrders} currently pending`}
                />
                <HealthStatCard
                    label="Transactions"
                    value={counts.successfulTransactions.toLocaleString()}
                    icon={CheckCircle2}
                    iconClassName="text-emerald-500"
                    sub={`${counts.failedTransactions} failed`}
                />
            </div>

            {/* Activity + breakdown row */}
            <div className="grid grid-cols-1 lg:grid-cols-[1fr_320px] gap-6">
                <ActivityChartCard recentActivity={recentActivity} />
                <OrderStatusCard breakdown={orderStatusBreakdown} />
            </div>

            {/* Recent events + environment row */}
            <div className="grid grid-cols-1 lg:grid-cols-[1fr_320px] gap-6">
                <RecentActivityCard events={recentErrors} />
                <EnvironmentCard env={environment} />
            </div>
        </div>
    );
}