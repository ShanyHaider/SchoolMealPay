// app/api/user/billing/route.ts
// Returns current subscription + invoice history for the BillingTab.

import { auth } from "@clerk/nextjs/server";
import { NextResponse } from "next/server";
import { db } from "@/drizzle/db";
import { eq } from "drizzle-orm";
import {
  usersTable,
  parentProSubscriptionsTable,
  subscriptionInvoicesTable,
} from "@/drizzle/schema";

export async function GET() {
  const { userId: clerkId } = await auth();
  if (!clerkId) {
    return NextResponse.json({ error: "Not authenticated" }, { status: 401 });
  }

  const dbUser = await db.query.usersTable.findFirst({
    where: eq(usersTable.clerkId, clerkId),
  });
  if (!dbUser) {
    return NextResponse.json({ subscription: null, invoices: [] });
  }

  const subscription = await db.query.parentProSubscriptionsTable.findFirst({
    where: eq(parentProSubscriptionsTable.parentId, dbUser.id),
  });

  // Invoices are linked to schoolSubscriptionTable — find the school sub
  const schoolSub = await db.query.schoolSubscriptionTable.findFirst();

  const invoices =
    schoolSub ?
      await db.query.subscriptionInvoicesTable.findMany({
        where: eq(subscriptionInvoicesTable.subscriptionId, schoolSub.id),
        orderBy: (t, { desc }) => [desc(t.createdAt)],
      })
    : [];

  return NextResponse.json({ subscription, invoices });
}
