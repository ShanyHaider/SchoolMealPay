"use client";

// app/(dashboard)/system-admin/schools/_components/SchoolsPageClient.tsx

import { useState } from "react";
import {
    Building2,
    Mail,
    Phone,
    MapPin,
    Globe,
    Clock,
    GraduationCap,
    Users,
    CheckCircle,
    XCircle,
    Receipt,
    TrendingUp,
    CalendarDays,
    ExternalLink,
} from "lucide-react";

import { SchoolSettingsPanel, type SchoolSettingsData } from "../../_components/SchoolSettingsPanel";
import type { SchoolPageData } from "@/db/queries/SystemAdminSchools";

// ─── Props ──────────────────────────────────────────────────────────────────

interface SchoolsPageClientProps {
    schoolData: SchoolPageData;
    subscriptionData: SchoolSettingsData;
    currentAdminUserId: string;
}

// ─── Helpers ─────────────────────────────────────────────────────────────────

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

function SectionCard({
    children,
    className = "",
}: {
    children: React.ReactNode;
    className?: string;
}) {
    return (
        <div
            className={`rounded-2xl border shadow-sm overflow-hidden ${className}`}
            style={{ background: "var(--bg-card)", borderColor: "var(--border-card)" }}
        >
            {children}
        </div>
    );
}

function CardHeader({
    icon: Icon,
    title,
    subtitle,
    badge,
}: {
    icon: React.ElementType;
    title: string;
    subtitle?: string;
    badge?: React.ReactNode;
}) {
    return (
        <div className="p-5 border-b border-(--border-primary) flex items-center justify-between">
            <div className="flex items-center gap-2">
                <Icon size={15} className="text-(--text-muted)" />
                <div>
                    <h3 className="text-sm font-bold text-(--text-primary) uppercase tracking-widest">
                        {title}
                    </h3>
                    {subtitle && (
                        <p className="text-[10px] text-(--text-secondary) mt-0.5">{subtitle}</p>
                    )}
                </div>
            </div>
            {badge}
        </div>
    );
}

function InfoRow({ label, value }: { label: string; value: React.ReactNode }) {
    return (
        <div className="flex items-start justify-between gap-4 py-2.5 border-b border-(--border-primary) last:border-0">
            <span className="text-[11px] font-bold text-(--text-muted) uppercase tracking-wider shrink-0">
                {label}
            </span>
            <span className="text-[12px] font-medium text-(--text-primary) text-right">
                {value || <span className="text-(--text-muted) italic">—</span>}
            </span>
        </div>
    );
}

const INVOICE_STATUS_STYLES: Record<string, { bg: string; color: string; border: string }> = {
    paid: {
        bg: "rgba(34,197,94,0.1)",
        color: "#22c55e",
        border: "rgba(34,197,94,0.2)",
    },
    pending: {
        bg: "rgba(245,158,11,0.1)",
        color: "#f59e0b",
        border: "rgba(245,158,11,0.2)",
    },
    failed: {
        bg: "rgba(239,68,68,0.1)",
        color: "#ef4444",
        border: "rgba(239,68,68,0.2)",
    },
    void: {
        bg: "rgba(100,116,139,0.1)",
        color: "#64748b",
        border: "rgba(100,116,139,0.2)",
    },
};

// ─── Student capacity bar ────────────────────────────────────────────────────

function CapacityBar({
    current,
    max,
    isPremium,
}: {
    current: number;
    max: number;
    isPremium: boolean;
}) {
    const pct = isPremium ? 0 : Math.min(100, Math.round((current / Math.max(max, 1)) * 100));
    const isWarning = !isPremium && pct >= 80;
    const isDanger = !isPremium && pct >= 100;

    const barColor = isDanger
        ? "#ef4444"
        : isWarning
            ? "#f59e0b"
            : "var(--accent)";

    return (
        <div className="space-y-2">
            <div className="flex items-center justify-between">
                <span className="text-[11px] font-bold text-(--text-muted) uppercase tracking-wider">
                    Student Capacity
                </span>
                <span
                    className="text-[11px] font-bold"
                    style={{ color: isPremium ? "#22c55e" : barColor }}
                >
                    {isPremium ? `${current} / ∞` : `${current} / ${max}`}
                </span>
            </div>
            <div className="h-2 rounded-full bg-(--bg-secondary) overflow-hidden">
                <div
                    className="h-full rounded-full transition-all duration-500"
                    style={{
                        width: isPremium ? "0%" : `${pct}%`,
                        background: barColor,
                    }}
                />
            </div>
            {!isPremium && isWarning && (
                <p
                    className="text-[9px] font-bold uppercase tracking-wider"
                    style={{ color: barColor }}
                >
                    {isDanger ? "⚠ Capacity reached — new students blocked" : "⚠ Approaching limit"}
                </p>
            )}
            {isPremium && (
                <p className="text-[9px] font-bold text-green-500 uppercase tracking-wider">
                    ✓ Premium — unlimited capacity
                </p>
            )}
        </div>
    );
}

