"use client";

import { useState } from "react";
import {
    Sparkles, Loader2, CheckCircle2, Clock, AlertTriangle,
    CreditCard, XCircle, BadgeCheck, Users, FileText, ExternalLink,
} from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { type BillingCycle, subscriptionTiers } from "@/data/subscriptionTiers";
import type {
    schoolSubscriptionTable,
    subscriptionInvoicesTable,
    parentProSubscriptionsTable,
} from "@/drizzle/schema";
import { PricingCard } from "./PricingCard";

type SchoolSub = typeof schoolSubscriptionTable.$inferSelect;
type ParentSub = typeof parentProSubscriptionsTable.$inferSelect;
type Invoice = typeof subscriptionInvoicesTable.$inferSelect;

function isSchoolSub(sub: SchoolSub | ParentSub): sub is SchoolSub {
    return "tier" in sub;
}

interface Props {
    subscription: SchoolSub | ParentSub | null;
    invoices: Invoice[];
    role: "school_admin" | "parent";
    studentCount?: number;
    studentLimit?: number;
}

type CancelView = "idle" | "confirm" | "done";

const STATUS_CONFIG = {
    trialing: {
        label: "Free Trial",
        color: "text-blue-600 dark:text-blue-400",
        bg: "bg-blue-500/10 border-blue-500/20",
        icon: <Clock size={12} />,
    },
    active: {
        label: "Active",
        color: "text-emerald-600 dark:text-emerald-400",
        bg: "bg-emerald-500/10 border-emerald-500/20",
        icon: <CheckCircle2 size={12} />,
    },
    past_due: {
        label: "Past Due",
        color: "text-amber-600 dark:text-amber-400",
        bg: "bg-amber-500/10 border-amber-500/20",
        icon: <AlertTriangle size={12} />,
    },
    cancelled: {
        label: "Cancelled",
        color: "text-zinc-500",
        bg: "bg-zinc-100 border-zinc-200 dark:bg-zinc-900 dark:border-zinc-800",
        icon: null,
    },
    expired: {
        label: "Expired",
        color: "text-zinc-500",
        bg: "bg-zinc-100 border-zinc-200 dark:bg-zinc-900 dark:border-zinc-800",
        icon: null,
    },
} as const;

