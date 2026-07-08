import "server-only";

import { auth } from "@clerk/nextjs/server";
import { getUserFromDb } from "@/features/users/queries";
import { getParentProSubscription, getSchoolSubscription } from "@/db/queries/Subscription";
import { db } from "@/drizzle/db";
import { count } from "drizzle-orm";
import { studentsTable } from "@/drizzle/schema";
import { canParentAccess, canSchoolAccess } from "@/data/subscriptionTiers";
import { isParentProActive } from "../subscriptionHelpers";

// Custom typed guards errors
export class GuardError extends Error {
  code: "UNAUTHORIZED" | "FORBIDDEN" | "LIMIT_EXCEEDED" | "FEATURE_GATED";
  constructor(
    code: "UNAUTHORIZED" | "FORBIDDEN" | "LIMIT_EXCEEDED" | "FEATURE_GATED",
    message: string,
  ) {
    super(message);
    this.code = code;
    this.name = "GuardError";
  }
}

/**
 * Asserts that the current user is authenticated and matches one of the required roles.
 * Returns the validated database user record.
 *
 * @param allowedRoles - Roles that are permitted to proceed.
 * @param preResolvedUserId - Optional: pass the userId from auth() called *outside*
 *   a "use cache" boundary. Required when calling from inside cached query functions,
 *   since auth() cannot be called inside "use cache" contexts.
 */
export async function assertRole(
  allowedRoles: ("system_admin" | "school_admin" | "canteen_staff" | "parent")[],
  preResolvedUserId?: string,
) {
  // Use the pre-resolved userId if provided (required inside "use cache" functions),
  // otherwise call auth() directly (fine in non-cached server contexts).
  const userId = preResolvedUserId ?? (await auth()).userId;

  if (!userId) {
    throw new GuardError("UNAUTHORIZED", "Authentication required. Please sign in.");
  }

  const dbUser = await getUserFromDb(userId);
  if (!dbUser) {
    throw new GuardError("UNAUTHORIZED", "Account registration required.");
  }

  if (!dbUser.isActive) {
    throw new GuardError("FORBIDDEN", "This user account has been deactivated.");
  }

  const userRole = dbUser.role as "system_admin" | "school_admin" | "canteen_staff" | "parent";
  if (!allowedRoles.includes(userRole)) {
    throw new GuardError(
      "FORBIDDEN",
      `Access denied. Required: [${allowedRoles.join(", ")}], Found: ${userRole}`,
    );
  }

  return dbUser;
}

/**
 * Asserts school tier limit checks.
 * Compares current active student count against the school subscription's cap limit.
 */
export async function assertSchoolStudentLimit() {
  const schoolSub = await getSchoolSubscription();
  const tierName = schoolSub?.tier ?? "free";
  const status = schoolSub?.status ?? "active";

  const [studentQueryResult] = await db
    .select({ studentCount: count() })
    .from(studentsTable);
  const currentCount = studentQueryResult?.studentCount ?? 0;

  const maxStudents =
    tierName === "premium_school" && status === "active"
      ? Number.MAX_SAFE_INTEGER
      : (schoolSub?.studentLimit ?? 50);

  if (currentCount >= maxStudents) {
    throw new GuardError(
      "LIMIT_EXCEEDED",
      `School registration cap reached (${currentCount}/${maxStudents}). Please upgrade to Premium School to register more students.`,
    );
  }

  return { currentCount, maxStudents };
}

/**
 * Asserts parent pro subscription capability features.
 */
export async function assertParentFeature(
  parentId: string,
  feature: "hasNutritionDashboard" | "hasAiMealPlanning" | "hasHealthTrends" | "hasPrioritySupport",
) {
  const parentSub = await getParentProSubscription(parentId);
  const isActive = isParentProActive(parentSub);

  const hasAccess = canParentAccess(feature, parentSub?.status);
  if (!hasAccess) {
    throw new GuardError(
      "FEATURE_GATED",
      `The feature "${feature}" is only available to Parent Pro subscribers. Please subscribe to access.`,
    );
  }

  return true;
}

/**
 * Asserts school subscription premium feature flags.
 */
export async function assertSchoolFeature(
  feature: "hasAiNutrition" | "hasAdvancedAnalytics" | "hasPrioritySupport",
) {
  const schoolSub = await getSchoolSubscription();
  const tierName = schoolSub?.tier ?? "free";

  const hasAccess = canSchoolAccess(feature, tierName);
  if (!hasAccess) {
    throw new GuardError(
      "FEATURE_GATED",
      `The feature "${feature}" is restricted on your current plan. Please upgrade the campus subscription tier.`,
    );
  }

  return true;
}