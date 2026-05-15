"use client";

import { useUser } from "@clerk/nextjs";
import { AccountRow } from "../AccountRow";

// Swap these with your actual plan data / billing provider (Stripe, etc.)
const PLANS = [
  {
    id: "free",
    name: "Free",
    price: "$0 / month",
    features: ["5 projects", "1 GB storage", "Community support"],
  },
  {
    id: "pro",
    name: "Pro",
    price: "$12 / month",
    features: [
      "Unlimited projects",
      "50 GB storage",
      "Priority support",
      "Custom domains",
    ],
  },
  {
    id: "team",
    name: "Team",
    price: "$49 / month",
    features: [
      "Everything in Pro",
      "10 team members",
      "SSO",
      "Admin dashboard",
    ],
  },
];

// Replace with real subscription lookup (e.g. from your DB / Stripe webhook)
const CURRENT_PLAN_ID = "free";

export function BillingTab() {
  const { user } = useUser();
  const currentPlan = PLANS.find((p) => p.id === CURRENT_PLAN_ID) ?? PLANS[0];

  return (
    <section className="account-tab">
      <h2 className="account-tab__title">Subscription & billing</h2>

      <AccountRow label="Current plan">
        <div className="account-values">
          <div className="plan-badge">
            <span className="plan-badge__name">{currentPlan.name}</span>
            <span className="plan-badge__price">{currentPlan.price}</span>
          </div>
          <ul className="plan-features">
            {currentPlan.features.map((f) => (
              <li key={f} className="plan-features__item">
                <span className="plan-features__check" aria-hidden="true">
                  ✓
                </span>
                {f}
              </li>
            ))}
          </ul>
        </div>
      </AccountRow>

      <AccountRow label="Upgrade">
        <div className="plan-cards">
          {PLANS.filter((p) => p.id !== CURRENT_PLAN_ID).map((plan) => (
            <div key={plan.id} className="plan-card">
              <div className="plan-card__header">
                <span className="plan-card__name">{plan.name}</span>
                <span className="plan-card__price">{plan.price}</span>
              </div>
              <ul className="plan-features plan-features--card">
                {plan.features.map((f) => (
                  <li key={f} className="plan-features__item">
                    <span className="plan-features__check" aria-hidden="true">
                      ✓
                    </span>
                    {f}
                  </li>
                ))}
              </ul>
              <button className="plan-card__cta">Upgrade to {plan.name}</button>
            </div>
          ))}
        </div>
      </AccountRow>

      <AccountRow label="Billing history">
        <div className="account-values">
          <span className="account-value account-value--muted">
            No invoices yet.
          </span>
          <button className="account-action">Manage billing →</button>
        </div>
      </AccountRow>
    </section>
  );
}
