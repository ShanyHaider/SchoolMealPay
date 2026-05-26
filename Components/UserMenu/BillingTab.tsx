"use client";

import React, { useEffect, useState } from "react";
import {
  Sparkles,
  Loader2,
  ExternalLink,
  CheckCircle2,
  Clock,
  AlertTriangle,
} from "lucide-react";
import { motion } from "framer-motion";

interface Subscription {
  status: string;
  trialEndsAt: string | null;
  currentPeriodEnd: string | null;
  stripeCustomerId: string | null;
}

interface Invoice {
  id: string;
  amount: string;
  currency: string;
  status: string;
  paidAt: string | null;
  billingPeriodStart: string | null;
  billingPeriodEnd: string | null;
}

interface BillingData {
  subscription: Subscription | null;
  invoices: Invoice[];
}

export function BillingTab() {
  const [data, setData] = useState<BillingData | null>(null);
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState<string | null>(null);

  useEffect(() => {
    fetch("/api/user/billing")
      .then((r) => r.json())
      .then(setData)
      .catch(console.error)
      .finally(() => setLoading(false));
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
    } catch (err) {
      console.error(err);
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
    } catch (err) {
      console.error(err);
    } finally {
      setActionLoading(null);
    }
  };

  const sub = data?.subscription;
  const isActive = sub?.status === "active" || sub?.status === "trialing";
  const isTrial = sub?.status === "trialing";
  const isPastDue = sub?.status === "past_due";

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
  const badge =
    currentStatus && statusConfig[currentStatus] ?
      statusConfig[currentStatus]
    : null;

  if (loading) {
    return (
      <div className="flex items-center justify-center py-20">
        <Loader2 size={20} className="animate-spin text-zinc-400" />
      </div>
    );
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 4 }}
      animate={{ opacity: 1, y: 0 }}
      className="space-y-6"
    >
      <div>
        <h3 className="text-lg font-black tracking-tight text-zinc-950 dark:text-white">
          Plans & Billing
        </h3>
        <p className="text-xs text-zinc-400 dark:text-zinc-500 mt-0.5">
          Manage your subscription and view invoice history.
        </p>
      </div>

      {/* Current plan card */}
      <div className="rounded-2xl border border-zinc-200 bg-zinc-50 p-5 dark:border-zinc-800 dark:bg-zinc-900/40 space-y-4">
        <div className="flex items-start justify-between gap-4">
          <div>
            <span className="text-[9px] font-black uppercase tracking-widest text-zinc-400 dark:text-zinc-500">
              Current Plan
            </span>
            <h4 className="text-base font-black text-zinc-950 dark:text-white mt-0.5">
              {isActive ? "Parent Pro" : "Free"}
            </h4>

            {/* Status badge */}
            {badge && (
              <div
                className={`inline-flex items-center gap-1.5 mt-2 px-2.5 py-1 rounded-full border text-[10px] font-bold ${badge.bg} ${badge.color}`}
              >
                {badge.icon}
                {badge.label}
              </div>
            )}
          </div>

          {/* Action button */}
          {isActive ?
            <button
              onClick={handleManage}
              disabled={actionLoading === "portal"}
              className="flex items-center gap-1.5 rounded-xl border border-zinc-200 px-3.5 py-2 text-xs font-bold dark:border-zinc-700 hover:bg-zinc-100 dark:hover:bg-zinc-800 disabled:opacity-50 shrink-0 cursor-pointer"
            >
              {actionLoading === "portal" ?
                <Loader2 size={12} className="animate-spin" />
              : <ExternalLink size={12} />}
              Manage subscription
            </button>
          : <div className="flex gap-2 shrink-0">
              <button
                onClick={() => handleUpgrade("monthly")}
                disabled={actionLoading !== null}
                className="flex items-center gap-1.5 rounded-xl bg-zinc-950 px-3.5 py-2 text-xs font-bold text-white hover:bg-zinc-900 dark:bg-white dark:text-zinc-950 dark:hover:bg-zinc-100 disabled:opacity-50 cursor-pointer"
              >
                {actionLoading === "monthly" ?
                  <Loader2 size={12} className="animate-spin" />
                : <Sparkles
                    size={12}
                    className="text-amber-400 fill-amber-400"
                  />
                }
                Monthly
              </button>
              <button
                onClick={() => handleUpgrade("annual")}
                disabled={actionLoading !== null}
                className="flex items-center gap-1.5 rounded-xl border border-zinc-200 px-3.5 py-2 text-xs font-bold dark:border-zinc-700 hover:bg-zinc-100 dark:hover:bg-zinc-800 disabled:opacity-50 cursor-pointer"
              >
                {actionLoading === "annual" ?
                  <Loader2 size={12} className="animate-spin" />
                : null}
                Annual
              </button>
            </div>
          }
        </div>

        {/* Trial end date */}
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
            . You won't be charged until then.
          </p>
        )}

        {/* Active period end */}
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
            <AlertTriangle size={13} />
            Your last payment failed. Update your payment method to keep access.
            <button
              onClick={handleManage}
              className="underline font-bold cursor-pointer"
            >
              Update now
            </button>
          </div>
        )}
      </div>

      {/* Invoice history */}
      <div>
        <h4 className="text-xs font-bold text-zinc-900 dark:text-white mb-3">
          Invoice history
        </h4>

        {!data?.invoices.length ?
          <div className="rounded-2xl border border-dashed border-zinc-200 p-8 text-center text-xs text-zinc-400 dark:border-zinc-800 dark:text-zinc-500">
            No invoices yet.
          </div>
        : <div className="space-y-2">
            {data.invoices.map((inv) => (
              <div
                key={inv.id}
                className="flex items-center justify-between rounded-xl border border-zinc-100 bg-zinc-50 px-4 py-3 dark:border-zinc-800 dark:bg-zinc-900/40"
              >
                <div>
                  <p className="text-xs font-bold text-zinc-900 dark:text-white">
                    {inv.currency} {parseFloat(inv.amount).toLocaleString()}
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
                  className={`text-[10px] font-bold px-2 py-0.5 rounded-full border ${
                    inv.status === "paid" ?
                      "bg-emerald-500/10 border-emerald-500/20 text-emerald-600 dark:text-emerald-400"
                    : "bg-zinc-100 border-zinc-200 text-zinc-500 dark:bg-zinc-900 dark:border-zinc-800"
                  }`}
                >
                  {inv.status}
                </span>
              </div>
            ))}
          </div>
        }
      </div>
    </motion.div>
  );
}
