// Safe to import anywhere — no server env vars.
// Stripe Price IDs live in server actions only (db/actions/stripe.ts).

export const subscriptionTiers = {
  SchoolFree: {
    name: "Free" as const,
    monthlyPriceInCents: 0,
    annualPriceInCents: 0,
    maxStudents: 50,
    hasAiNutrition: false as boolean,
    hasAdvancedAnalytics: false as boolean,
    hasPrioritySupport: false as boolean,
    desc: "For local, single-campus school setups testing out digital administration.",
    features: [
      { text: "Up to 50 active students", included: true },
      { text: "Core menu management", included: true },
      { text: "QR code standard meal pickup", included: true },
      { text: "AI nutrition forecasting", included: false },
      { text: "Advanced multi-campus analytics", included: false },
      { text: "Priority support line", included: false },
    ],
  },
  SchoolPremium: {
    name: "Premium" as const,
    monthlyPriceInCents: 4900,
    annualPriceInCents: 49000,
    maxStudents: Number.MAX_SAFE_INTEGER,
    hasAiNutrition: true as boolean,
    hasAdvancedAnalytics: true as boolean,
    hasPrioritySupport: true as boolean,
    desc: "For growing campuses needing unlimited student scaling and heavy data tracking.",
    features: [
      { text: "Unlimited active student records", included: true },
      { text: "Core menu management", included: true },
      { text: "QR code standard meal pickup", included: true },
      { text: "AI nutrition forecasting", included: true },
      { text: "Advanced multi-campus analytics", included: true },
      { text: "Priority support line", included: true },
    ],
  },
  ParentFree: {
    name: "Free" as const,
    monthlyPriceInCents: 0,
    annualPriceInCents: 0,
    hasNutritionDashboard: false as boolean,
    hasAiMealPlanning: false as boolean,
    hasHealthTrends: false as boolean,
    hasPrioritySupport: false as boolean,
    desc: "Standard meal pre-ordering and distribution tracking for parents.",
    features: [
      { text: "Order dynamic student meals", included: true },
      { text: "Basic daily spending limits", included: true },
      { text: "Order checkout history", included: true },
      { text: "AI micro-nutrition dashboard", included: false },
      { text: "AI automated meal planning suggestions", included: false },
      { text: "Health trend report logs", included: false },
    ],
  },
  ParentPro: {
    name: "Parent Pro" as const,
    monthlyPriceInCents: 499,
    annualPriceInCents: 4990,
    hasNutritionDashboard: true as boolean,
    hasAiMealPlanning: true as boolean,
    hasHealthTrends: true as boolean,
    hasPrioritySupport: true as boolean,
    trialDays: 7,
    desc: "Deep health analytics, AI suggestions, and complete automated dietary tracking.",
    features: [
      { text: "Order dynamic student meals", included: true },
      { text: "Basic daily spending limits", included: true },
      { text: "Order checkout history", included: true },
      { text: "AI micro-nutrition dashboard", included: true },
      { text: "AI automated meal planning suggestions", included: true },
      { text: "Health trend report logs", included: true },
    ],
  },
};

export type SchoolTier = "SchoolFree" | "SchoolPremium";
export type ParentTier = "ParentFree" | "ParentPro";
export type BillingCycle = "monthly" | "annual";

type ParentBooleanFeature =
  | "hasNutritionDashboard"
  | "hasAiMealPlanning"
  | "hasHealthTrends"
  | "hasPrioritySupport";

type SchoolBooleanFeature =
  | "hasAiNutrition"
  | "hasAdvancedAnalytics"
  | "hasPrioritySupport";

export function canParentAccess(
  feature: ParentBooleanFeature,
  subscriptionStatus: string | null | undefined,
): boolean {
  if (subscriptionStatus === "active" || subscriptionStatus === "trialing") {
    return subscriptionTiers.ParentPro[feature];
  }
  return subscriptionTiers.ParentFree[feature];
}

export function canSchoolAccess(
  feature: SchoolBooleanFeature,
  tier: string | null | undefined,
): boolean {
  if (tier === "premium_school") {
    return subscriptionTiers.SchoolPremium[feature];
  }
  return subscriptionTiers.SchoolFree[feature];
}

export function formatPrice(cents: number, currency = "PKR"): string {
  if (cents === 0) return "Free";
  return `${currency} ${(cents / 100).toLocaleString()}`;
}

export function annualSavings(monthly: number, annual: number): number {
  return monthly * 12 - annual;
}
