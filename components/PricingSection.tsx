"use client";

import { ShieldCheck } from "lucide-react";
import { PricingCards } from "@/features/billing/PricingCards";

export function PricingSection() {
  return (
    <section className="relative overflow-hidden py-28 bg-white dark:bg-zinc-950">
      <div className="absolute inset-0 pointer-events-none">
        <div className="absolute -top-30 left-1/2 -translate-x-1/2 w-180 h-180 rounded-full bg-zinc-200/30 dark:bg-white/4 blur-3xl" />
        <div className="absolute inset-0 bg-[linear-gradient(to_right,#80808010_1px,transparent_1px),linear-gradient(to_bottom,#80808010_1px,transparent_1px)] bg-size-[26px_26px] mask-[radial-gradient(ellipse_at_center,black,transparent_78%)]" />
      </div>

      <div className="relative mx-auto max-w-6xl px-6 lg:px-8 space-y-14">
        <div className="mx-auto max-w-3xl text-center space-y-4">
          <div className="inline-flex items-center gap-2 rounded-full border border-zinc-200 dark:border-zinc-800 bg-white/70 dark:bg-zinc-900/70 backdrop-blur px-4 py-2 shadow-sm">
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
          <p className="text-sm sm:text-base text-zinc-500 dark:text-zinc-400 max-w-2xl mx-auto">
            Select your platform role and choose a billing cadence that fits
            your organization.
          </p>
        </div>

        <PricingCards />
      </div>
    </section>
  );
}
