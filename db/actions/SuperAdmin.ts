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
import { notify, notifyMany } from "@/lib/notification/notify";
import { PushEvents } from "@/lib/notification/webpush";

// ── Helpers ────────────────────────────────────────────────────────────────────

async function getSchoolAdminIds(): Promise<string[]> {
  const admins = await db.query.usersTable.findMany({
    where: eq(usersTable.role, "school_admin"),
    columns: { id: true },
  });
  return admins.map((a) => a.id);
}

// ── updateSchoolSubscriptionLimit ──────────────────────────────────────────────

export async function updateSchoolSubscriptionLimit(
  studentLimit: number,
  adminUserId: string,
) {
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

  await db.insert(auditLogsTable).values({
    userId: adminUserId,
    action: "student_limit_adjusted",
    entityType: "school_subscription",
    entityId: sub.id,
    oldValues: { studentLimit: oldLimit },
    newValues: { studentLimit },
  });

  revalidateSuperAdminSubscriptionCache();
  revalidateSuperAdminAuditCache();
  revalidatePath("/system-admin");

  // Self-notification for system admin (in-app audit trail)
  notify({
    userId: adminUserId,
    type: "limit_adjusted",
    event: PushEvents.systemAdmin.limitAdjusted(studentLimit),
    channels: ["in_app"],
  }).catch(console.error);

  // Notify school admins their capacity changed
  const schoolAdminIds = await getSchoolAdminIds();
  notifyMany(schoolAdminIds, {
    type: "student_limit_changed",
    event: PushEvents.admin.studentLimitChanged(studentLimit),
  }).catch(console.error);

  return { success: true };
}

// ── toggleSchoolSubscriptionTier ───────────────────────────────────────────────

export async function toggleSchoolSubscriptionTier(
  tier: "free" | "premium_school",
  adminUserId: string,
) {
  await assertRole(["system_admin"]);

  const sub = await db.query.schoolSubscriptionTable.findFirst();
  if (!sub) throw new Error("School subscription record not found.");

  const oldTier = sub.tier;

  await db
    .update(schoolSubscriptionTable)
    .set({ tier, updatedAt: new Date() })
    .where(eq(schoolSubscriptionTable.id, sub.id));

  await db.insert(auditLogsTable).values({
    userId: adminUserId,
    action: "subscription_tier_overridden",
    entityType: "school_subscription",
    entityId: sub.id,
    oldValues: { tier: oldTier },
    newValues: { tier },
  });

  revalidateSuperAdminSubscriptionCache();
  revalidateSuperAdminAuditCache();
  revalidatePath("/system-admin");

  // Self-notification for system admin
  notify({
    userId: adminUserId,
    type: "tier_overridden",
    event: PushEvents.systemAdmin.tierOverridden(tier),
    channels: ["in_app"],
  }).catch(console.error);

  // Notify school admins their tier changed
  const schoolAdminIds = await getSchoolAdminIds();
  notifyMany(schoolAdminIds, {
    type: "subscription_tier_changed",
    event: PushEvents.admin.tierChanged(tier),
  }).catch(console.error);

  return { success: true };
}

// ── toggleUserStatus ───────────────────────────────────────────────────────────

export async function toggleUserStatus(
  userId: string,
  targetActive: boolean,
  adminUserId: string,
) {
  await assertRole(["system_admin"]);

  const user = await db.query.usersTable.findFirst({
    where: eq(usersTable.id, userId),
  });
  if (!user) throw new Error("User account not found.");

  if (user.id === adminUserId) {
    throw new Error("Self-deactivation restriction constraint triggered.");
  }

  await db
    .update(usersTable)
    .set({ isActive: targetActive, updatedAt: new Date() })
    .where(eq(usersTable.id, userId));

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

  await db.insert(auditLogsTable).values({
    userId: adminUserId,
    action: targetActive ? "user_reactivated" : "user_blocked",
    entityType: "user",
    entityId: userId,
    oldValues: { isActive: !targetActive },
    newValues: { isActive: targetActive },
  });

  revalidateSuperAdminUserCache();
  revalidateSuperAdminAuditCache();
  revalidatePath("/system-admin");

  // Notify the affected user — in_app only if suspending (no active session),
  // both channels if reactivating
  notify({
    userId,
    type: targetActive ? "account_reactivated" : "account_suspended",
    event: targetActive
      ? PushEvents.accountReactivated()
      : PushEvents.accountSuspended(),
    channels: targetActive ? ["in_app", "push"] : ["in_app"],
  }).catch(console.error);

  // Self-notification for system admin
  notify({
    userId: adminUserId,
    type: targetActive ? "user_unblocked" : "user_blocked",
    event: targetActive
      ? PushEvents.systemAdmin.userUnblocked(user.name ?? user.email)
      : PushEvents.systemAdmin.userBlocked(user.name ?? user.email),
    channels: ["in_app"],
  }).catch(console.error);

  return { success: true };
}

// ── triggerClerkReverification ─────────────────────────────────────────────────

export async function triggerClerkReverification(
  userId: string,
  adminUserId: string,
) {
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

  await db.insert(auditLogsTable).values({
    userId: adminUserId,
    action: "session_reverification_triggered",
    entityType: "user",
    entityId: userId,
    oldValues: {},
    newValues: { reverifiedAt: new Date().toISOString() },
  });

  revalidateSuperAdminUserCache();
  revalidateSuperAdminAuditCache();
  revalidatePath("/system-admin");

  return { success: true };
}