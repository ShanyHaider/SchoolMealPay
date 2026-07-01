// lib/guards/pageGuards.ts
//
// Server-only guards for page.tsx files.

import { redirect } from "next/navigation";
import { auth } from "@clerk/nextjs/server";
import {
  getSchoolSubscription,
  getParentProSubscription,
} from "@/db/queries/Subscription";
import { getUserFromDb } from "@/features/users/queries";

// Thrown when a guard can't even determine subscription state (e.g. DB
// timeout) — distinct from a normal "not entitled" redirect so callers
// and error.tsx can tell the difference between "no access" and
// "we don't know, something's wrong."
export class GuardInfraError extends Error {
  constructor(
    message: string,
    public cause?: unknown,
  ) {
    super(message);
    this.name = "GuardInfraError";
  }
}

export async function requireSchoolFeature(
  feature: "hasAdvancedAnalytics" | "hasAiNutrition" | "hasPrioritySupport",
) {
  let sub;
  try {
    sub = await getSchoolSubscription();
  } catch (err) {
    console.error(
      `[requireSchoolFeature] subscription lookup failed for feature=${feature}`,
      err,
    );
    throw new GuardInfraError(
      "Couldn't verify your subscription status. Please try again.",
      err,
    );
  }

  const isPremiumActive =
    sub?.tier === "premium_school" &&
    (sub.status === "active" || sub.status === "trialing");

  if (!isPremiumActive) {
    redirect(`/school-admin/billing?reason=${feature}`);
  }
}

export async function requireParentProFeature(
  feature:
    | "hasNutritionDashboard"
    | "hasAiMealPlanning"
    | "hasHealthTrends"
    | "hasPrioritySupport",
) {
  const { userId: clerkId } = await auth();
  if (!clerkId) redirect("/sign-in");

  let dbUser;
  try {
    dbUser = await getUserFromDb(clerkId);
  } catch (err) {
    console.error(`[requireParentProFeature] user lookup failed`, err);
    throw new GuardInfraError(
      "Couldn't load your account. Please try again.",
      err,
    );
  }
  if (!dbUser) redirect("/sign-in");

  // Surface deactivation distinctly rather than silently bouncing to billing —
  // a deactivated account being routed to "upgrade your plan" is confusing
  // and was exactly the kind of symptom that masked the real bug earlier.
  if (!dbUser.isActive) {
    redirect("/account-error?reason=deactivated");
  }

  let sub;
  try {
    sub = await getParentProSubscription(dbUser.id);
  } catch (err) {
    console.error(
      `[requireParentProFeature] subscription lookup failed for feature=${feature}`,
      err,
    );
    throw new GuardInfraError(
      "Couldn't verify your subscription status. Please try again.",
      err,
    );
  }

  const isProActive = sub?.status === "active" || sub?.status === "trialing";

  if (!isProActive) {
    redirect(`/parent/settings?tab=billing&reason=${feature}`);
  }
}