// ─── Component ───────────────────────────────────────────────────────────────

export function SchoolsPageClient({
    schoolData,
    subscriptionData,
    currentAdminUserId,
}: SchoolsPageClientProps) {
    const [message, setMessage] = useState<{
        type: "success" | "error";
        text: string;
    } | null>(null);

    const showMessage = (text: string, type: "success" | "error") => {
        setMessage({ type, text });
        setTimeout(() => setMessage(null), 5000);
    };

    const { profile, subscription, studentStats, invoices } = schoolData;
    const isPremium = subscription?.tier === "premium_school";
    const studentLimit = subscription?.studentLimit ?? 50;

    // Tier badge
    const tierBadge = (
        <span
            className={`px-2.5 py-1 rounded-md text-[10px] font-bold uppercase tracking-wider border ${isPremium
                ? "bg-blue-500/10 text-blue-500 border-blue-500/20"
                : "bg-(--bg-secondary) text-(--text-secondary) border-(--border-card)"
                }`}
        >
            {isPremium ? "Premium" : "Free"}
        </span>
    );

    return (
        <div className="space-y-6">
            {/* Page header */}
            <div>
                <h1
                    className="text-2xl font-bold tracking-tight"
                    style={{ color: "var(--text-primary)" }}
                >
                    School Management
                </h1>
                <p className="text-sm mt-1" style={{ color: "var(--text-secondary)" }}>
                    Campus profile, subscription controls, and enrollment statistics.
                </p>
            </div>

            <ToastBanner message={message} />

            {/* Top grid: profile + settings */}
            <div className="grid grid-cols-1 lg:grid-cols-[1fr_340px] gap-6 items-start">
                {/* Left: profile + stats */}
                <div className="space-y-6">
                    {/* School profile card */}
                    <SectionCard>
                        {/* Banner */}
                        <div
                            className="h-24 w-full relative"
                            style={{
                                background: profile?.bannerUrl
                                    ? `url(${profile.bannerUrl}) center/cover no-repeat`
                                    : "linear-gradient(135deg, var(--bg-secondary) 0%, var(--bg-tertiary) 100%)",
                                borderBottom: "1px solid var(--border-card)",
                            }}
                        >
                            {/* Logo */}
                            <div
                                className="absolute -bottom-6 left-5 w-14 h-14 rounded-xl border-2 flex items-center justify-center shadow-md"
                                style={{
                                    background: profile?.logoUrl ? `url(${profile.logoUrl}) center/cover no-repeat` : "var(--bg-card)",
                                    borderColor: "var(--border-card)",
                                }}
                            >
                                {!profile?.logoUrl && (
                                    <Building2 size={22} className="text-(--text-muted)" />
                                )}
                            </div>
                        </div>

                        {/* Name + meta */}
                        <div className="pt-9 px-5 pb-5">
                            <div className="flex items-start justify-between gap-3">
                                <div>
                                    <h2 className="text-lg font-black text-(--text-primary)">
                                        {profile?.name ?? "Unnamed School"}
                                    </h2>
                                    {profile?.city && (
                                        <p className="text-[12px] text-(--text-muted) flex items-center gap-1 mt-0.5">
                                            <MapPin size={11} />
                                            {profile.city}
                                        </p>
                                    )}
                                </div>
                                {tierBadge}
                            </div>

                            {/* Detail rows */}
                            <div className="mt-5 space-y-0">
                                <InfoRow
                                    label="Email"
                                    value={
                                        profile?.email ? (
                                            <span className="font-mono text-[11px]">{profile.email}</span>
                                        ) : null
                                    }
                                />
                                <InfoRow
                                    label="Phone"
                                    value={
                                        profile?.phone ? (
                                            <span className="font-mono text-[11px]">{profile.phone}</span>
                                        ) : null
                                    }
                                />
                                <InfoRow label="Address" value={profile?.address} />
                                <InfoRow label="Type" value={profile?.schoolType} />
                                <InfoRow label="Timezone" value={profile?.timezone} />
                                <InfoRow
                                    label="Website"
                                    value={
                                        profile?.website ? (
                                            <a
                                                href={profile.website}
                                                target="_blank"
                                                rel="noopener noreferrer"
                                                className="flex items-center gap-1 text-blue-500 hover:underline"
                                            >
                                                {profile.website.replace(/^https?:\/\//, "")}
                                                <ExternalLink size={10} />
                                            </a>
                                        ) : null
                                    }
                                />
                                <InfoRow
                                    label="Registered"
                                    value={
                                        profile?.createdAt
                                            ? new Date(profile.createdAt).toLocaleDateString("en-US", {
                                                month: "long",
                                                day: "numeric",
                                                year: "numeric",
                                            })
                                            : null
                                    }
                                />
                            </div>
                        </div>
                    </SectionCard>

                    {/* Student stats */}
                    <SectionCard>
                        <CardHeader
                            icon={Users}
                            title="Enrollment"
                            subtitle="Active students by class"
                            badge={
                                <span className="px-2.5 py-1 rounded-md text-[10px] font-bold bg-(--bg-secondary) text-(--text-secondary) border border-(--border-card)">
                                    {studentStats.total} students
                                </span>
                            }
                        />
                        <div className="p-5 space-y-5">
                            {/* Capacity bar */}
                            <CapacityBar
                                current={studentStats.total}
                                max={studentLimit}
                                isPremium={isPremium}
                            />

                            {/* Class breakdown */}
                            {studentStats.byClass.length > 0 ? (
                                <div className="space-y-2">
                                    <p className="text-[10px] font-bold text-(--text-muted) uppercase tracking-wider">
                                        By Class
                                    </p>
                                    <div className="space-y-1.5">
                                        {studentStats.byClass.map((cls) => {
                                            const pct = Math.round(
                                                (cls.count / Math.max(studentStats.total, 1)) * 100,
                                            );
                                            return (
                                                <div key={cls.className} className="flex items-center gap-3">
                                                    <span className="text-[11px] font-medium text-(--text-secondary) w-28 truncate shrink-0">
                                                        {cls.className}
                                                    </span>
                                                    <div className="flex-1 h-1.5 rounded-full bg-(--bg-secondary) overflow-hidden">
                                                        <div
                                                            className="h-full rounded-full bg-(--accent) opacity-60"
                                                            style={{ width: `${pct}%` }}
                                                        />
                                                    </div>
                                                    <span className="text-[11px] font-bold text-(--text-primary) w-6 text-right shrink-0">
                                                        {cls.count}
                                                    </span>
                                                </div>
                                            );
                                        })}
                                    </div>
                                </div>
                            ) : (
                                <p className="text-[11px] text-(--text-muted) italic text-center py-4">
                                    No students enrolled yet.
                                </p>
                            )}
                        </div>
                    </SectionCard>

                    {/* Subscription invoice history */}
                    <SectionCard>
                        <CardHeader
                            icon={Receipt}
                            title="Invoice History"
                            subtitle="School subscription billing records"
                            badge={
                                <span className="px-2.5 py-1 rounded-md text-[10px] font-bold bg-(--bg-secondary) text-(--text-secondary) border border-(--border-card)">
                                    {invoices.length} records
                                </span>
                            }
                        />
                        <div className="overflow-x-auto">
                            <table className="w-full text-left text-xs border-collapse">
                                <thead>
                                    <tr className="bg-(--bg-secondary) border-b border-(--border-primary) text-(--text-muted) uppercase tracking-wider font-bold">
                                        <th className="p-4">Date</th>
                                        <th className="p-4">Cycle</th>
                                        <th className="p-4">Amount</th>
                                        <th className="p-4">Status</th>
                                        <th className="p-4">Paid</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-(--border-primary) font-medium text-(--text-secondary)">
                                    {invoices.map((inv) => {
                                        const style =
                                            INVOICE_STATUS_STYLES[inv.status] ?? INVOICE_STATUS_STYLES.void;
                                        return (
                                            <tr
                                                key={inv.id}
                                                className="hover:bg-black/5 dark:hover:bg-white/5 transition-colors"
                                            >
                                                <td className="p-4 text-(--text-muted) whitespace-nowrap">
                                                    {new Date(inv.createdAt).toLocaleDateString("en-US", {
                                                        month: "short",
                                                        day: "numeric",
                                                        year: "numeric",
                                                    })}
                                                </td>
                                                <td className="p-4">
                                                    <span className="capitalize">{inv.billingCycle ?? "—"}</span>
                                                </td>
                                                <td className="p-4 font-bold text-(--text-primary) font-mono">
                                                    PKR {Math.round(inv.amount).toLocaleString()}
                                                </td>
                                                <td className="p-4">
                                                    <span
                                                        className="px-2 py-0.5 rounded text-[10px] font-bold uppercase border"
                                                        style={{
                                                            background: style.bg,
                                                            color: style.color,
                                                            borderColor: style.border,
                                                        }}
                                                    >
                                                        {inv.status}
                                                    </span>
                                                </td>
                                                <td className="p-4 text-(--text-muted) whitespace-nowrap">
                                                    {inv.paidAt
                                                        ? new Date(inv.paidAt).toLocaleDateString("en-US", {
                                                            month: "short",
                                                            day: "numeric",
                                                        })
                                                        : "—"}
                                                </td>
                                            </tr>
                                        );
                                    })}
                                    {invoices.length === 0 && (
                                        <tr>
                                            <td
                                                colSpan={5}
                                                className="p-8 text-center text-(--text-muted) italic"
                                            >
                                                No invoices recorded yet.
                                            </td>
                                        </tr>
                                    )}
                                </tbody>
                            </table>
                        </div>
                    </SectionCard>
                </div>

                {/* Right: subscription settings panel + sub info */}
                <div className="space-y-5">
                    {/* Reuse existing SchoolSettingsPanel */}
                    <SchoolSettingsPanel
                        subscriptionData={subscriptionData}
                        currentAdminUserId={currentAdminUserId}
                        onMessage={showMessage}
                    />

                    {/* Subscription meta card */}
                    {subscription && (
                        <SectionCard>
                            <CardHeader icon={TrendingUp} title="Subscription Details" />
                            <div className="p-5 space-y-0">
                                <InfoRow
                                    label="Status"
                                    value={
                                        <span
                                            className={`text-[11px] font-bold uppercase ${subscription.status === "active"
                                                ? "text-green-500"
                                                : "text-amber-500"
                                                }`}
                                        >
                                            {subscription.status}
                                        </span>
                                    }
                                />
                                <InfoRow
                                    label="Billing"
                                    value={
                                        <span className="capitalize">
                                            {subscription.billingCycle ?? "N/A"}
                                        </span>
                                    }
                                />
                                {subscription.trialEndsAt && (
                                    <InfoRow
                                        label="Trial ends"
                                        value={
                                            <span className="flex items-center gap-1 text-amber-500">
                                                <CalendarDays size={11} />
                                                {new Date(subscription.trialEndsAt).toLocaleDateString("en-US", {
                                                    month: "short",
                                                    day: "numeric",
                                                    year: "numeric",
                                                })}
                                            </span>
                                        }
                                    />
                                )}
                                {subscription.currentPeriodEnd && (
                                    <InfoRow
                                        label="Renews"
                                        value={new Date(subscription.currentPeriodEnd).toLocaleDateString(
                                            "en-US",
                                            { month: "short", day: "numeric", year: "numeric" },
                                        )}
                                    />
                                )}
                                <InfoRow
                                    label="Since"
                                    value={new Date(subscription.createdAt).toLocaleDateString("en-US", {
                                        month: "short",
                                        day: "numeric",
                                        year: "numeric",
                                    })}
                                />
                            </div>
                        </SectionCard>
                    )}
                </div>
            </div>
        </div>
    );
}