// app/(dashboard)/parent/_components/StatsRow.tsx
"use client";

import React, { useState, useRef, useEffect } from "react";
import Link from "next/link";
import {
    Users,
    ShoppingBag,
    Wallet,
    Bell,
    ChevronRight,
    TrendingUp,
    Clock,
    ArrowUpRight,
} from "lucide-react";
import type { StatsRowProps, Order, ChildLink } from "@/types/parentDashboardTypes";

// ─── Popover content factories ────────────────────────────────────────────────

function ChildrenPopoverContent({ children }: { children?: ChildLink[] }) {
    if (!children?.length) {
        return (
            <p className="text-xs text-center py-2" style={{ color: "var(--text-muted)" }}>
                No children linked yet.
            </p>
        );
    }
    return (
        <ul className="space-y-2">
            {children.map((c) => (
                <li key={c.id} className="flex items-center justify-between gap-3">
                    <div className="flex items-center gap-2 min-w-0">
                        <div
                            className={`w-2 h-2 rounded-full shrink-0 ${c.student.orderingEnabled ? "bg-green-500" : "bg-zinc-300 dark:bg-zinc-600"
                                }`}
                        />
                        <span
                            className="text-xs font-semibold truncate"
                            style={{ color: "var(--text-primary)" }}
                        >
                            {c.student.name}
                        </span>
                    </div>
                    <span className="text-[10px] shrink-0" style={{ color: "var(--text-muted)" }}>
                        {c.student.class
                            ? `G${c.student.class.grade}·${c.student.class.section}`
                            : c.student.studentCode}
                    </span>
                </li>
            ))}
        </ul>
    );
}

function ActiveOrdersPopoverContent({ orders }: { orders?: Order[] }) {
    const active = orders?.filter(
        (o) => o.status === "pending" || o.status === "preparing",
    );
    if (!active?.length) {
        return (
            <p className="text-xs text-center py-2" style={{ color: "var(--text-muted)" }}>
                No active orders right now.
            </p>
        );
    }
    return (
        <ul className="space-y-2">
            {active.map((o) => {
                const names = o.orderItems
                    .map((i) => i.menuItem?.name ?? "Item")
                    .join(", ");
                return (
                    <li key={o.id} className="flex items-start gap-2">
                        <Clock
                            size={11}
                            className="mt-0.5 shrink-0"
                            style={{ color: "var(--accent)" }}
                        />
                        <div className="min-w-0">
                            <p
                                className="text-xs font-semibold truncate"
                                style={{ color: "var(--text-primary)" }}
                            >
                                {names}
                            </p>
                            <p className="text-[10px]" style={{ color: "var(--text-muted)" }}>
                                PKR {Math.round(parseFloat(o.totalAmount)).toLocaleString()} ·{" "}
                                <span className="capitalize">{o.status}</span>
                            </p>
                        </div>
                    </li>
                );
            })}
        </ul>
    );
}

function SpendPopoverContent({ orders }: { orders?: Order[] }) {
    const now = new Date();
    const monthly = orders?.filter((o) => {
        const d = new Date(o.orderDate);
        return (
            d.getMonth() === now.getMonth() &&
            d.getFullYear() === now.getFullYear() &&
            o.status !== "cancelled"
        );
    });
    if (!monthly?.length) {
        return (
            <p className="text-xs text-center py-2" style={{ color: "var(--text-muted)" }}>
                No spend recorded this month.
            </p>
        );
    }
    // Group by week-of-month (rough)
    const weeks: Record<number, number> = {};
    monthly.forEach((o) => {
        const week = Math.ceil(new Date(o.orderDate).getDate() / 7);
        weeks[week] = (weeks[week] ?? 0) + parseFloat(o.totalAmount);
    });
    return (
        <ul className="space-y-1.5">
            {Object.entries(weeks).map(([wk, amt]) => (
                <li key={wk} className="flex items-center justify-between gap-3">
                    <span className="text-xs" style={{ color: "var(--text-muted)" }}>
                        Week {wk}
                    </span>
                    <span
                        className="text-xs font-bold tabular-nums"
                        style={{ color: "var(--text-primary)" }}
                    >
                        PKR {Math.round(amt).toLocaleString()}
                    </span>
                </li>
            ))}
            <li
                className="flex items-center justify-between gap-3 pt-1.5 border-t"
                style={{ borderColor: "var(--border-primary)" }}
            >
                <span className="text-xs font-bold" style={{ color: "var(--text-primary)" }}>
                    Total
                </span>
                <span
                    className="text-xs font-black tabular-nums"
                    style={{ color: "var(--accent)" }}
                >
                    PKR{" "}
                    {Math.round(monthly.reduce((s, o) => s + parseFloat(o.totalAmount), 0)).toLocaleString()}
                </span>
            </li>
        </ul>
    );
}

function NotificationsPopoverContent({ count }: { count: number }) {
    return (
        <div className="text-center py-1">
            {count === 0 ? (
                <p className="text-xs" style={{ color: "var(--text-muted)" }}>
                    You&apos;re all caught up 🎉
                </p>
            ) : (
                <>
                    <p
                        className="text-2xl font-black tabular-nums"
                        style={{ color: "var(--text-primary)" }}
                    >
                        {count}
                    </p>
                    <p className="text-xs mt-0.5" style={{ color: "var(--text-muted)" }}>
                        unread notification{count !== 1 ? "s" : ""}
                    </p>
                </>
            )}
        </div>
    );
}

// ─── Stat Card ────────────────────────────────────────────────────────────────

type StatConfig = {
    label: string;
    value: string | number;
    icon: React.ComponentType<{ size: number; className?: string }>;
    colorStyle: string;
    sub: string;
    href: string;
    trendLabel?: string;
    popover: React.ReactNode;
};

