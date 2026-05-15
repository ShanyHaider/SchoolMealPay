"use client";

import { useState } from "react";

type Pref = {
  key: string;
  label: string;
  description: string;
  defaultOn: boolean;
};

const PREFS: Pref[] = [
  {
    key: "order_confirmed",
    label: "Order confirmed",
    description: "When a meal order is placed",
    defaultOn: true,
  },
  {
    key: "meal_ready",
    label: "Meal ready",
    description: "When your child's meal is ready to pick up",
    defaultOn: true,
  },
  {
    key: "meal_collected",
    label: "Meal collected",
    description: "When your child collects their meal",
    defaultOn: true,
  },
  {
    key: "payment_success",
    label: "Payment confirmed",
    description: "When a payment is processed successfully",
    defaultOn: true,
  },
  {
    key: "payment_failed",
    label: "Payment failed",
    description: "When a payment fails",
    defaultOn: true,
  },
  {
    key: "spending_limit",
    label: "Spending limit alert",
    description: "When your child approaches their limit",
    defaultOn: true,
  },
  {
    key: "approval_required",
    label: "Approval required",
    description: "When an order needs your approval",
    defaultOn: true,
  },
  {
    key: "nutrition_alert",
    label: "Nutrition insights",
    description: "Weekly nutrition summary for your children",
    defaultOn: false,
  },
];

function Toggle({ on, onToggle }: { on: boolean; onToggle: () => void }) {
  return (
    <button
      type="button"
      onClick={onToggle}
      className={`relative w-11 h-6 rounded-full transition-colors flex-shrink-0 ${
        on ? "bg-black dark:bg-white" : "bg-gray-200 dark:bg-zinc-700"
      }`}
    >
      <span
        className={`absolute top-0.5 left-0.5 w-5 h-5 rounded-full bg-white dark:bg-zinc-900 shadow transition-transform ${
          on ? "translate-x-5" : "translate-x-0"
        }`}
      />
    </button>
  );
}

export function NotificationPrefs() {
  const [prefs, setPrefs] = useState<Record<string, boolean>>(
    Object.fromEntries(PREFS.map((p) => [p.key, p.defaultOn])),
  );

  function toggle(key: string) {
    setPrefs((prev) => ({ ...prev, [key]: !prev[key] }));
  }

  return (
    <div className="bg-white dark:bg-zinc-900 border border-gray-200 dark:border-zinc-800 rounded-2xl p-6">
      <h2 className="text-base font-bold text-black dark:text-white mb-1">
        Notifications
      </h2>
      <p className="text-sm text-gray-500 mb-5">
        Choose what you want to be notified about.
      </p>

      <div className="flex flex-col divide-y divide-gray-100 dark:divide-zinc-800">
        {PREFS.map((pref) => (
          <div
            key={pref.key}
            className="flex items-center justify-between py-3.5 gap-4"
          >
            <div className="min-w-0">
              <p className="text-sm font-bold text-black dark:text-white">
                {pref.label}
              </p>
              <p className="text-xs text-gray-500 mt-0.5">{pref.description}</p>
            </div>
            <Toggle on={prefs[pref.key]} onToggle={() => toggle(pref.key)} />
          </div>
        ))}
      </div>
    </div>
  );
}
