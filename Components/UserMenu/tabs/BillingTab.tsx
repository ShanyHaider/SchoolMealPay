"use client";

import React, { useState, useEffect } from "react";
import {
  Sparkles,
  Loader2,
  ExternalLink,
  CheckCircle2,
  Clock,
  AlertTriangle,
  Check,
  X,
  RefreshCw,
  Receipt,
  CreditCard,
  Download,
} from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";

// ─── Types ────────────────────────────────────────────────────────────────────

interface Subscription {
  status: string;
  trialEndsAt: string | null;
  currentPeriodEnd: string | null;
  stripeCustomerId: string | null;
  interval?: "month" | "year" | null;
}

interface Invoice {
  id: string;
  amount: string;
  currency: string;
  status: string;
  paidAt: string | null;
  billingPeriodStart: string | null;
  billingPeriodEnd: string | null;
  invoiceUrl?: string | null;
}

interface BillingData {
  subscription: Subscription | null;
  invoices: Invoice[];
}

// ─── Plan features ────────────────────────────────────────────────────────────

const FREE_FEATURES = [
  { label: "1 child profile", included: true },
  { label: "Basic canteen balance view", included: true },
  { label: "Transaction history (30 days)", included: true },
  { label: "Email notifications", included: true },
  { label: "Multiple child profiles", included: false },
  { label: "Full transaction history", included: false },
  { label: "Spending limits & alerts", included: false },
  { label: "Priority support", included: false },
];

const PRO_FEATURES = [
  { label: "Unlimited child profiles", included: true },
  { label: "Full canteen balance & history", included: true },
  { label: "Full transaction history", included: true },
  { label: "Spending limits & smart alerts", included: true },
  { label: "Nutrition & meal insights", included: true },
  { label: "Export reports (CSV / PDF)", included: true },
  { label: "Priority support", included: true },
  { label: "Early access to new features", included: true },
];

// ─── Sub-components ───────────────────────────────────────────────────────────

function Skeleton({ className }: { className?: string }) {
  return (
    <div
      className={`animate-pulse rounded-xl bg-zinc-100 dark:bg-zinc-800/60 ${className}`}
    />
  );
}

function BillingSkeleton() {
  return (
    <div className="space-y-6">
      <div className="space-y-1">
        <Skeleton className="h-6 w-36" />
        <Skeleton className="h-3.5 w-56 mt-1" />
      </div>
      <div className="rounded-2xl border border-zinc-100 dark:border-zinc-800 p-5 space-y-3">
        <Skeleton className="h-4 w-20" />
        <Skeleton className="h-7 w-28" />
        <Skeleton className="h-5 w-24" />
        <Skeleton className="h-9 w-44 mt-2" />
      </div>
      <div className="space-y-2">
        <Skeleton className="h-4 w-28 mb-3" />
        <Skeleton className="h-12 w-full rounded-xl" />
        <Skeleton className="h-12 w-full rounded-xl" />
      </div>
    </div>
  );
}

