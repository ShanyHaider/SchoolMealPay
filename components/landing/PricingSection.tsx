"use client";

import React from "react";
import Link from "next/link";

import { Check, X } from "lucide-react";

const PLANS = [
  {
    name: "Free",
    price: "$0",
    desc: "For small schools",
    features: [
      { text: "Up to 50 students", included: true },
      { text: "Menu management", included: true },
      { text: "QR code pickup", included: true },
      { text: "AI nutrition tracking", included: false },
    ],
    cta: "Get started",
    href: "/sign-up",
    popular: false,
  },
  {
    name: "Premium",
    price: "$49",
    desc: "For growing schools",
    features: [
      { text: "Unlimited students", included: true },
      { text: "All Free features", included: true },
      { text: "AI nutrition tracking", included: true },
      { text: "Advanced analytics", included: true },
    ],
    cta: "Start free trial",
    href: "/sign-up",
    popular: true,
  },
  {
    name: "Parent Pro",
    price: "$4.99",
    desc: "For health-conscious parents",
    features: [
      { text: "Nutrition dashboard", included: true },
      { text: "AI meal planning", included: true },
      { text: "Health trends", included: true },
      { text: "7-day free trial", included: true },
    ],
    cta: "Start trial",
    href: "/sign-up",
    popular: false,
  },
];

export function PricingSection() {
  return (
    <div className="grid grid-cols-1 gap-6 md:grid-cols-3">
      {PLANS.map((plan) => (
        <div
          key={plan.name}
          className={`relative flex flex-col rounded-3xl border p-8 shadow-sm ${
            plan.popular ?
              "border-blue-500/40 bg-(--bg-secondary)"
            : "border-(--border-primary) bg-(--bg-secondary)"
          }`}
        >
          {plan.popular && (
            <div className="absolute -top-3 left-6 rounded-full bg-blue-500 px-3 py-1 text-[10px] font-bold uppercase tracking-wide text-white">
              Most Popular
            </div>
          )}

          <div>
            <h3 className="text-xl font-bold">{plan.name}</h3>

            <p className="mt-2 text-sm text-(--text-secondary)">{plan.desc}</p>

            <div className="mt-8 flex items-end gap-1">
              <span className="text-5xl font-black tracking-tight">
                {plan.price}
              </span>

              <span className="pb-1 text-sm text-(--text-secondary)">
                /month
              </span>
            </div>

            <div className="mt-8 space-y-4">
              {plan.features.map((feature) => (
                <div key={feature.text} className="flex items-center gap-3">
                  {feature.included ?
                    <Check size={16} className="text-emerald-500" />
                  : <X size={16} className="text-(--text-secondary)" />}

                  <span
                    className={`text-sm ${
                      feature.included ?
                        "text-(--text-primary)"
                      : "text-(--text-secondary) line-through"
                    }`}
                  >
                    {feature.text}
                  </span>
                </div>
              ))}
            </div>
          </div>

          <Link
            href={plan.href}
            className={`mt-10 inline-flex items-center justify-center rounded-xl px-5 py-3 text-sm font-semibold transition-all ${
              plan.popular ?
                "bg-(--text-primary) text-(--bg-primary)"
              : "border border-(--border-primary) bg-(--bg-tertiary)"
            }`}
          >
            {plan.cta}
          </Link>
        </div>
      ))}
    </div>
  );
}
