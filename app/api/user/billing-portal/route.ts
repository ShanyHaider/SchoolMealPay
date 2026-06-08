import { auth } from "@clerk/nextjs/server";
import { NextRequest, NextResponse } from "next/server";
import { stripe } from "@/lib/stripe";
import { db } from "@/drizzle/db";
import { eq } from "drizzle-orm";
import {
  usersTable,
  parentProSubscriptionsTable,
  schoolSubscriptionTable,
} from "@/drizzle/schema";

export async function POST(request: NextRequest) {
  const { userId: clerkId } = await auth();
  if (!clerkId)
    return NextResponse.json({ error: "Not authenticated" }, { status: 401 });

  const dbUser = await db.query.usersTable.findFirst({
    where: eq(usersTable.clerkId, clerkId),
  });
  if (!dbUser)
    return NextResponse.json({ error: "User not found" }, { status: 404 });

  const origin =
    request.headers.get("origin") ??
    process.env.NEXT_PUBLIC_APP_URL ??
    "http://localhost:3000";

  let stripeCustomerId: string | null = null;
  let returnPath: string;

  if (dbUser.role === "school_admin") {
    const sub = await db.query.schoolSubscriptionTable.findFirst();
    stripeCustomerId = sub?.stripeCustomerId ?? null;
    returnPath = "/school-admin/billing";
  } else {
    const sub = await db.query.parentProSubscriptionsTable.findFirst({
      where: eq(parentProSubscriptionsTable.parentId, dbUser.id),
    });
    stripeCustomerId = sub?.stripeCustomerId ?? null;
    returnPath = "/parent/settings?tab=billing";
  }

  if (!stripeCustomerId)
    return NextResponse.json(
      { error: "No active subscription found" },
      { status: 400 },
    );

  const portal = await stripe.billingPortal.sessions.create({
    customer: stripeCustomerId,
    return_url: `${origin}${returnPath}`,
  });

  return NextResponse.json({ url: portal.url });
}