export function BillingPageShell({
    subscription: initialSub,
    invoices,
    role,
    studentCount = 0,
    studentLimit = 50,
}: Props) {
    const [subscription, setSubscription] = useState(initialSub);
    const [upgradingCycle, setUpgradingCycle] = useState<BillingCycle | null>(null);
    const [updatingPayment, setUpdatingPayment] = useState(false);
    const [cancelling, setCancelling] = useState(false);
    const [cancelView, setCancelView] = useState<CancelView>("idle");

    const sub = subscription;
    const isActive = sub?.status === "active" || sub?.status === "trialing";
    const isPremium = isActive && (sub && isSchoolSub(sub) ? sub.tier === "premium_school" : true);
    const isTrial = sub?.status === "trialing";
    const isPastDue = sub?.status === "past_due";
    const anyLoading = !!upgradingCycle || updatingPayment || cancelling;

    const upgradeTier = role === "school_admin" ? subscriptionTiers.SchoolPremium : subscriptionTiers.ParentPro;
    const upgradeTierKey = role === "school_admin" ? "SchoolPremium" : "ParentPro";

    const planLabel = sub && isSchoolSub(sub)
        ? sub.tier === "premium_school" ? "Premium School" : "Free"
        : isActive ? "Parent Pro" : "Free";

    const renewalDate = sub?.currentPeriodEnd ?? null;
    const trialEndsDate = sub?.trialEndsAt ?? null;
    const badge = sub?.status ? STATUS_CONFIG[sub.status as keyof typeof STATUS_CONFIG] ?? null : null;

    const studentPct = studentLimit === Number.MAX_SAFE_INTEGER
        ? 0
        : Math.min((studentCount / studentLimit) * 100, 100);

    const handleUpgrade = async (cycle: BillingCycle) => {
        setUpgradingCycle(cycle);
        try {
            const res = await fetch("/api/stripe/checkout", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ tier: upgradeTierKey, cycle }),
            });
            const d = await res.json();
            if (d.url) window.location.href = d.url;
        } catch (err) {
            console.error(err);
        } finally {
            setUpgradingCycle(null);
        }
    };

    const handleUpdatePayment = async () => {
        setUpdatingPayment(true);
        try {
            const res = await fetch("/api/user/billing-portal", { method: "POST" });
            const d = await res.json();
            if (d.url) window.location.href = d.url;
        } catch (err) {
            console.error(err);
        } finally {
            setUpdatingPayment(false);
        }
    };

    const handleCancelConfirm = async () => {
        setCancelling(true);
        try {
            const res = await fetch("/api/stripe/cancel-subscription", { method: "POST" });
            const d = await res.json();
            if (d.ok) {
                setCancelView("done");
                if (subscription) {
                    setSubscription({ ...subscription, status: "cancelled" } as typeof subscription);
                }
            }
        } catch (err) {
            console.error(err);
        } finally {
            setCancelling(false);
        }
    };

    return (
        <div className="max-w-4xl mx-auto space-y-6">

            {/* Page header */}
            <div>
                <h1 className="text-2xl font-bold tracking-tight" style={{ color: "var(--text-primary)" }}>
                    Plans & Billing
                </h1>
                <p className="text-sm mt-1" style={{ color: "var(--text-secondary)" }}>
                    Manage your subscription, payment method, and invoice history.
                </p>
            </div>

            {/* ── Current plan ─────────────────────────────────────────── */}
            <div className="rounded-2xl border p-6 space-y-5"
                style={{ background: "var(--bg-card)", borderColor: "var(--border-card)" }}>

                <div className="flex items-start justify-between gap-4">
                    <div className="space-y-2">
                        <span className="text-[9px] font-black uppercase tracking-widest" style={{ color: "var(--text-muted)" }}>
                            Current Plan
                        </span>
                        <h2 className="text-2xl font-black tracking-tight" style={{ color: "var(--text-primary)" }}>
                            {planLabel}
                        </h2>
                        {badge && (
                            <div className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full border text-[10px] font-bold ${badge.bg} ${badge.color}`}>
                                {badge.icon}{badge.label}
                            </div>
                        )}
                    </div>
                    <div className={`w-12 h-12 rounded-2xl flex items-center justify-center shrink-0 ${isPremium ? "bg-zinc-950 dark:bg-white" : "bg-zinc-100 dark:bg-zinc-800"}`}>
                        {isPremium
                            ? <Sparkles size={20} className="text-amber-400 fill-amber-400" />
                            : <BadgeCheck size={20} className="text-zinc-400" />
                        }
                    </div>
                </div>

                {isTrial && trialEndsDate && (
                    <p className="text-sm" style={{ color: "var(--text-secondary)" }}>
                        Trial ends{" "}
                        <strong style={{ color: "var(--text-primary)" }}>
                            {new Date(trialEndsDate).toLocaleDateString("en-US", { month: "long", day: "numeric", year: "numeric" })}
                        </strong>
                        . You won&apos;t be charged until then.
                    </p>
                )}
                {sub?.status === "active" && renewalDate && (
                    <p className="text-sm" style={{ color: "var(--text-secondary)" }}>
                        Renews{" "}
                        <strong style={{ color: "var(--text-primary)" }}>
                            {new Date(renewalDate).toLocaleDateString("en-US", { month: "long", day: "numeric", year: "numeric" })}
                        </strong>
                    </p>
                )}

                {role === "school_admin" && (
                    <div className="rounded-xl border p-4 space-y-2.5"
                        style={{ background: "var(--bg-secondary)", borderColor: "var(--border-primary)" }}>
                        <div className="flex items-center justify-between">
                            <div className="flex items-center gap-2">
                                <Users size={14} style={{ color: "var(--text-muted)" }} />
                                <span className="text-xs font-semibold" style={{ color: "var(--text-secondary)" }}>Student usage</span>
                            </div>
                            <span className="text-xs font-bold" style={{ color: "var(--text-primary)" }}>
                                {studentCount.toLocaleString()} / {isPremium ? "Unlimited" : studentLimit.toLocaleString()}
                            </span>
                        </div>
                        {!isPremium && (
                            <div className="h-2 rounded-full overflow-hidden" style={{ background: "var(--bg-tertiary)" }}>
                                <div className="h-full rounded-full transition-all duration-500"
                                    style={{ width: `${studentPct}%`, background: studentPct >= 90 ? "#ef4444" : studentPct >= 70 ? "#f59e0b" : "#22c55e" }} />
                            </div>
                        )}
                        {!isPremium && studentPct >= 90 && (
                            <p className="text-[11px] font-medium" style={{ color: "#ef4444" }}>
                                Approaching student limit. Upgrade to add more students.
                            </p>
                        )}
                    </div>
                )}

                {isPastDue && (
                    <div className="flex items-start gap-2 rounded-xl bg-amber-500/10 border border-amber-500/20 px-4 py-3 text-sm font-medium text-amber-600 dark:text-amber-400">
                        <AlertTriangle size={14} className="shrink-0 mt-0.5" />
                        <span>
                            Last payment failed.{" "}
                            <button onClick={handleUpdatePayment} disabled={updatingPayment} className="underline font-bold cursor-pointer">
                                {updatingPayment ? "Loading…" : "Update payment method"}
                            </button>
                        </span>
                    </div>
                )}

                {isActive && cancelView === "idle" && (
                    <div className="flex flex-wrap gap-2 pt-2 border-t" style={{ borderColor: "var(--border-primary)" }}>
                        <button onClick={handleUpdatePayment} disabled={anyLoading}
                            className="flex items-center gap-1.5 rounded-xl border px-4 py-2.5 text-xs font-bold hover:bg-zinc-100 dark:hover:bg-zinc-800 disabled:opacity-40 cursor-pointer transition-colors"
                            style={{ borderColor: "var(--border-card)", color: "var(--text-secondary)" }}>
                            {updatingPayment ? <Loader2 size={13} className="animate-spin" /> : <CreditCard size={13} />}
                            Update payment method
                        </button>
                        <button onClick={() => setCancelView("confirm")} disabled={anyLoading}
                            className="flex items-center gap-1.5 rounded-xl border border-red-200 dark:border-red-900/40 px-4 py-2.5 text-xs font-bold text-red-500 hover:bg-red-50 dark:hover:bg-red-900/20 disabled:opacity-40 cursor-pointer transition-colors ml-auto">
                            <XCircle size={13} />
                            Cancel subscription
                        </button>
                    </div>
                )}

                <AnimatePresence mode="wait">
                    {cancelView === "confirm" && (
                        <motion.div key="confirm" initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: "auto" }} exit={{ opacity: 0, height: 0 }} className="overflow-hidden">
                            <div className="rounded-xl border border-red-200 dark:border-red-900/50 bg-red-50 dark:bg-red-900/10 p-4 space-y-3">
                                <p className="text-sm font-bold text-red-600 dark:text-red-400">Cancel your subscription?</p>
                                <p className="text-xs text-red-500/80 dark:text-red-400/70 leading-relaxed">
                                    You&apos;ll keep access until the end of the current billing period. Premium features will be disabled after that.
                                </p>
                                <div className="flex gap-2">
                                    <button onClick={handleCancelConfirm} disabled={cancelling}
                                        className="flex items-center gap-1.5 rounded-xl bg-red-500 px-4 py-2 text-xs font-bold text-white hover:bg-red-600 disabled:opacity-50 cursor-pointer transition-colors">
                                        {cancelling && <Loader2 size={12} className="animate-spin" />}
                                        Yes, cancel
                                    </button>
                                    <button onClick={() => setCancelView("idle")} disabled={cancelling}
                                        className="rounded-xl border px-4 py-2 text-xs font-bold hover:bg-zinc-100 dark:hover:bg-zinc-800 cursor-pointer transition-colors"
                                        style={{ borderColor: "var(--border-card)", color: "var(--text-secondary)" }}>
                                        Keep plan
                                    </button>
                                </div>
                            </div>
                        </motion.div>
                    )}
                    {cancelView === "done" && (
                        <motion.div key="done" initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: "auto" }} exit={{ opacity: 0, height: 0 }} className="overflow-hidden">
                            <div className="rounded-xl border p-4" style={{ background: "var(--bg-secondary)", borderColor: "var(--border-primary)" }}>
                                <p className="text-sm font-bold" style={{ color: "var(--text-primary)" }}>Subscription cancelled</p>
                                <p className="text-xs mt-1" style={{ color: "var(--text-muted)" }}>You&apos;ll retain access until the end of the billing period.</p>
                            </div>
                        </motion.div>
                    )}
                </AnimatePresence>
            </div>

            {/* ── Upgrade cards ────────────────────────────────────────── */}
            {!isPremium && (
                <div className="space-y-3">
                    <p className="text-xs font-black uppercase tracking-widest" style={{ color: "var(--text-muted)" }}>
                        Upgrade your plan
                    </p>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                        <PricingCard
                            card={{ key: upgradeTierKey, ...upgradeTier }}
                            cycle="monthly"
                            highlight={false}
                            badge={null}
                            index={0}
                            isLoading={upgradingCycle === "monthly"}
                            onCheckout={() => handleUpgrade("monthly")}
                        />
                        <PricingCard
                            card={{ key: upgradeTierKey, ...upgradeTier }}
                            cycle="annual"
                            highlight={true}
                            badge="Best value"
                            index={1}
                            isLoading={upgradingCycle === "annual"}
                            onCheckout={() => handleUpgrade("annual")}
                        />
                    </div>
                </div>
            )}

            {/* ── Invoice history ──────────────────────────────────────── */}
            <div className="rounded-2xl border overflow-hidden"
                style={{ background: "var(--bg-card)", borderColor: "var(--border-card)" }}>
                <div className="px-6 py-4 border-b flex items-center gap-2"
                    style={{ borderColor: "var(--border-primary)", background: "var(--bg-secondary)" }}>
                    <FileText size={14} style={{ color: "var(--text-muted)" }} />
                    <h2 className="text-sm font-bold" style={{ color: "var(--text-primary)" }}>Invoice history</h2>
                </div>
                {!invoices.length ? (
                    <div className="p-12 text-center text-sm m-4 rounded-xl border border-dashed"
                        style={{ color: "var(--text-muted)", borderColor: "var(--border-primary)" }}>
                        No invoices yet. They&apos;ll appear here once you subscribe.
                    </div>
                ) : (
                    <div className="divide-y" style={{ borderColor: "var(--border-primary)" }}>
                        {invoices.map((inv) => (
                            <div key={inv.id} className="flex items-center justify-between px-6 py-4 gap-4">
                                <div className="space-y-0.5">
                                    <p className="text-sm font-bold" style={{ color: "var(--text-primary)" }}>
                                        {inv.currency} {parseFloat(inv.amount).toLocaleString("en-PK", { minimumFractionDigits: 2 })}
                                    </p>
                                    {inv.paidAt && (
                                        <p className="text-xs" style={{ color: "var(--text-muted)" }}>
                                            {new Date(inv.paidAt).toLocaleDateString("en-US", { month: "long", day: "numeric", year: "numeric" })}
                                        </p>
                                    )}
                                </div>
                                <div className="flex items-center gap-3">
                                    <span className={`text-[10px] font-bold px-2.5 py-1 rounded-full border ${inv.status === "paid" ? "bg-emerald-500/10 border-emerald-500/20 text-emerald-600 dark:text-emerald-400"
                                        : inv.status === "failed" ? "bg-red-500/10 border-red-500/20 text-red-600 dark:text-red-400"
                                            : "bg-zinc-100 border-zinc-200 text-zinc-500 dark:bg-zinc-900 dark:border-zinc-800"
                                        }`}>{inv.status}
                                    </span>
                                    {inv.hostedInvoiceUrl && (
                                        <a href={inv.hostedInvoiceUrl} target="_blank" rel="noopener noreferrer"
                                            className="flex items-center gap-1 text-xs font-medium hover:underline"
                                            style={{ color: "var(--text-muted)" }}>
                                            <ExternalLink size={12} />
                                            View
                                        </a>
                                    )}
                                </div>
                            </div>
                        ))}
                    </div>
                )}
            </div>
        </div>
    );
}