function StatCard({ label, value, icon: Icon, colorStyle, sub, href, trendLabel, popover }: StatConfig) {
    const [hovered, setHovered] = useState(false);
    const [visible, setVisible] = useState(false);
    const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

    const show = () => {
        if (timerRef.current) clearTimeout(timerRef.current);
        setHovered(true);
        // small delay so tap on mobile doesn't flash
        timerRef.current = setTimeout(() => setVisible(true), 80);
    };

    const hide = () => {
        if (timerRef.current) clearTimeout(timerRef.current);
        timerRef.current = setTimeout(() => {
            setHovered(false);
            setVisible(false);
        }, 120);
    };

    // Toggle on tap (mobile)
    const toggle = () => {
        if (visible) { hide(); } else { show(); }
    };

    useEffect(() => () => { if (timerRef.current) clearTimeout(timerRef.current); }, []);

    return (
        <div className="relative" onMouseEnter={show} onMouseLeave={hide}>
            <Link
                href={href}
                onTouchEnd={(e) => { e.preventDefault(); toggle(); }}
                className="block w-full rounded-2xl border p-4 transition-all select-none"
                style={{
                    background: "var(--bg-card)",
                    borderColor: hovered ? "var(--accent)" : "var(--border-card)",
                    boxShadow: hovered ? "0 4px 24px rgba(0,0,0,0.08)" : "var(--shadow-card)",
                    transition: "border-color 0.18s, box-shadow 0.18s",
                }}
            >
                {/* Icon + trend */}
                <div className="flex items-start justify-between mb-3">
                    <div className={`w-9 h-9 rounded-xl border flex items-center justify-center shrink-0 ${colorStyle}`}>
                        <Icon size={16} />
                    </div>
                    {trendLabel && (
                        <span
                            className="flex items-center gap-0.5 text-[10px] font-bold"
                            style={{ color: "var(--text-muted)" }}
                        >
                            <TrendingUp size={10} />
                            {trendLabel}
                        </span>
                    )}
                </div>

                {/* Value */}
                <p
                    className="text-xl font-extrabold tracking-tight tabular-nums leading-none"
                    style={{ color: "var(--text-primary)" }}
                >
                    {value}
                </p>

                {/* Label + sub */}
                <div className="mt-1.5 flex items-center justify-between gap-2">
                    <div>
                        <p
                            className="text-[10px] font-bold uppercase tracking-wider"
                            style={{ color: "var(--text-muted)" }}
                        >
                            {label}
                        </p>
                        <p className="text-[10px] mt-0.5" style={{ color: "var(--text-muted)" }}>
                            {sub}
                        </p>
                    </div>
                    <ArrowUpRight
                        size={13}
                        className="shrink-0 transition-opacity"
                        style={{
                            color: "var(--text-muted)",
                            opacity: hovered ? 1 : 0,
                        }}
                    />
                </div>
            </Link>

            {/* Popover */}
            {visible && (
                <div
                    className="absolute left-0 right-0 top-full mt-2 z-50 rounded-2xl border p-4 shadow-xl"
                    style={{
                        background: "var(--bg-card)",
                        borderColor: "var(--border-card)",
                        // Fade in
                        animation: "fadeUp 0.14s ease both",
                    }}
                    onMouseEnter={show}
                    onMouseLeave={hide}
                >
                    <div className="flex items-center justify-between mb-3">
                        <p
                            className="text-[10px] font-bold uppercase tracking-wider"
                            style={{ color: "var(--text-muted)" }}
                        >
                            {label}
                        </p>
                        <Link
                            href={href}
                            className="flex items-center gap-0.5 text-[10px] font-bold hover:underline"
                            style={{ color: "var(--accent)" }}
                        >
                            View all <ChevronRight size={10} />
                        </Link>
                    </div>
                    {popover}
                </div>
            )}

            <style>{`
        @keyframes fadeUp {
          from { opacity: 0; transform: translateY(6px); }
          to   { opacity: 1; transform: translateY(0); }
        }
      `}</style>
        </div>
    );
}

// ─── StatsRow ─────────────────────────────────────────────────────────────────

export function StatsRow({
    childCount,
    activeOrderCount,
    monthlySpend,
    unreadCount,
    recentOrders,
    children,
}: StatsRowProps) {
    return (
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 w-full">
            <StatCard
                label="Children"
                value={childCount}
                icon={Users}
                colorStyle="text-blue-500 bg-blue-500/10 border-blue-500/20"
                sub={childCount === 1 ? "1 linked" : `${childCount} linked`}
                href="/parent/children"
                popover={<ChildrenPopoverContent children={children} />}
            />
            <StatCard
                label="Active Orders"
                value={activeOrderCount}
                icon={ShoppingBag}
                colorStyle="text-amber-500 bg-amber-500/10 border-amber-500/20"
                sub={activeOrderCount === 0 ? "None right now" : "In progress"}
                href="/parent/orders"
                popover={<ActiveOrdersPopoverContent orders={recentOrders} />}
            />
            <StatCard
                label="Monthly Spend"
                value={`Rs ${monthlySpend.toLocaleString("en-PK", { maximumFractionDigits: 0 })}`}
                icon={Wallet}
                colorStyle="text-green-500 bg-green-500/10 border-green-500/20"
                sub="This month"
                href="/parent/wallet"
                popover={<SpendPopoverContent orders={recentOrders} />}
            />
            <StatCard
                label="Notifications"
                value={unreadCount}
                icon={Bell}
                colorStyle="text-purple-500 bg-purple-500/10 border-purple-500/20"
                sub={unreadCount === 0 ? "All clear" : `${unreadCount} unread`}
                href="/parent/notifications"
                popover={<NotificationsPopoverContent count={unreadCount} />}
            />
        </div>
    );
}