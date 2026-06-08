"use server";

import { db } from "@/drizzle/db";
import {
  schoolSubscriptionTable,
  usersTable,
  auditLogsTable,
} from "@/drizzle/schema";
import { eq } from "drizzle-orm";
import { revalidatePath } from "next/cache";
import { clerkClient } from "@clerk/nextjs/server";
import { assertRole } from "@/lib/guards/serverGuards";
import {
  revalidateSuperAdminSubscriptionCache,
  revalidateSuperAdminUserCache,
  revalidateSuperAdminAuditCache,
} from "@/lib/cacheRevalidation";

/**
 * Update the school's total active student capacity limit.
 */
export async function updateSchoolSubscriptionLimit(studentLimit: number, adminUserId: string) {
  // CRITICAL SECURITY GUARD
  await assertRole(["system_admin"]);

  if (studentLimit < 1 || studentLimit > 50000) {
    throw new Error("Invalid student configuration footprint requested.");
  }

  const sub = await db.query.schoolSubscriptionTable.findFirst();
  if (!sub) throw new Error("School subscription record not found.");

  const oldLimit = sub.studentLimit;

  await db
    .update(schoolSubscriptionTable)
    .set({ studentLimit, updatedAt: new Date() })
    .where(eq(schoolSubscriptionTable.id, sub.id));

  // Log in system compliance audit logs
  await db.insert(auditLogsTable).values({
    userId: adminUserId,
    action: "student_limit_adjusted",
    entityType: "school_subscription",
    entityId: sub.id,
    oldValues: { studentLimit: oldLimit },
    newValues: { studentLimit },
  });

  // Purge data caches cleanly
  revalidateSuperAdminSubscriptionCache();
  revalidateSuperAdminAuditCache();

  revalidatePath("/system-admin");
  return { success: true };
}

/**
 * Override/Toggle the school's active feature plan tier.
 */
export async function toggleSchoolSubscriptionTier(tier: "free" | "premium_school", adminUserId: string) {
  // CRITICAL SECURITY GUARD
  await assertRole(["system_admin"]);

  const sub = await db.query.schoolSubscriptionTable.findFirst();
  if (!sub) throw new Error("School subscription record not found.");

  const oldTier = sub.tier;

  await db
    .update(schoolSubscriptionTable)
    .set({ tier, updatedAt: new Date() })
    .where(eq(schoolSubscriptionTable.id, sub.id));

  // Log in audit logs
  await db.insert(auditLogsTable).values({
    userId: adminUserId,
    action: "subscription_tier_overridden",
    entityType: "school_subscription",
    entityId: sub.id,
    oldValues: { tier: oldTier },
    newValues: { tier },
  });

  // Purge data caches cleanly
  revalidateSuperAdminSubscriptionCache();
  revalidateSuperAdminAuditCache();

  revalidatePath("/system-admin");
  return { success: true };
}

/**
 * Block/Deactivate or Reactivate a system user in both DB and Clerk.
 */
export async function toggleUserStatus(userId: string, targetActive: boolean, adminUserId: string) {
  // CRITICAL SECURITY GUARD
  await assertRole(["system_admin"]);

  const user = await db.query.usersTable.findFirst({
    where: eq(usersTable.id, userId),
  });
  if (!user) throw new Error("User account not found.");

  if (user.id === adminUserId) {
    throw new Error("Self-deactivation restriction constraint triggered.");
  }

  // Update local DB status
  await db
    .update(usersTable)
    .set({ isActive: targetActive, updatedAt: new Date() })
    .where(eq(usersTable.id, userId));

  // Perform corresponding Clerk operation
  try {
    const clerk = await clerkClient();
    if (!targetActive) {
      await clerk.users.banUser(user.clerkId);
    } else {
      await clerk.users.unbanUser(user.clerkId);
    }
  } catch (err: any) {
    console.error("Clerk user ban/unban failed:", err.message);
  }

  // Record audit log
  await db.insert(auditLogsTable).values({
    userId: adminUserId,
    action: targetActive ? "user_reactivated" : "user_blocked",
    entityType: "user",
    entityId: userId,
    oldValues: { isActive: !targetActive },
    newValues: { isActive: targetActive },
  });

  // Purge data caches cleanly
  revalidateSuperAdminUserCache();
  revalidateSuperAdminAuditCache();

  revalidatePath("/system-admin");
  return { success: true };
}

/**
 * Trigger global password/session reverification flags via Clerk.
 */
export async function triggerClerkReverification(userId: string, adminUserId: string) {
  // CRITICAL SECURITY GUARD
  await assertRole(["system_admin"]);

  const user = await db.query.usersTable.findFirst({
    where: eq(usersTable.id, userId),
  });
  if (!user) throw new Error("User account not found.");

  try {
    const clerk = await clerkClient();
    await clerk.users.updateUser(user.clerkId, {
      publicMetadata: { forceReverification: true },
    });
  } catch (err: any) {
    console.error("Clerk session revocation failed:", err.message);
  }

  // Record in audit logs
  await db.insert(auditLogsTable).values({
    userId: adminUserId,
    action: "session_reverification_triggered",
    entityType: "user",
    entityId: userId,
    oldValues: {},
    newValues: { reverifiedAt: new Date().toISOString() },
  });

  // Purge data caches cleanly
  revalidateSuperAdminUserCache();
  revalidateSuperAdminAuditCache();

  revalidatePath("/system-admin");
  return { success: true };
}