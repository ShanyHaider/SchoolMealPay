import { unstable_cache } from "next/cache";
import { db } from "@/drizzle/db";
import { eq } from "drizzle-orm";
import {
  parentProSubscriptionsTable,
  schoolSubscriptionTable,
  subscriptionInvoicesTable,
} from "@/drizzle/schema";
import { getGlobalTag, getIdTag, getUserTag } from "@/lib/cache";

// ─── Parent Pro subscription status ──────────────────────────────────────
export const getParentProSubscription = unstable_cache(
  async (parentId: string) => {
    return db.query.parentProSubscriptionsTable.findFirst({
      where: eq(parentProSubscriptionsTable.parentId, parentId),
    });
  },
  ["parent-pro-subscription"],
  {
    tags: [
      getGlobalTag("parent-pro-subscriptions"),
      // tag is revalidated by webhook action after status change
    ],
  },
);

// ─── School subscription ──────────────────────────────────────────────────
export const getSchoolSubscription = unstable_cache(
  async () => {
    return db.query.schoolSubscriptionTable.findFirst();
  },
  ["school-subscription"],
  {
    tags: [getGlobalTag("school-subscription")],
  },
);

// ─── Invoice history for billing page ────────────────────────────────────
export const getSubscriptionInvoices = unstable_cache(
  async (subscriptionId: string) => {
    return db.query.subscriptionInvoicesTable.findMany({
      where: eq(subscriptionInvoicesTable.subscriptionId, subscriptionId),
      orderBy: (t, { desc }) => [desc(t.paidAt)],
    });
  },
  ["subscription-invoices"],
  {
    tags: [getGlobalTag("subscription-invoices")],
  },
);

// ─── Wallet balance ───────────────────────────────────────────────────────
export const getParentWallet = unstable_cache(
  async (parentId: string) => {
    const { parentWalletsTable } = await import("@/drizzle/schema");
    return db.query.parentWalletsTable.findFirst({
      where: eq(parentWalletsTable.parentId, parentId),
    });
  },
  ["parent-wallet"],
  {
    tags: [getGlobalTag("transactions")], // wallet updates when transactions do
  },
);

// ─── Helper: is parent currently subscribed? ─────────────────────────────
export function isParentProActive(
  sub: Awaited<ReturnType<typeof getParentProSubscription>>,
): boolean {
  if (!sub) return false;
  return sub.status === "active" || sub.status === "trialing";
}
