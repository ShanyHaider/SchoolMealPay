"use client";

import {
    Sparkles, Clock, CheckCircle2, AlertTriangle,
    BadgeCheck, Users, ArrowRight,
} from "lucide-react";
import Link from "next/link";
import type {
    schoolSubscriptionTable,
    parentProSubscriptionsTable,
} from "@/drizzle/schema";

type SchoolSub = typeof schoolSubscriptionTable.$inferSelect;
type ParentSub = typeof parentProSubscriptionsTable.$inferSelect;

function isSchoolSub(sub: SchoolSub | ParentSub): sub is SchoolSub {
    return "tier" in sub;
}

const STATUS_CONFIG = {
    trialing: { label: "Free Trial", color: "text-blue-600 dark:text-blue-400", bg: "bg-blue-500/10 border-blue-500/20", icon: <Clock size={12} /> },
    active: { label: "Active", color: "text-emerald-600 dark:text-emerald-400", bg: "bg-emerald-500/10 border-emerald-500/20", icon: <CheckCircle2 size={12} /> },
    past_due: { label: "Past Due", color: "text-amber-600 dark:text-amber-400", bg: "bg-amber-500/10 border-amber-500/20", icon: <AlertTriangle size={12} /> },
    cancelled: { label: "Cancelled", color: "text-zinc-500", bg: "bg-zinc-100 border-zinc-200 dark:bg-zinc-900 dark:border-zinc-800", icon: null },
    expired: { label: "Expired", color: "text-zinc-500", bg: "bg-zinc-100 border-zinc-200 dark:bg-zinc-900 dark:border-zinc-800", icon: null },
} as const;

interface Props {
    subscription: SchoolSub | ParentSub | null;
    role: "school_admin" | "parent" | "canteen_staff";
    billingHref: string;
    studentCount?: number;
    studentLimit?: number;
}

export function BillingTabClient({ subscription: sub, role, billingHref, studentCount = 0, studentLimit = 50 }: Props) {
    const isActive = sub?.status === "active" || sub?.status === "trialing";
    const isPremium = isActive && (sub && isSchoolSub(sub) ? sub.tier === "premium_school" : true);
    const isTrial = sub?.status === "trialing";
    const isPastDue = sub?.status === "past_due";

    const planLabel = sub && isSchoolSub(sub)
        ? sub.tier === "premium_school" ? "Premium School" : "Free"
        : isActive ? "Parent Pro" : "Free";

    const renewalDate = sub?.currentPeriodEnd ?? null;
    const trialEndsDate = sub?.trialEndsAt ?? null;
    const badge = sub?.status ? STATUS_CONFIG[sub.status as keyof typeof STATUS_CONFIG] ?? null : null;

    const studentPct = studentLimit === Number.MAX_SAFE_INTEGER
        ? 0
        : Math.min((studentCount / studentLimit) * 100, 100);

    return (
        <div className="space-y-4">
            <div>
                <h3 className="text-lg font-black tracking-tight text-zinc-950 dark:text-white">
                    Plans & Billing
                </h3>
                <p className="text-xs text-zinc-400 mt-0.5">
                    Manage your subscription and payment history.
                </p>
            </div>

            <div className="rounded-2xl border border-zinc-200 bg-zinc-50 p-5 dark:border-zinc-800 dark:bg-zinc-900/40 space-y-4">
                {/* Plan header */}
                <div className="flex items-start justify-between gap-4">
                    <div className="space-y-1.5">
                        <span className="text-[9px] font-black uppercase tracking-widest text-zinc-400">
                            Current Plan
                        </span>
                        <h4 className="text-base font-black text-zinc-950 dark:text-white">
                            {planLabel}
                        </h4>
                        {badge && (
                            <div className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full border text-[10px] font-bold ${badge.bg} ${badge.color}`}>
                                {badge.icon}
                                {badge.label}
                            </div>
                        )}
                    </div>
                    <div className={`w-10 h-10 rounded-xl flex items-center justify-center shrink-0 ${isPremium ? "bg-zinc-950 dark:bg-white" : "bg-zinc-200 dark:bg-zinc-800"}`}>
                        {isPremium
                            ? <Sparkles size={17} className="text-amber-400 fill-amber-400" />
                            : <BadgeCheck size={17} className="text-zinc-400" />
                        }
                    </div>
                </div>

                {/* Dates */}
                {isTrial && trialEndsDate && (
                    <p className="text-[11px] text-zinc-400">
                        Trial ends{" "}
                        <span className="font-bold text-zinc-600 dark:text-zinc-300">
                            {new Date(trialEndsDate).toLocaleDateString("en-US", { month: "long", day: "numeric", year: "numeric" })}
                        </span>
                        . You won't be charged until then.
                    </p>
                )}
                {sub?.status === "active" && renewalDate && (
                    <p className="text-[11px] text-zinc-400">
                        Renews{" "}
                        <span className="font-bold text-zinc-600 dark:text-zinc-300">
                            {new Date(renewalDate).toLocaleDateString("en-US", { month: "long", day: "numeric", year: "numeric" })}
                        </span>
                    </p>
                )}

                {/* Student usage — school only */}
                {role === "school_admin" && (
                    <div className="space-y-1.5">
                        <div className="flex items-center justify-between">
                            <div className="flex items-center gap-1.5">
                                <Users size={12} className="text-zinc-400" />
                                <span className="text-[11px] text-zinc-400">Students</span>
                            </div>
                            <span className="text-[11px] font-bold text-zinc-600 dark:text-zinc-300">
                                {studentCount.toLocaleString()} / {isPremium ? "Unlimited" : studentLimit.toLocaleString()}
                            </span>
                        </div>
                        {!isPremium && (
                            <div className="h-1.5 rounded-full overflow-hidden bg-zinc-200 dark:bg-zinc-800">
                                <div
                                    className="h-full rounded-full transition-all duration-500"
                                    style={{
                                        width: `${studentPct}%`,
                                        background: studentPct >= 90 ? "#ef4444" : studentPct >= 70 ? "#f59e0b" : "#22c55e",
                                    }}
                                />
                            </div>
                        )}
                    </div>
                )}

                {/* Past due warning */}
                {isPastDue && (
                    <div className="flex items-start gap-2 rounded-xl bg-amber-500/10 border border-amber-500/20 px-3.5 py-2.5 text-xs font-medium text-amber-600 dark:text-amber-400">
                        <AlertTriangle size={13} className="shrink-0 mt-0.5" />
                        <span>Last payment failed. Update your payment method in billing settings.</span>
                    </div>
                )}

                {/* Single CTA */}
                <div className="pt-1 border-t border-zinc-200 dark:border-zinc-800">
                    <Link
                        href={billingHref}
                        className="inline-flex items-center gap-1.5 text-xs font-bold text-zinc-600 dark:text-zinc-300 hover:text-zinc-950 dark:hover:text-white transition-colors"
                    >
                        Manage billing
                        <ArrowRight size={12} />
                    </Link>
                </div>
            </div>
        </div>
    );
}