"use server";

import { auth } from "@clerk/nextjs/server";
import { stripe } from "@/lib/stripe";
import { db } from "@/drizzle/db";
import { eq } from "drizzle-orm";
import { usersTable, parentProSubscriptionsTable } from "@/drizzle/schema";

// Price IDs are read here — server only, never imported by client components.
function getParentProPriceId(cycle: "monthly" | "annual"): string {
  const id =
    cycle === "monthly" ?
      process.env.STRIPE_PARENT_PRO_MONTHLY_PRICE_ID
    : process.env.STRIPE_PARENT_PRO_ANNUAL_PRICE_ID;
  if (!id)
    throw new Error(
      `Missing STRIPE_PARENT_PRO_${cycle.toUpperCase()}_PRICE_ID`,
    );
  return id;
}

function getSchoolPremiumPriceId(cycle: "monthly" | "annual"): string {
  const id =
    cycle === "monthly" ?
      process.env.STRIPE_SCHOOL_PREMIUM_MONTHLY_PRICE_ID
    : process.env.STRIPE_SCHOOL_PREMIUM_ANNUAL_PRICE_ID;
  if (!id)
    throw new Error(
      `Missing STRIPE_SCHOOL_PREMIUM_${cycle.toUpperCase()}_PRICE_ID`,
    );
  return id;
}

async function getDbUser() {
  const { userId: clerkId } = await auth();
  if (!clerkId) throw new Error("Not authenticated");
  const user = await db.query.usersTable.findFirst({
    where: eq(usersTable.clerkId, clerkId),
  });
  if (!user) throw new Error("User not found");
  return user;
}

// ─── Wallet top-up ────────────────────────────────────────────────────────
export async function createWalletTopupSession(amountInRupees: number) {
  if (amountInRupees <= 0) throw new Error("Amount must be greater than 0");

  const user = await getDbUser();
  const currency = process.env.STRIPE_CURRENCY ?? "pkr";

  const session = await stripe.checkout.sessions.create({
    payment_method_types: ["card"],
    line_items: [
      {
        price_data: {
          currency,
          product_data: {
            name: "School Meal Wallet Top-up",
            description: `Add Rs. ${amountInRupees.toLocaleString()} to your meal wallet`,
          },
          unit_amount: amountInRupees * 100,
        },
        quantity: 1,
      },
    ],
    mode: "payment",
    success_url: `${process.env.NEXT_PUBLIC_APP_URL}/parent/wallet?status=success`,
    cancel_url: `${process.env.NEXT_PUBLIC_APP_URL}/parent/wallet?status=cancelled`,
    metadata: {
      transactionType: "wallet_topup",
      parentId: user.id,
    },
  });

  if (!session.url) throw new Error("Stripe did not return a checkout URL");
  return session.url;
}

// ─── Parent Pro subscription ──────────────────────────────────────────────
export async function createParentProCheckoutSession(
  billingCycle: "monthly" | "annual",
) {
  const user = await getDbUser();

  const existing = await db.query.parentProSubscriptionsTable.findFirst({
    where: eq(parentProSubscriptionsTable.parentId, user.id),
  });

  if (existing?.status === "active" || existing?.status === "trialing") {
    throw new Error("Already subscribed to Parent Pro");
  }

  const hasUsedTrial = existing?.trialUsed ?? false;

  const session = await stripe.checkout.sessions.create({
    payment_method_types: ["card"],
    line_items: [{ price: getParentProPriceId(billingCycle), quantity: 1 }],
    mode: "subscription",
    subscription_data: {
      ...(hasUsedTrial ? {} : { trial_period_days: 7 }),
      metadata: { parentId: user.id },
    },
    success_url: `${process.env.NEXT_PUBLIC_APP_URL}/parent/settings?tab=billing&status=success`,
    cancel_url: `${process.env.NEXT_PUBLIC_APP_URL}/parent/settings?tab=billing&status=cancelled`,
    metadata: {
      transactionType: "subscription",
      parentId: user.id,
    },
  });

  if (!session.url) throw new Error("Stripe did not return a checkout URL");
  return session.url;
}

// ─── Billing portal (cancel, update card, view invoices) ─────────────────
export async function createBillingPortalSession() {
  const user = await getDbUser();

  const subscription = await db.query.parentProSubscriptionsTable.findFirst({
    where: eq(parentProSubscriptionsTable.parentId, user.id),
  });

  if (!subscription?.stripeCustomerId) {
    throw new Error("No Stripe customer found — subscribe first");
  }

  const portal = await stripe.billingPortal.sessions.create({
    customer: subscription.stripeCustomerId,
    return_url: `${process.env.NEXT_PUBLIC_APP_URL}/parent/settings?tab=billing`,
  });

  return portal.url;
}
