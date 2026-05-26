"use client";

import { useMemo, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Check, X, Sparkles, Loader2, ShieldCheck } from "lucide-react";
import { useRouter } from "next/navigation";
import {
  subscriptionTiers,
  BillingCycle,
  formatPrice,
} from "@/data/subscriptionTiers";

type TargetGroup = "schools" | "parents";

export function PricingSection() {
  const router = useRouter();
  const [target, setTarget] = useState<TargetGroup>("schools");
  const [cycle, setCycle] = useState<BillingCycle>("monthly");
  const [loadingTier, setLoadingTier] = useState<string | null>(null);

  const activeCards = useMemo(
    () =>
      target === "schools" ?
        [
          { key: "SchoolFree" as const, ...subscriptionTiers.SchoolFree },
          { key: "SchoolPremium" as const, ...subscriptionTiers.SchoolPremium },
        ]
      : [
          { key: "ParentFree" as const, ...subscriptionTiers.ParentFree },
          { key: "ParentPro" as const, ...subscriptionTiers.ParentPro },
        ],
    [target],
  );

  const handleCheckout = async (tierKey: string, isFree: boolean) => {
    if (isFree) {
      router.push("/sign-up");
      return;
    }

    setLoadingTier(tierKey);

    try {
      const res = await fetch("/api/stripe/checkout", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ tier: tierKey, cycle }),
      });

      // Not logged in — Clerk returned HTML instead of JSON
      if (
        res.status === 401 ||
        !res.headers.get("content-type")?.includes("application/json")
      ) {
        // Fully encode the entire redirect_url so cycle stays inside it
        const redirectTarget = `/checkout?tier=${tierKey}&cycle=${cycle}`;
        router.push(
          `/sign-up?redirect_url=${encodeURIComponent(redirectTarget)}`,
        );
        return;
      }

      const data = await res.json();
      if (!res.ok) throw new Error(data.error ?? "Checkout failed");
      if (data.url) window.location.href = data.url;
    } catch (err) {
      console.error("[PricingSection] Checkout error:", err);
      alert("Something went wrong. Please try again.");
    } finally {
      setLoadingTier(null);
    }
  };

  return (
    <section className="relative overflow-hidden py-28 bg-white dark:bg-zinc-950 text-zinc-950 dark:text-white">
      {/* Ambient Background */}
      <div className="absolute inset-0 pointer-events-none">
        <div className="absolute -top-30 left-1/2 -translate-x-1/2 w-180 h-180 rounded-full bg-zinc-200/30 dark:bg-white/4 blur-3xl" />
        <div className="absolute inset-0 bg-[linear-gradient(to_right,#80808010_1px,transparent_1px),linear-gradient(to_bottom,#80808010_1px,transparent_1px)] bg-size-[26px_26px] mask-[radial-gradient(ellipse_at_center,black,transparent_78%)]" />
      </div>

      <div className="relative mx-auto max-w-6xl px-6 lg:px-8">
        {/* Header */}
        <div className="mx-auto max-w-3xl text-center">
          <div className="inline-flex items-center gap-2 rounded-full border border-zinc-200 dark:border-zinc-800 bg-white/70 dark:bg-zinc-900/70 backdrop-blur px-4 py-2 mb-6 shadow-sm">
            <ShieldCheck size={14} className="text-emerald-500" />
            <span className="text-[11px] font-bold uppercase tracking-[0.18em] text-zinc-500 dark:text-zinc-400">
              Flexible Platform Pricing
            </span>
          </div>

          <h2 className="text-4xl sm:text-5xl lg:text-6xl font-black tracking-[-0.06em] leading-none">
            Predictable pricing
            <br />
            for every scale.
          </h2>

          <p className="mt-6 text-sm sm:text-base leading-relaxed text-zinc-500 dark:text-zinc-400 max-w-2xl mx-auto">
            Select your platform role and choose a billing cadence that fits
            your organization or household.
          </p>
        </div>

        {/* Controls */}
        <div className="mt-14 flex flex-col items-center gap-5">
          {/* Target Toggle */}
          <div className="flex items-center gap-3 rounded-2xl border border-zinc-200 dark:border-zinc-800 bg-zinc-100/80 dark:bg-zinc-900/80 p-1.5 backdrop-blur">
            {[
              { key: "schools", label: "Schools & Canteens" },
              { key: "parents", label: "Parents & Guardians" },
            ].map((item) => {
              const active = target === item.key;
              return (
                <button
                  key={item.key}
                  onClick={() => setTarget(item.key as TargetGroup)}
                  className={`relative px-5 py-2.5 rounded-xl text-xs sm:text-sm font-bold transition-colors duration-200 ${
                    active ?
                      "text-white dark:text-zinc-950"
                    : "text-zinc-500 dark:text-zinc-400 hover:text-zinc-950 dark:hover:text-white"
                  }`}
                >
                  {active && (
                    <motion.div
                      layoutId="target-toggle"
                      className="absolute inset-0 rounded-xl bg-zinc-950 dark:bg-white"
                      transition={{
                        type: "spring",
                        stiffness: 380,
                        damping: 30,
                      }}
                    />
                  )}
                  <span className="relative z-10">{item.label}</span>
                </button>
              );
            })}
          </div>

          {/* Billing Toggle */}
          <div className="relative flex items-center gap-2 rounded-2xl border border-zinc-200 dark:border-zinc-800 bg-zinc-100/80 dark:bg-zinc-900/80 p-1.5 backdrop-blur">
            {[
              { key: "monthly", label: "Monthly" },
              { key: "annual", label: "Annually" },
            ].map((item) => {
              const active = cycle === item.key;
              return (
                <button
                  key={item.key}
                  onClick={() => setCycle(item.key as BillingCycle)}
                  className={`relative px-5 py-2.5 rounded-xl text-xs sm:text-sm font-bold transition-colors duration-200 ${
                    active ?
                      "text-white dark:text-zinc-950"
                    : "text-zinc-500 dark:text-zinc-400 hover:text-zinc-950 dark:hover:text-white"
                  }`}
                >
                  {active && (
                    <motion.div
                      layoutId="billing-toggle"
                      className="absolute inset-0 rounded-xl bg-zinc-950 dark:bg-white"
                      transition={{
                        type: "spring",
                        stiffness: 380,
                        damping: 30,
                      }}
                    />
                  )}
                  <span className="relative z-10">{item.label}</span>
                </button>
              );
            })}

            <div className="absolute -right-14 -top-3">
              <div className="rounded-full bg-emerald-500 px-2.5 py-1 shadow-lg shadow-emerald-500/20">
                <span className="text-[9px] font-black uppercase tracking-wider text-white">
                  2 Months Free
                </span>
              </div>
            </div>
          </div>
        </div>

        {/* Cards — AnimatePresence wraps a single motion.div that switches content,
            not multiple children. mode="wait" only works with one child at a time. */}
        <div className="mt-20 grid grid-cols-1 lg:grid-cols-2 gap-8 max-w-5xl mx-auto">
          <AnimatePresence mode="wait">
            <motion.div
              key={target} // re-mounts the whole grid when target changes
              className="contents"
              initial={{ opacity: 0, y: 16 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              transition={{ duration: 0.28, ease: "easeOut" }}
            >
              {activeCards.map((card, i) => {
                const centsPrice =
                  cycle === "monthly" ?
                    card.monthlyPriceInCents
                  : card.annualPriceInCents;

                const isPaidTier = centsPrice > 0;

                const yearlySavings =
                  card.monthlyPriceInCents * 12 - card.annualPriceInCents;

                // Format price as PKR
                const displayPrice =
                  centsPrice === 0 ? "Free" : (
                    `Rs. ${(centsPrice / 100).toLocaleString()}`
                  );

                return (
                  <motion.div
                    key={card.key}
                    initial={{ opacity: 0, y: 18, scale: 0.98 }}
                    animate={{ opacity: 1, y: 0, scale: isPaidTier ? 1.02 : 1 }}
                    transition={{
                      duration: 0.35,
                      delay: i * 0.08,
                      ease: "easeOut",
                    }}
                    className={`group relative flex flex-col rounded-4xl p-8 transition-all duration-500 border overflow-hidden ${
                      isPaidTier ?
                        "border-zinc-900/70 dark:border-white/10 bg-linear-to-b from-zinc-50 to-white dark:from-zinc-900 dark:to-zinc-950 shadow-[0_20px_80px_-20px_rgba(0,0,0,0.18)] dark:shadow-[0_20px_80px_-20px_rgba(255,255,255,0.08)] hover:-translate-y-1"
                      : "border-zinc-200 dark:border-zinc-800 bg-white/70 dark:bg-zinc-900/40 backdrop-blur hover:-translate-y-1 hover:shadow-2xl"
                    }`}
                  >
                    {isPaidTier && (
                      <div className="absolute inset-0 bg-[radial-gradient(circle_at_top,rgba(255,255,255,0.8),transparent_35%)] dark:bg-[radial-gradient(circle_at_top,rgba(255,255,255,0.08),transparent_30%)] pointer-events-none" />
                    )}

                    {isPaidTier && (
                      <div className="absolute top-5 right-5">
                        <div className="inline-flex items-center gap-1 rounded-full bg-zinc-950 dark:bg-white px-3 py-1.5 shadow-md">
                          <Sparkles
                            size={12}
                            className="text-amber-400 fill-amber-400"
                          />
                          <span className="text-[10px] font-black uppercase tracking-[0.14em] text-white dark:text-zinc-950">
                            Premium
                          </span>
                        </div>
                      </div>
                    )}

                    <div className="relative z-10">
                      <h3 className="text-2xl font-black tracking-[-0.04em]">
                        {card.name}
                      </h3>

                      <p className="mt-3 text-sm leading-relaxed text-zinc-500 dark:text-zinc-400 min-h-13">
                        {card.desc}
                      </p>

                      {/* Price */}
                      <div className="mt-8 flex items-end gap-2">
                        <span className="text-5xl font-black tracking-[-0.08em] leading-none">
                          {displayPrice}
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
                            Save Rs.{" "}
                            {Math.floor(yearlySavings / 100).toLocaleString()}
                            /year
                          </span>
                        </div>
                      )}

                      {/* Features */}
                      <ul className="mt-10 space-y-4 border-t border-zinc-200/70 dark:border-zinc-800 pt-8">
                        {card.features.map((feat, idx) => (
                          <li key={idx} className="flex items-start gap-3">
                            {feat.included ?
                              <div className="mt-0.5 flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-zinc-950 dark:bg-white">
                                <Check
                                  size={12}
                                  className="text-white dark:text-zinc-950"
                                />
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
                        onClick={() => handleCheckout(card.key, !isPaidTier)}
                        disabled={loadingTier !== null}
                        className={`relative mt-10 overflow-hidden w-full rounded-2xl py-4 text-sm font-black tracking-tight transition-all duration-300 flex items-center justify-center gap-2 disabled:opacity-60 disabled:cursor-not-allowed ${
                          isPaidTier ?
                            "bg-zinc-950 hover:bg-black text-white dark:bg-white dark:text-zinc-950 dark:hover:bg-zinc-200 shadow-xl shadow-zinc-950/10"
                          : "bg-zinc-100 hover:bg-zinc-200 dark:bg-zinc-800 dark:hover:bg-zinc-700 text-zinc-950 dark:text-white"
                        }`}
                      >
                        <div className="absolute inset-0 -translate-x-full bg-linear-to-r from-transparent via-white/10 to-transparent group-hover:translate-x-full transition-transform duration-1000" />

                        {loadingTier === card.key ?
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
              })}
            </motion.div>
          </AnimatePresence>
        </div>
      </div>
    </section>
  );
}
