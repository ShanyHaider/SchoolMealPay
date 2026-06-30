"use client";

import { Check, X, Sparkles, Loader2 } from "lucide-react";
import { motion } from "framer-motion";
import { formatPrice, type BillingCycle } from "@/data/subscriptionTiers";

export interface PricingCardData {
  key: string;
  name: string;
  desc: string;
  monthlyPriceInCents: number;
  annualPriceInCents: number;
  features: { text: string; included: boolean }[];
}

interface Props {
  card: PricingCardData;
  cycle: BillingCycle;
  highlight?: boolean;
  badge?: string | null;
  index?: number;
  isLoading?: boolean;
  onCheckout: (tierKey: string, isFree: boolean) => void;
}

export function PricingCard({
  card,
  cycle,
  highlight = false,
  badge,
  index = 0,
  isLoading,
  onCheckout,
}: Props) {
  const cents =
    cycle === "monthly" ? card.monthlyPriceInCents : card.annualPriceInCents;
  const isPaidTier = cents > 0;
  const yearlySavings = card.monthlyPriceInCents * 12 - card.annualPriceInCents;

  return (
    <motion.div
      initial={{ opacity: 0, y: 18, scale: 0.98 }}
      animate={{ opacity: 1, y: 0, scale: highlight ? 1.02 : 1 }}
      transition={{ duration: 0.35, delay: index * 0.08, ease: "easeOut" }}
      className={`group relative flex flex-col rounded-4xl p-8 transition-all duration-500 border overflow-hidden ${
        highlight ?
          "border-zinc-900/70 dark:border-white/10 bg-linear-to-b from-zinc-50 to-white dark:from-zinc-900 dark:to-zinc-950 shadow-[0_20px_80px_-20px_rgba(0,0,0,0.18)] dark:shadow-[0_20px_80px_-20px_rgba(255,255,255,0.08)] hover:-translate-y-1"
        : "border-zinc-200 dark:border-zinc-800 bg-white/70 dark:bg-zinc-900/40 backdrop-blur hover:-translate-y-1 hover:shadow-2xl"
      }`}
    >
      {/* Radial shimmer — premium only */}
      {highlight && (
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_top,rgba(255,255,255,0.8),transparent_35%)] dark:bg-[radial-gradient(circle_at_top,rgba(255,255,255,0.08),transparent_30%)] pointer-events-none" />
      )}

      {/* Hover shimmer sweep */}
      {highlight && (
        <div className="absolute inset-0 -translate-x-full bg-linear-to-r from-transparent via-white/10 to-transparent group-hover:translate-x-full transition-transform duration-1000 pointer-events-none" />
      )}

      {/* Badge — top right for premium, top banner for others */}
      {badge && highlight && (
        <div className="absolute top-5 right-5">
          <div className="inline-flex items-center gap-1 rounded-full bg-zinc-950 dark:bg-white px-3 py-1.5 shadow-md">
            <Sparkles size={12} className="text-amber-400 fill-amber-400" />
            <span className="text-[10px] font-black uppercase tracking-[0.14em] text-white dark:text-zinc-950">
              {badge}
            </span>
          </div>
        </div>
      )}
      {badge && !highlight && (
        <div className="absolute top-0 left-0 right-0 py-1.5 text-center text-[10px] font-black uppercase tracking-widest bg-zinc-950 dark:bg-white text-white dark:text-zinc-950">
          {badge}
        </div>
      )}

      <div
        className={`relative z-10 flex flex-col flex-1 ${badge && !highlight ? "pt-6" : ""}`}
      >
        {/* Name + desc */}
        <h3 className="text-2xl font-black tracking-[-0.04em] text-zinc-950 dark:text-white">
          {card.name}
        </h3>
        <p className="mt-3 text-sm leading-relaxed text-zinc-500 dark:text-zinc-400 min-h-13">
          {card.desc}
        </p>

        {/* Price */}
        <div className="mt-8 flex items-end gap-2">
          <span className="text-5xl font-black tracking-[-0.08em] leading-none text-zinc-950 dark:text-white">
            {formatPrice(cents)}
          </span>
          {isPaidTier && (
            <span className="pb-1 text-sm font-bold text-zinc-400 dark:text-zinc-500">
              /{cycle === "monthly" ? "mo" : "yr"}
            </span>
          )}
        </div>

        {cycle === "annual" && yearlySavings > 0 && (
          <div className="mt-4 inline-flex items-center rounded-full bg-emerald-500/10 dark:bg-emerald-500/15 px-3 py-1.5">
            <span className="text-[11px] font-bold text-emerald-600 dark:text-emerald-400">
              Save {formatPrice(yearlySavings)}/year
            </span>
          </div>
        )}

        {/* Features */}
        <ul className="mt-10 space-y-4 border-t border-zinc-200/70 dark:border-zinc-800 pt-8 flex-1">
          {card.features.map((feat, idx) => (
            <li key={idx} className="flex items-start gap-3">
              {feat.included ?
                <div className="mt-0.5 flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-zinc-950 dark:bg-white">
                  <Check size={12} className="text-white dark:text-zinc-950" />
                </div>
              : <div className="mt-0.5 flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-zinc-200 dark:bg-zinc-800">
                  <X size={12} className="text-zinc-400" />
                </div>
              }
              <span
                className={`text-sm leading-relaxed ${
                  feat.included ?
                    "text-zinc-700 dark:text-zinc-300 font-medium"
                  : "text-zinc-400/70 line-through"
                }`}
              >
                {feat.text}
              </span>
            </li>
          ))}
        </ul>

        {/* CTA */}
        <button
          onClick={() => onCheckout(card.key, !isPaidTier)}
          disabled={isLoading}
          className={`relative mt-10 overflow-hidden w-full rounded-2xl py-4 text-sm font-black tracking-tight transition-all duration-300 flex items-center justify-center gap-2 disabled:opacity-60 disabled:cursor-not-allowed ${
            highlight ?
              "bg-zinc-950 hover:bg-black text-white dark:bg-white dark:text-zinc-950 dark:hover:bg-zinc-200 shadow-xl shadow-zinc-950/10"
            : "bg-zinc-100 hover:bg-zinc-200 dark:bg-zinc-800 dark:hover:bg-zinc-700 text-zinc-950 dark:text-white"
          }`}
        >
          {isLoading ?
            <Loader2 size={16} className="animate-spin" />
          : isPaidTier ?
            cycle === "monthly" ?
              "Start Free Trial"
            : "Claim Annual Discount"
          : "Get Started Free"}
        </button>
      </div>
    </motion.div>
  );
}
