"use client";

import React, { useState } from "react";
import { useRouter } from "next/navigation";
import {
    Sparkles,
    Loader2,
    CheckCircle2,
    Clock,
    AlertTriangle,
    CreditCard,
    XCircle,
    LayoutDashboard,
    BadgeCheck,
} from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import type {
    schoolSubscriptionTable,
    subscriptionInvoicesTable,
    parentProSubscriptionsTable,
} from "@/drizzle/schema";

// Accept either school or parent subscription shape
type SchoolSub = typeof schoolSubscriptionTable.$inferSelect;
type ParentSub = typeof parentProSubscriptionsTable.$inferSelect;
type Invoice = typeof subscriptionInvoicesTable.$inferSelect;

interface Props {
    subscription: SchoolSub | ParentSub | null;
    invoices: Invoice[];
    role: "school_admin" | "parent" | "canteen_staff";
}

type CancelView = "idle" | "confirm" | "done";

// Type guard — school subscriptions have a `tier` field
function isSchoolSub(sub: SchoolSub | ParentSub): sub is SchoolSub {
    return "tier" in sub;
}

export function BillingTab({ subscription: initialSub, invoices: initialInvoices, role }: Props) {
    const router = useRouter();

    // Local optimistic state for post-action refreshes (cancel)
    const [subscription, setSubscription] = useState(initialSub);
    const [invoices] = useState(initialInvoices);

    const [upgradingMonthly, setUpgradingMonthly] = useState(false);
    const [upgradingAnnual, setUpgradingAnnual] = useState(false);
    const [updatingPayment, setUpdatingPayment] = useState(false);
    const [cancelling, setCancelling] = useState(false);
    const [cancelView, setCancelView] = useState<CancelView>("idle");

    const handleUpgrade = async (cycle: "monthly" | "annual") => {
        const setLoading = cycle === "monthly" ? setUpgradingMonthly : setUpgradingAnnual;
        setLoading(true);
        try {
            const res = await fetch("/api/stripe/checkout", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ tier: "SchoolPremium", cycle }),
            });
            const d = await res.json();
            if (d.url) window.location.href = d.url;
        } catch (err) {
            console.error(err);
        } finally {
            setLoading(false);
        }
    };
    const handleUpgradeParent = async (cycle: "monthly" | "annual") => {
        const setLoading = cycle === "monthly" ? setUpgradingMonthly : setUpgradingAnnual;
        setLoading(true);
        try {
            const res = await fetch("/api/stripe/checkout", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ tier: "ParentPro", cycle }),
            });
            const d = await res.json();
            if (d.url) window.location.href = d.url;
        } catch (err) {
            console.error(err);
        } finally {
            setLoading(false);
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
                // Optimistically update status — Next.js revalidation will sync on next visit
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

    const sub = subscription;
    const isActive = sub?.status === "active" || sub?.status === "trialing";
    const isPremium =
        isActive &&
        (sub && isSchoolSub(sub)
            ? sub.tier === "premium_school"
            : true); // parent pro — if active, it's premium
    const isTrial = sub?.status === "trialing";
    const isPastDue = sub?.status === "past_due";

    const planLabel =
        sub && isSchoolSub(sub)
            ? sub.tier === "premium_school"
                ? "Premium School"
                : "Free"
            : isActive
                ? "Parent Pro"
                : "Free";

    const renewalDate =
        sub && isSchoolSub(sub)
            ? sub.currentPeriodEnd
            : sub?.currentPeriodEnd ?? null;

    const trialEndsDate =
        sub && isSchoolSub(sub)
            ? sub.trialEndsAt
            : sub?.trialEndsAt ?? null;

    const stripeCustomerId =
        sub && isSchoolSub(sub)
            ? sub.stripeCustomerId
            : (sub as ParentSub | null)?.stripeCustomerId ?? null;

    const statusConfig = {
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

    const currentStatus = sub?.status as keyof typeof statusConfig | undefined;
    const badge = currentStatus && statusConfig[currentStatus] ? statusConfig[currentStatus] : null;
    const anyLoading = upgradingMonthly || upgradingAnnual || updatingPayment || cancelling;

    return (
        <motion.div
            initial={{ opacity: 0, y: 4 }}
            animate={{ opacity: 1, y: 0 }}
            className="space-y-5"
        >
            <div>
                <h3 className="text-lg font-black tracking-tight text-zinc-950 dark:text-white">
                    Plans & Billing
                </h3>
                <p className="text-xs text-zinc-400 dark:text-zinc-500 mt-0.5">
                    Manage your subscription and payment history.
                </p>
            </div>

            {/* ── Current plan card ───────────────────────────────────────── */}
            <div className="rounded-2xl border border-zinc-200 bg-zinc-50 p-5 dark:border-zinc-800 dark:bg-zinc-900/40 space-y-4">
                <div className="flex items-start justify-between gap-4">
                    <div className="space-y-1.5">
                        <span className="text-[9px] font-black uppercase tracking-widest text-zinc-400 dark:text-zinc-500">
                            Current Plan
                        </span>
                        <h4 className="text-base font-black text-zinc-950 dark:text-white">
                            {planLabel}
                        </h4>
                        {badge && (
                            <div
                                className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full border text-[10px] font-bold ${badge.bg} ${badge.color}`}
                            >
                                {badge.icon}
                                {badge.label}
                            </div>
                        )}
                    </div>

                    <div
                        className={`w-10 h-10 rounded-xl flex items-center justify-center shrink-0 ${isPremium
                            ? "bg-zinc-950 dark:bg-white"
                            : "bg-zinc-200 dark:bg-zinc-800"
                            }`}
                    >
                        {isPremium ? (
                            <Sparkles size={17} className="text-amber-400 fill-amber-400" />
                        ) : (
                            <BadgeCheck size={17} className="text-zinc-400" />
                        )}
                    </div>
                </div>

                {/* Dates */}
                {isTrial && trialEndsDate && (
                    <p className="text-[11px] text-zinc-400 dark:text-zinc-500">
                        Trial ends{" "}
                        <span className="font-bold text-zinc-600 dark:text-zinc-300">
                            {new Date(trialEndsDate).toLocaleDateString("en-US", {
                                month: "long",
                                day: "numeric",
                                year: "numeric",
                            })}
                        </span>
                        . You won't be charged until then.
                    </p>
                )}
                {sub?.status === "active" && renewalDate && (
                    <p className="text-[11px] text-zinc-400 dark:text-zinc-500">
                        Renews{" "}
                        <span className="font-bold text-zinc-600 dark:text-zinc-300">
                            {new Date(renewalDate).toLocaleDateString("en-US", {
                                month: "long",
                                day: "numeric",
                                year: "numeric",
                            })}
                        </span>
                    </p>
                )}

                {/* Past due */}
                {isPastDue && (
                    <div className="flex items-start gap-2 rounded-xl bg-amber-500/10 border border-amber-500/20 px-3.5 py-2.5 text-xs font-medium text-amber-600 dark:text-amber-400">
                        <AlertTriangle size={13} className="shrink-0 mt-0.5" />
                        <span>
                            Last payment failed.{" "}
                            <button
                                onClick={handleUpdatePayment}
                                disabled={updatingPayment}
                                className="underline font-bold cursor-pointer"
                            >
                                {updatingPayment ? "Loading…" : "Update payment method"}
                            </button>
                        </span>
                    </div>
                )}

                {/* Action buttons */}
                {isActive && cancelView === "idle" && (
                    <div className="flex flex-wrap gap-2 pt-1 border-t border-zinc-200 dark:border-zinc-800">
                        <button
                            onClick={handleUpdatePayment}
                            disabled={anyLoading}
                            className="flex items-center gap-1.5 rounded-xl border border-zinc-200 dark:border-zinc-700 px-3.5 py-2 text-xs font-bold hover:bg-zinc-100 dark:hover:bg-zinc-800 disabled:opacity-40 cursor-pointer transition-colors"
                        >
                            {updatingPayment ? (
                                <Loader2 size={12} className="animate-spin" />
                            ) : (
                                <CreditCard size={12} />
                            )}
                            Update payment
                        </button>

                        <button
                            onClick={() => router.push("/school-admin/billing")}
                            disabled={anyLoading}
                            className="flex items-center gap-1.5 rounded-xl border border-zinc-200 dark:border-zinc-700 px-3.5 py-2 text-xs font-bold hover:bg-zinc-100 dark:hover:bg-zinc-800 disabled:opacity-40 cursor-pointer transition-colors"
                        >
                            <LayoutDashboard size={12} />
                            View full billing
                        </button>

                        <button
                            onClick={() => setCancelView("confirm")}
                            disabled={anyLoading}
                            className="flex items-center gap-1.5 rounded-xl border border-red-200 dark:border-red-900/40 px-3.5 py-2 text-xs font-bold text-red-500 hover:bg-red-50 dark:hover:bg-red-900/20 disabled:opacity-40 cursor-pointer transition-colors ml-auto"
                        >
                            <XCircle size={12} />
                            Cancel plan
                        </button>
                    </div>
                )}

                {/* Cancel confirm / done */}
                <AnimatePresence mode="wait">
                    {cancelView === "confirm" && (
                        <motion.div
                            key="confirm"
                            initial={{ opacity: 0, height: 0 }}
                            animate={{ opacity: 1, height: "auto" }}
                            exit={{ opacity: 0, height: 0 }}
                            className="overflow-hidden"
                        >
                            <div className="rounded-xl border border-red-200 dark:border-red-900/50 bg-red-50 dark:bg-red-900/10 p-4 space-y-3">
                                <p className="text-xs font-bold text-red-600 dark:text-red-400">
                                    Cancel your subscription?
                                </p>
                                <p className="text-[11px] text-red-500/80 dark:text-red-400/70 leading-relaxed">
                                    You'll keep access until the end of the current billing period.
                                    Premium features will be disabled after that.
                                </p>
                                <div className="flex gap-2">
                                    <button
                                        onClick={handleCancelConfirm}
                                        disabled={cancelling}
                                        className="flex items-center gap-1.5 rounded-xl bg-red-500 px-3.5 py-2 text-xs font-bold text-white hover:bg-red-600 disabled:opacity-50 cursor-pointer transition-colors"
                                    >
                                        {cancelling && <Loader2 size={12} className="animate-spin" />}
                                        Yes, cancel
                                    </button>
                                    <button
                                        onClick={() => setCancelView("idle")}
                                        disabled={cancelling}
                                        className="rounded-xl border border-zinc-200 dark:border-zinc-700 px-3.5 py-2 text-xs font-bold hover:bg-zinc-100 dark:hover:bg-zinc-800 cursor-pointer transition-colors"
                                    >
                                        Keep plan
                                    </button>
                                </div>
                            </div>
                        </motion.div>
                    )}

                    {cancelView === "done" && (
                        <motion.div
                            key="done"
                            initial={{ opacity: 0, height: 0 }}
                            animate={{ opacity: 1, height: "auto" }}
                            exit={{ opacity: 0, height: 0 }}
                            className="overflow-hidden"
                        >
                            <div className="rounded-xl border border-zinc-200 dark:border-zinc-800 bg-zinc-50 dark:bg-zinc-900/40 p-4">
                                <p className="text-xs font-bold text-zinc-700 dark:text-zinc-300">
                                    Subscription cancelled
                                </p>
                                <p className="text-[11px] text-zinc-400 mt-1">
                                    You'll retain access until the end of the billing period.
                                </p>
                            </div>
                        </motion.div>
                    )}
                </AnimatePresence>
            </div>

            {/* ── Upgrade card ────────────────────────────────────────────── */}
            {/* ── Upgrade card ────────────────────────────────────────────── */}
            {!isPremium && (
                <div className="rounded-2xl border border-zinc-900/10 dark:border-zinc-700 bg-gradient-to-br from-zinc-950 to-zinc-900 p-5 space-y-4">
                    <div className="flex items-center gap-3">
                        <div className="w-9 h-9 rounded-xl bg-white/10 flex items-center justify-center shrink-0">
                            <Sparkles size={16} className="text-amber-400 fill-amber-400" />
                        </div>
                        <div>
                            {role === "school_admin" ? (
                                <>
                                    <h4 className="text-sm font-black text-white">Upgrade to Premium School</h4>
                                    <p className="text-[11px] text-zinc-400 mt-0.5">
                                        AI nutrition, advanced analytics, unlimited students.
                                    </p>
                                </>
                            ) : (
                                <>
                                    <h4 className="text-sm font-black text-white">Upgrade to Parent Pro</h4>
                                    <p className="text-[11px] text-zinc-400 mt-0.5">
                                        AI nutrition dashboard, meal planning & health trends.
                                    </p>
                                </>
                            )}
                        </div>
                    </div>

                    {role === "school_admin" ? (
                        // School: monthly + annual with PKR 49/mo and PKR 490/yr
                        <div className="flex gap-2">
                            <button
                                onClick={() => handleUpgrade("monthly")}
                                disabled={anyLoading}
                                className="flex-1 flex items-center justify-center gap-1.5 rounded-xl bg-white px-3.5 py-2.5 text-xs font-bold text-zinc-950 hover:bg-zinc-100 disabled:opacity-50 cursor-pointer transition-colors"
                            >
                                {upgradingMonthly ? (
                                    <Loader2 size={12} className="animate-spin" />
                                ) : (
                                    <Sparkles size={12} className="text-amber-400 fill-amber-400" />
                                )}
                                PKR 490 / mo
                            </button>
                            <button
                                onClick={() => handleUpgrade("annual")}
                                disabled={anyLoading}
                                className="flex-1 flex items-center justify-center gap-1.5 rounded-xl border border-zinc-700 px-3.5 py-2.5 text-xs font-bold text-white hover:bg-white/10 disabled:opacity-50 cursor-pointer transition-colors"
                            >
                                {upgradingAnnual && <Loader2 size={12} className="animate-spin" />}
                                PKR 4,900 / yr
                                <span className="ml-1 rounded-full bg-emerald-500/20 px-1.5 py-0.5 text-[9px] font-bold text-emerald-400">
                                    Save 17%
                                </span>
                            </button>
                        </div>
                    ) : (
                        // Parent: monthly + annual with PKR 4.99/mo and PKR 49.90/yr
                        <div className="flex gap-2">
                            <button
                                onClick={() => handleUpgradeParent("monthly")}
                                disabled={anyLoading}
                                className="flex-1 flex items-center justify-center gap-1.5 rounded-xl bg-white px-3.5 py-2.5 text-xs font-bold text-zinc-950 hover:bg-zinc-100 disabled:opacity-50 cursor-pointer transition-colors"
                            >
                                {upgradingMonthly ? (
                                    <Loader2 size={12} className="animate-spin" />
                                ) : (
                                    <Sparkles size={12} className="text-amber-400 fill-amber-400" />
                                )}
                                PKR 4.99 / mo
                            </button>
                            <button
                                onClick={() => handleUpgradeParent("annual")}
                                disabled={anyLoading}
                                className="flex-1 flex items-center justify-center gap-1.5 rounded-xl border border-zinc-700 px-3.5 py-2.5 text-xs font-bold text-white hover:bg-white/10 disabled:opacity-50 cursor-pointer transition-colors"
                            >
                                {upgradingAnnual && <Loader2 size={12} className="animate-spin" />}
                                PKR 49.90 / yr
                                <span className="ml-1 rounded-full bg-emerald-500/20 px-1.5 py-0.5 text-[9px] font-bold text-emerald-400">
                                    Save 17%
                                </span>
                            </button>
                        </div>
                    )}
                </div>
            )}

            {/* ── Invoice history ─────────────────────────────────────────── */}
            <div>
                <h4 className="text-xs font-bold text-zinc-900 dark:text-white mb-3">
                    Invoice history
                </h4>

                {!invoices.length ? (
                    <div className="rounded-2xl border border-dashed border-zinc-200 p-8 text-center text-xs text-zinc-400 dark:border-zinc-800 dark:text-zinc-500">
                        No invoices yet.
                    </div>
                ) : (
                    <div className="space-y-2">
                        {invoices.map((inv) => (
                            <div
                                key={inv.id}
                                className="flex items-center justify-between rounded-xl border border-zinc-100 bg-zinc-50 px-4 py-3 dark:border-zinc-800 dark:bg-zinc-900/40"
                            >
                                <div>
                                    <p className="text-xs font-bold text-zinc-900 dark:text-white">
                                        {inv.currency}{" "}
                                        {parseFloat(inv.amount).toLocaleString("en-PK", {
                                            minimumFractionDigits: 2,
                                        })}
                                    </p>
                                    {inv.paidAt && (
                                        <p className="text-[10px] text-zinc-400 mt-0.5">
                                            {new Date(inv.paidAt).toLocaleDateString("en-US", {
                                                month: "short",
                                                day: "numeric",
                                                year: "numeric",
                                            })}
                                        </p>
                                    )}
                                </div>
                                <span
                                    className={`text-[10px] font-bold px-2 py-0.5 rounded-full border ${inv.status === "paid"
                                        ? "bg-emerald-500/10 border-emerald-500/20 text-emerald-600 dark:text-emerald-400"
                                        : inv.status === "failed"
                                            ? "bg-red-500/10 border-red-500/20 text-red-600 dark:text-red-400"
                                            : "bg-zinc-100 border-zinc-200 text-zinc-500 dark:bg-zinc-900 dark:border-zinc-800"
                                        }`}
                                >
                                    {inv.status}
                                </span>
                            </div>
                        ))}
                    </div>
                )}
            </div>
        </motion.div>
    );
}