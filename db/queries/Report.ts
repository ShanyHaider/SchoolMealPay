"use server";

/**
 * Report.ts — server-side access guards for subscription-gated features.
 *
 * USAGE (in a Server Component or server action):
 *
 *   import { assertParentFeature, assertSchoolFeature } from "@/db/actions/Report";
 *
 *   // Throws if the parent isn't on Pro:
 *   await assertParentFeature("hasAiMealPlanning", parentId);
 *
 *   // Returns a boolean for conditional rendering:
 *   const canView = await checkParentFeature("hasNutritionDashboard", parentId);
 *
 * These functions are the single source of truth for feature gating.
 * Never gate features by checking subscription status inline in components —
 * always go through here so the logic stays in one place.
 */

import { db } from "@/drizzle/db";
import { eq } from "drizzle-orm";
import {
  parentProSubscriptionsTable,
  schoolSubscriptionTable,
} from "@/drizzle/schema";
import { canParentAccess, canSchoolAccess } from "@/data/subscriptionTiers";

// ── Types re-exported for callers ───────────────────────────────

type ParentFeature =
  | "hasNutritionDashboard"
  | "hasAiMealPlanning"
  | "hasHealthTrends"
  | "hasPrioritySupport";

type SchoolFeature =
  | "hasAiNutrition"
  | "hasAdvancedAnalytics"
  | "hasPrioritySupport";

// ── Internal data fetchers ──────────────────────────────────────

async function getParentSubStatus(parentId: string): Promise<string | null> {
  const sub = await db.query.parentProSubscriptionsTable.findFirst({
    where: eq(parentProSubscriptionsTable.parentId, parentId),
  });
  return sub?.status ?? null;
}

async function getSchoolTier(): Promise<string | null> {
  const sub = await db.query.schoolSubscriptionTable.findFirst();
  return sub?.tier ?? null;
}

// ── Parent guards ───────────────────────────────────────────────

/**
 * Returns true if the parent's subscription grants access to the feature.
 * Never throws — safe to use for conditional rendering.
 */
export async function checkParentFeature(
  feature: ParentFeature,
  parentId: string,
): Promise<boolean> {
  const status = await getParentSubStatus(parentId);
  return canParentAccess(feature, status);
}

/**
 * Throws a descriptive error if the parent does not have access.
 * Use in server actions that must be hard-blocked (not just hidden).
 *
 * Example: calling the AI meal planning action directly via curl
 * without going through the UI should still be rejected here.
 */
export async function assertParentFeature(
  feature: ParentFeature,
  parentId: string,
): Promise<void> {
  const allowed = await checkParentFeature(feature, parentId);
  if (!allowed) {
    throw new Error(
      `Parent Pro subscription required for feature: ${feature}. ` +
        `Upgrade at /parent/settings?tab=billing`,
    );
  }
}

// ── School guards ───────────────────────────────────────────────

/**
 * Returns true if the school's subscription tier grants access.
 * Never throws — safe to use for conditional rendering.
 */
export async function checkSchoolFeature(
  feature: SchoolFeature,
): Promise<boolean> {
  const tier = await getSchoolTier();
  return canSchoolAccess(feature, tier);
}

/**
 * Throws a descriptive error if the school's tier does not grant access.
 * Use in server actions that should be hard-blocked at the server layer.
 */
export async function assertSchoolFeature(
  feature: SchoolFeature,
): Promise<void> {
  const allowed = await checkSchoolFeature(feature);
  if (!allowed) {
    throw new Error(
      `School Premium subscription required for feature: ${feature}. ` +
        `Upgrade at /admin/settings?tab=billing`,
    );
  }
}
