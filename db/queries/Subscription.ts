// db/queries/Subscription.ts
// Full replacement for the existing file.

"use server"

import { db } from "@/drizzle/db";
import { eq } from "drizzle-orm";
import {
  parentProSubscriptionsTable,
  subscriptionInvoicesTable,
} from "@/drizzle/schema";
import { cacheLife, cacheTag } from "next/cache";
import { getGlobalTag, getUserTag } from "@/lib/cache";

// ─── School subscription ──────────────────────────────────────────────────
// Returns the single school_subscription row, or null if the seed hasn't
// been run yet. Callers must handle null — never assume a row exists.
export async function getSchoolSubscription() {
  "use cache";
  cacheLife("hours");
  cacheTag(getGlobalTag("school-subscription"));

  return (await db.query.schoolSubscriptionTable.findFirst()) ?? null;
}

// Convenience: just the tier string, falls back to "free".
// Use this everywhere you only need to gate features, not the full row.
export async function getSchoolTier(): Promise<string> {
  "use cache";
  cacheLife("hours");
  cacheTag(getGlobalTag("school-subscription"));

  const sub = await db.query.schoolSubscriptionTable.findFirst({
    columns: { tier: true },
  });
  return sub?.tier ?? "free";
}

// ─── Parent Pro subscription status ──────────────────────────────────────
export async function getParentProSubscription(parentId: string) {
  "use cache";
  cacheLife("minutes");
  cacheTag(
    getGlobalTag("parent-pro-subscriptions"),
    getUserTag("parent-pro-subscriptions", parentId),
  );
  return db.query.parentProSubscriptionsTable.findFirst({
    where: eq(parentProSubscriptionsTable.parentId, parentId),
  });
}

// ─── Invoice history for billing page ────────────────────────────────────
export async function getSubscriptionInvoices() {
  "use cache";
  cacheLife("minutes");
  cacheTag(getGlobalTag("subscription-invoices"));

  const sub = await db.query.schoolSubscriptionTable.findFirst({
    columns: { id: true },
  });
  if (!sub) return [];

  return db.query.subscriptionInvoicesTable.findMany({
    where: eq(subscriptionInvoicesTable.subscriptionId, sub.id),
    orderBy: (t, { desc }) => [desc(t.createdAt)],
  });
}

// ─── Wallet balance ───────────────────────────────────────────────────────
export async function getParentWallet(parentId: string) {
  "use cache";
  cacheLife("seconds");
  cacheTag(
    getGlobalTag("transactions"),
    getUserTag("transactions", parentId),
  );
  const { parentWalletsTable } = await import("@/drizzle/schema");
  return db.query.parentWalletsTable.findFirst({
    where: eq(parentWalletsTable.parentId, parentId),
  });
}

