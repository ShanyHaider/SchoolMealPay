// app/api/user/billing-portal/route.ts
// Creates a Stripe billing portal session so users can manage their subscription.

import { auth } from "@clerk/nextjs/server";
import { NextRequest, NextResponse } from "next/server";
import { stripe } from "@/lib/stripe";
import { db } from "@/drizzle/db";
import { eq } from "drizzle-orm";
import { usersTable, parentProSubscriptionsTable } from "@/drizzle/schema";

export async function POST(request: NextRequest) {
  const { userId: clerkId } = await auth();
  if (!clerkId) {
    return NextResponse.json({ error: "Not authenticated" }, { status: 401 });
  }

  const dbUser = await db.query.usersTable.findFirst({
    where: eq(usersTable.clerkId, clerkId),
  });
  if (!dbUser) {
    return NextResponse.json({ error: "User not found" }, { status: 404 });
  }

  const subscription = await db.query.parentProSubscriptionsTable.findFirst({
    where: eq(parentProSubscriptionsTable.parentId, dbUser.id),
  });

  if (!subscription?.stripeCustomerId) {
    return NextResponse.json(
      { error: "No active subscription found" },
      { status: 400 },
    );
  }

  const origin =
    request.headers.get("origin") ??
    process.env.NEXT_PUBLIC_APP_URL ??
    "http://localhost:3000";

  const portal = await stripe.billingPortal.sessions.create({
    customer: subscription.stripeCustomerId,
    return_url: `${origin}/parent/settings?tab=billing`,
  });

  return NextResponse.json({ url: portal.url });
}
