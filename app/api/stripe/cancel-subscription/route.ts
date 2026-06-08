import { auth } from "@clerk/nextjs/server";
import { NextResponse } from "next/server";
import { stripe } from "@/lib/stripe";
import { db } from "@/drizzle/db";
import { eq } from "drizzle-orm";
import { usersTable, schoolSubscriptionTable } from "@/drizzle/schema";
import { revalidateSchoolSubscriptionCache } from "@/lib/cacheRevalidation";

export async function POST() {
    const { userId: clerkId } = await auth();
    if (!clerkId)
        return NextResponse.json({ error: "Not authenticated" }, { status: 401 });

    const dbUser = await db.query.usersTable.findFirst({
        where: eq(usersTable.clerkId, clerkId),
    });
    if (!dbUser || dbUser.role !== "school_admin")
        return NextResponse.json({ error: "Forbidden" }, { status: 403 });

    const sub = await db.query.schoolSubscriptionTable.findFirst();
    if (!sub?.stripeSubscriptionId)
        return NextResponse.json({ error: "No active subscription" }, { status: 400 });

    // cancel_at_period_end = true keeps access until billing period ends
    await stripe.subscriptions.update(sub.stripeSubscriptionId, {
        cancel_at_period_end: true,
    });

    await db
        .update(schoolSubscriptionTable)
        .set({ status: "cancelled", cancelledAt: new Date(), updatedAt: new Date() })
        .where(eq(schoolSubscriptionTable.id, sub.id));

    revalidateSchoolSubscriptionCache();

    return NextResponse.json({ ok: true });
}