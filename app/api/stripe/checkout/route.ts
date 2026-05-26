import { NextRequest, NextResponse } from "next/server";
import { auth } from "@clerk/nextjs/server";
import { stripe } from "@/lib/stripe";
import { db } from "@/drizzle/db";
import { eq } from "drizzle-orm";
import { usersTable, parentProSubscriptionsTable } from "@/drizzle/schema";

export async function POST(request: NextRequest) {
  try {
    const { userId: clerkId } = await auth();
    if (!clerkId) {
      return NextResponse.json({ error: "Not authenticated" }, { status: 401 });
    }

    const body = await request.json();
    const { tier, cycle } = body as {
      tier: "SchoolFree" | "SchoolPremium" | "ParentFree" | "ParentPro";
      cycle: "monthly" | "annual";
    };

    if (tier === "SchoolFree" || tier === "ParentFree") {
      return NextResponse.json({ url: "/dashboard" });
    }

    const dbUser = await db.query.usersTable.findFirst({
      where: eq(usersTable.clerkId, clerkId),
    });
    if (!dbUser) {
      return NextResponse.json({ error: "User not found" }, { status: 404 });
    }

    const origin =
      request.headers.get("origin") ??
      process.env.NEXT_PUBLIC_APP_URL ??
      "http://localhost:3000";

    // ── success/cancel URLs based on actual DB role, not the tier clicked ──
    // This prevents the mismatch when a parent clicks School Premium by mistake
    // or when roles change between sessions.
    const dashboardBase =
      dbUser.role === "school_admin" ? "school-admin"
      : dbUser.role === "canteen_staff" ? "canteen-staff"
      : "parent";

    const successUrl = `${origin}/${dashboardBase}/settings?tab=billing&status=success`;
    const cancelUrl = `${origin}/#pricing`;

    // ── Parent Pro ──────────────────────────────────────────────────────────
    if (tier === "ParentPro") {
      const priceId =
        cycle === "monthly" ?
          process.env.STRIPE_PARENT_PRO_MONTHLY_PRICE_ID
        : process.env.STRIPE_PARENT_PRO_ANNUAL_PRICE_ID;

      if (!priceId) {
        return NextResponse.json(
          {
            error: `Missing STRIPE_PARENT_PRO_${cycle.toUpperCase()}_PRICE_ID`,
          },
          { status: 500 },
        );
      }

      const existing = await db.query.parentProSubscriptionsTable.findFirst({
        where: eq(parentProSubscriptionsTable.parentId, dbUser.id),
      });

      const alreadyActive =
        existing?.status === "active" || existing?.status === "trialing";

      if (alreadyActive) {
        const portal = await stripe.billingPortal.sessions.create({
          customer: existing!.stripeCustomerId!,
          return_url: `${origin}/${dashboardBase}/settings?tab=billing`,
        });
        return NextResponse.json({ url: portal.url });
      }

      const hasUsedTrial = existing?.trialUsed ?? false;

      const session = await stripe.checkout.sessions.create({
        payment_method_types: ["card"],
        line_items: [{ price: priceId, quantity: 1 }],
        mode: "subscription",
        subscription_data: {
          ...(hasUsedTrial ? {} : { trial_period_days: 7 }),
          metadata: { parentId: dbUser.id },
        },
        success_url: successUrl,
        cancel_url: cancelUrl,
        metadata: {
          transactionType: "subscription",
          parentId: dbUser.id,
        },
      });

      return NextResponse.json({ url: session.url });
    }

    // ── School Premium ──────────────────────────────────────────────────────
    if (tier === "SchoolPremium") {
      const priceId =
        cycle === "monthly" ?
          process.env.STRIPE_SCHOOL_PREMIUM_MONTHLY_PRICE_ID
        : process.env.STRIPE_SCHOOL_PREMIUM_ANNUAL_PRICE_ID;

      if (!priceId) {
        return NextResponse.json(
          {
            error: `Missing STRIPE_SCHOOL_PREMIUM_${cycle.toUpperCase()}_PRICE_ID`,
          },
          { status: 500 },
        );
      }

      const session = await stripe.checkout.sessions.create({
        payment_method_types: ["card"],
        line_items: [{ price: priceId, quantity: 1 }],
        mode: "subscription",
        subscription_data: {
          metadata: { schoolAdminId: dbUser.id },
        },
        success_url: successUrl,
        cancel_url: cancelUrl,
        metadata: {
          transactionType: "school_subscription",
          schoolAdminId: dbUser.id,
        },
      });

      return NextResponse.json({ url: session.url });
    }

    return NextResponse.json({ error: "Unknown tier" }, { status: 400 });
  } catch (err: any) {
    console.error("[Stripe Checkout Route]", err);
    return NextResponse.json(
      { error: err.message ?? "Internal error" },
      { status: 500 },
    );
  }
}