function StatusBadge({ status }: { status: string }) {
  const configs: Record<
    string,
    { label: string; color: string; bg: string; icon: React.ReactNode }
  > = {
    trialing: {
      label: "Free Trial",
      color: "text-blue-600 dark:text-blue-400",
      bg: "bg-blue-500/10 border-blue-500/20",
      icon: <Clock size={11} />,
    },
    active: {
      label: "Active",
      color: "text-emerald-600 dark:text-emerald-400",
      bg: "bg-emerald-500/10 border-emerald-500/20",
      icon: <CheckCircle2 size={11} />,
    },
    past_due: {
      label: "Past Due",
      color: "text-amber-600 dark:text-amber-400",
      bg: "bg-amber-500/10 border-amber-500/20",
      icon: <AlertTriangle size={11} />,
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
  };

  const cfg = configs[status];
  if (!cfg) return null;

  return (
    <span
      className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full border text-[10px] font-bold ${cfg.bg} ${cfg.color}`}
    >
      {cfg.icon}
      {cfg.label}
    </span>
  );
}

function FeatureRow({ label, included }: { label: string; included: boolean }) {
  return (
    <div className="flex items-center gap-2">
      {included ?
        <Check size={12} className="text-emerald-500 shrink-0" />
      : <X size={12} className="text-zinc-300 dark:text-zinc-700 shrink-0" />}
      <span
        className={`text-[11px] ${included ? "text-zinc-600 dark:text-zinc-300" : "text-zinc-400 dark:text-zinc-600 line-through"}`}
      >
        {label}
      </span>
    </div>
  );
}

// ─── Plan comparison cards (shown when on free plan) ─────────────────────────

function PlanCards({
  actionLoading,
  onUpgrade,
}: {
  actionLoading: string | null;
  onUpgrade: (cycle: "monthly" | "annual") => void;
}) {
  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
      {/* Free */}
      <div className="rounded-2xl border border-zinc-200 dark:border-zinc-800 p-4 space-y-3">
        <div>
          <p className="text-[9px] font-black uppercase tracking-widest text-zinc-400">
            Current
          </p>
          <h5 className="text-sm font-black text-zinc-900 dark:text-white mt-0.5">
            Free
          </h5>
          <p className="text-lg font-black text-zinc-900 dark:text-white mt-1">
            PKR 0
            <span className="text-xs font-medium text-zinc-400"> / mo</span>
          </p>
        </div>
        <div className="space-y-1.5 pt-1">
          {FREE_FEATURES.map((f) => (
            <FeatureRow key={f.label} {...f} />
          ))}
        </div>
        <div className="h-9 flex items-center justify-center rounded-xl border border-zinc-200 dark:border-zinc-800 text-xs font-bold text-zinc-400">
          Current plan
        </div>
      </div>

      {/* Pro */}
      <div className="rounded-2xl border-2 border-zinc-950 dark:border-white p-4 space-y-3 relative overflow-hidden">
        {/* "Best value" ribbon */}
        <div className="absolute top-3 right-3">
          <span className="flex items-center gap-1 bg-amber-400/20 border border-amber-400/30 text-amber-600 dark:text-amber-400 text-[9px] font-black px-2 py-0.5 rounded-full">
            <Sparkles size={8} className="fill-amber-500 text-amber-500" />
            PRO
          </span>
        </div>

        <div>
          <p className="text-[9px] font-black uppercase tracking-widest text-zinc-400">
            Upgrade
          </p>
          <h5 className="text-sm font-black text-zinc-900 dark:text-white mt-0.5">
            Parent Pro
          </h5>
          <div className="flex items-baseline gap-2 mt-1">
            <p className="text-lg font-black text-zinc-900 dark:text-white">
              PKR 499
              <span className="text-xs font-medium text-zinc-400"> / mo</span>
            </p>
            <span className="text-[10px] text-emerald-600 dark:text-emerald-400 font-bold">
              or PKR 4,499/yr
            </span>
          </div>
        </div>

        <div className="space-y-1.5 pt-1">
          {PRO_FEATURES.map((f) => (
            <FeatureRow key={f.label} {...f} />
          ))}
        </div>

        <div className="space-y-2 pt-1">
          <button
            onClick={() => onUpgrade("monthly")}
            disabled={actionLoading !== null}
            className="w-full flex h-9 items-center justify-center gap-1.5 rounded-xl bg-zinc-950 text-xs font-bold text-white hover:bg-zinc-900 dark:bg-white dark:text-zinc-950 dark:hover:bg-zinc-100 disabled:opacity-50 cursor-pointer transition-colors"
          >
            {actionLoading === "monthly" ?
              <Loader2 size={12} className="animate-spin" />
            : <Sparkles size={12} className="text-amber-400 fill-amber-400" />}
            Upgrade monthly
          </button>
          <button
            onClick={() => onUpgrade("annual")}
            disabled={actionLoading !== null}
            className="w-full flex h-9 items-center justify-center gap-1.5 rounded-xl border border-zinc-200 dark:border-zinc-800 text-xs font-bold hover:bg-zinc-50 dark:hover:bg-zinc-900 disabled:opacity-50 cursor-pointer transition-colors"
          >
            {actionLoading === "annual" ?
              <Loader2 size={12} className="animate-spin" />
            : null}
            Annual — save 25%
          </button>
        </div>
      </div>
    </div>
  );
}

// ─── Invoice row ──────────────────────────────────────────────────────────────

function InvoiceRow({ inv }: { inv: Invoice }) {
  const amount = parseFloat(inv.amount);
  const formattedAmount =
    isNaN(amount) ? inv.amount : amount.toLocaleString("en-PK");
  const currency = inv.currency.toUpperCase();

  const period =
    inv.billingPeriodStart && inv.billingPeriodEnd ?
      `${new Date(inv.billingPeriodStart).toLocaleDateString("en-US", { month: "short", day: "numeric" })} – ${new Date(inv.billingPeriodEnd).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" })}`
    : null;

  return (
    <div className="flex items-center justify-between rounded-xl border border-zinc-100 bg-zinc-50 px-4 py-3 dark:border-zinc-800 dark:bg-zinc-900/40 gap-3">
      <div className="flex items-center gap-3 min-w-0">
        <div className="h-8 w-8 rounded-lg bg-zinc-100 dark:bg-zinc-800 flex items-center justify-center shrink-0">
          <Receipt size={13} className="text-zinc-400" />
        </div>
        <div className="min-w-0">
          <p className="text-xs font-bold text-zinc-900 dark:text-white">
            {currency} {formattedAmount}
          </p>
          {period ?
            <p className="text-[10px] text-zinc-400 mt-0.5 truncate">
              {period}
            </p>
          : inv.paidAt ?
            <p className="text-[10px] text-zinc-400 mt-0.5">
              {new Date(inv.paidAt).toLocaleDateString("en-US", {
                month: "short",
                day: "numeric",
                year: "numeric",
              })}
            </p>
          : null}
        </div>
      </div>

      <div className="flex items-center gap-2 shrink-0">
        <span
          className={`text-[10px] font-bold px-2 py-0.5 rounded-full border ${
            inv.status === "paid" ?
              "bg-emerald-500/10 border-emerald-500/20 text-emerald-600 dark:text-emerald-400"
            : inv.status === "open" ?
              "bg-amber-500/10 border-amber-500/20 text-amber-600 dark:text-amber-400"
            : "bg-zinc-100 border-zinc-200 text-zinc-500 dark:bg-zinc-900 dark:border-zinc-800"
          }`}
        >
          {inv.status}
        </span>
        {inv.invoiceUrl && (
          <a
            href={inv.invoiceUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="rounded-lg p-1.5 text-zinc-400 hover:text-zinc-600 hover:bg-zinc-100 dark:hover:bg-zinc-800 transition-colors"
            title="Download invoice"
          >
            <Download size={11} />
          </a>
        )}
      </div>
    </div>
  );
}

// ─── Main BillingTab ──────────────────────────────────────────────────────────

export function BillingTab() {
  const [data, setData] = useState<BillingData | null>(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [actionLoading, setActionLoading] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const fetchBilling = async (showRefreshing = false) => {
    if (showRefreshing) setRefreshing(true);
    else setLoading(true);
    setError(null);
    try {
      const res = await fetch("/api/user/billing");
      if (!res.ok) throw new Error("Failed to load billing information.");
      const json = await res.json();
      setData(json);
    } catch (err) {
      const e = err as { message?: string };
      setError(e?.message ?? "Something went wrong.");
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    fetchBilling();
  }, []);

  const handleUpgrade = async (cycle: "monthly" | "annual") => {
    setActionLoading(cycle);
    try {
      const res = await fetch("/api/stripe/checkout", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ tier: "ParentPro", cycle }),
      });
      const d = await res.json();
      if (d.url) window.location.href = d.url;
      else throw new Error("No checkout URL returned.");
    } catch (err) {
      const e = err as { message?: string };
      setError(e?.message ?? "Could not start checkout.");
    } finally {
      setActionLoading(null);
    }
  };

  const handleManage = async () => {
    setActionLoading("portal");
    try {
      const res = await fetch("/api/user/billing-portal", { method: "POST" });
      const d = await res.json();
      if (d.url) window.location.href = d.url;
      else throw new Error("No portal URL returned.");
    } catch (err) {
      const e = err as { message?: string };
      setError(e?.message ?? "Could not open billing portal.");
    } finally {
      setActionLoading(null);
    }
  };

  if (loading) return <BillingSkeleton />;

  const sub = data?.subscription;
  const isActive = sub?.status === "active" || sub?.status === "trialing";
  const isTrial = sub?.status === "trialing";
  const isPastDue = sub?.status === "past_due";

  return (
    <motion.div
      initial={{ opacity: 0, y: 4 }}
      animate={{ opacity: 1, y: 0 }}
      className="space-y-6"
    >
      {/* Header */}
      <div className="flex items-start justify-between gap-3">
        <div>
          <h3 className="text-lg font-black tracking-tight text-zinc-950 dark:text-white">
            Plans &amp; Billing
          </h3>
          <p className="text-xs text-zinc-400 dark:text-zinc-500 mt-0.5">
            Manage your subscription and view invoice history.
          </p>
        </div>
        <button
          onClick={() => fetchBilling(true)}
          disabled={refreshing}
          className="flex items-center gap-1.5 rounded-xl border border-zinc-200 dark:border-zinc-800 px-3 py-1.5 text-[11px] font-bold text-zinc-500 hover:bg-zinc-50 dark:hover:bg-zinc-900 disabled:opacity-40 cursor-pointer transition-colors shrink-0"
        >
          <RefreshCw size={11} className={refreshing ? "animate-spin" : ""} />
          Refresh
        </button>
      </div>

      {/* Error state */}
      <AnimatePresence>
        {error && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: "auto" }}
            exit={{ opacity: 0, height: 0 }}
            className="flex items-center gap-2.5 p-3.5 rounded-xl border bg-red-500/10 border-red-500/20 text-xs font-semibold text-red-600 dark:text-red-400"
          >
            <AlertTriangle size={13} />
            {error}
            <button
              onClick={() => setError(null)}
              className="ml-auto text-red-400 hover:text-red-600"
            >
              <X size={13} />
            </button>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Current plan card */}
      <div className="rounded-2xl border border-zinc-200 bg-zinc-50 p-5 dark:border-zinc-800 dark:bg-zinc-900/40 space-y-4">
        <div className="flex items-start justify-between gap-4">
          <div className="space-y-1.5">
            <p className="text-[9px] font-black uppercase tracking-widest text-zinc-400 dark:text-zinc-500">
              Current Plan
            </p>
            <h4 className="text-base font-black text-zinc-950 dark:text-white">
              {isActive ? "Parent Pro" : "Free"}
            </h4>
            {sub?.status && <StatusBadge status={sub.status} />}
          </div>

          {/* Actions */}
          {isActive ?
            <button
              onClick={handleManage}
              disabled={actionLoading === "portal"}
              className="flex items-center gap-1.5 rounded-xl border border-zinc-200 px-3.5 py-2 text-xs font-bold dark:border-zinc-700 hover:bg-zinc-100 dark:hover:bg-zinc-800 disabled:opacity-50 shrink-0 cursor-pointer transition-colors"
            >
              {actionLoading === "portal" ?
                <Loader2 size={12} className="animate-spin" />
              : <CreditCard size={12} />}
              Manage subscription
            </button>
          : null}
        </div>

        {/* Billing cycle info */}
        {sub?.interval && isActive && (
          <p className="text-[11px] text-zinc-400 dark:text-zinc-500">
            Billed{" "}
            <span className="font-bold text-zinc-600 dark:text-zinc-300">
              {sub.interval === "year" ? "annually" : "monthly"}
            </span>
            {sub.interval === "month" && (
              <span className="ml-1 text-emerald-600 dark:text-emerald-400 font-bold">
                · Switch to annual and save 25%{" "}
                <button
                  onClick={handleManage}
                  className="underline cursor-pointer"
                >
                  Manage →
                </button>
              </span>
            )}
          </p>
        )}

        {/* Trial end */}
        {isTrial && sub?.trialEndsAt && (
          <p className="text-[11px] text-zinc-400 dark:text-zinc-500">
            Trial ends{" "}
            <span className="font-bold text-zinc-600 dark:text-zinc-300">
              {new Date(sub.trialEndsAt).toLocaleDateString("en-US", {
                month: "long",
                day: "numeric",
                year: "numeric",
              })}
            </span>
            . You won&apos;t be charged until then.
          </p>
        )}

        {/* Next billing */}
        {sub?.status === "active" && sub?.currentPeriodEnd && (
          <p className="text-[11px] text-zinc-400 dark:text-zinc-500">
            Next billing date:{" "}
            <span className="font-bold text-zinc-600 dark:text-zinc-300">
              {new Date(sub.currentPeriodEnd).toLocaleDateString("en-US", {
                month: "long",
                day: "numeric",
                year: "numeric",
              })}
            </span>
          </p>
        )}

        {/* Past due warning */}
        {isPastDue && (
          <div className="flex items-center gap-2 rounded-xl bg-amber-500/10 border border-amber-500/20 px-3.5 py-2.5 text-xs font-medium text-amber-600 dark:text-amber-400">
            <AlertTriangle size={13} className="shrink-0" />
            <span>
              Your last payment failed. Update your payment method to keep
              access.{" "}
              <button
                onClick={handleManage}
                className="underline font-bold cursor-pointer"
              >
                Update now →
              </button>
            </span>
          </div>
        )}

        {/* Pro feature list (when subscribed) */}
        {isActive && (
          <div className="pt-2 border-t border-zinc-100 dark:border-zinc-800">
            <p className="text-[10px] font-black uppercase tracking-widest text-zinc-400 mb-2">
              Your plan includes
            </p>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-1">
              {PRO_FEATURES.map((f) => (
                <FeatureRow key={f.label} {...f} />
              ))}
            </div>
            <button
              onClick={handleManage}
              className="mt-3 flex items-center gap-1.5 text-[11px] font-bold text-zinc-500 hover:text-zinc-800 dark:hover:text-zinc-200 transition-colors cursor-pointer"
            >
              <ExternalLink size={11} />
              View invoices &amp; manage payment method
            </button>
          </div>
        )}
      </div>

      {/* Plan comparison (free users only) */}
      {!isActive && (
        <div>
          <p className="text-xs font-bold text-zinc-900 dark:text-white mb-3">
            Upgrade to Parent Pro
          </p>
          <PlanCards actionLoading={actionLoading} onUpgrade={handleUpgrade} />
        </div>
      )}

      {/* Invoice history */}
      <div>
        <div className="flex items-center justify-between mb-3">
          <h4 className="text-xs font-bold text-zinc-900 dark:text-white">
            Invoice history
          </h4>
          {(data?.invoices.length ?? 0) > 0 && (
            <p className="text-[10px] text-zinc-400">
              {data!.invoices.length} invoice
              {data!.invoices.length !== 1 ? "s" : ""}
            </p>
          )}
        </div>

        {!data?.invoices.length ?
          <div className="rounded-2xl border border-dashed border-zinc-200 p-8 text-center dark:border-zinc-800 space-y-1">
            <Receipt
              size={20}
              className="mx-auto text-zinc-300 dark:text-zinc-700"
            />
            <p className="text-xs text-zinc-400 dark:text-zinc-500 mt-2">
              No invoices yet.
            </p>
            <p className="text-[11px] text-zinc-300 dark:text-zinc-700">
              Invoices will appear here once you upgrade.
            </p>
          </div>
        : <div className="space-y-2">
            {data.invoices.map((inv) => (
              <InvoiceRow key={inv.id} inv={inv} />
            ))}
          </div>
        }
      </div>
    </motion.div>
  );
}
