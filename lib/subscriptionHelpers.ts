// ./lib/utils/subscriptionHelpers.ts
import { subscriptionTiers } from "@/data/subscriptionTiers";
import type { getParentProSubscription } from "@/db/queries/Subscription";

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


export function isParentProActive(
    sub: Awaited<ReturnType<typeof getParentProSubscription>>,
): boolean {
    if (!sub) return false;
    return sub.status === "active" || sub.status === "trialing";
}