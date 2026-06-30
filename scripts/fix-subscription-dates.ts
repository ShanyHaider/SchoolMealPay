// scripts/fix-subscription-dates.ts
// scripts/fix-subscription-dates.ts
import { config } from "dotenv";
config({ path: ".env" });

import { stripe } from "@/lib/stripe";
import { db } from "@/drizzle/db";
import { eq, isNotNull } from "drizzle-orm";
import { parentProSubscriptionsTable, schoolSubscriptionTable } from "@/drizzle/schema";

async function main() {
    // Fix parent pro
    const parentSubs = await db.query.parentProSubscriptionsTable.findMany({
        where: isNotNull(parentProSubscriptionsTable.stripeSubscriptionId),
    });
    for (const row of parentSubs) {
        const sub = await stripe.subscriptions.retrieve(row.stripeSubscriptionId!);
        const item = sub.items?.data?.[0];
        if (!item) continue;
        await db.update(parentProSubscriptionsTable).set({
            currentPeriodStart: new Date(item.current_period_start * 1000),
            currentPeriodEnd: new Date(item.current_period_end * 1000),
            status: sub.status as any,
        }).where(eq(parentProSubscriptionsTable.id, row.id));
        console.log("Fixed parent:", row.parentId, "→", new Date(item.current_period_end * 1000));
    }

    // Fix school
    const schoolSub = await db.query.schoolSubscriptionTable.findFirst({
        where: isNotNull(schoolSubscriptionTable.stripeSubscriptionId),
    });
    if (schoolSub?.stripeSubscriptionId) {
        const sub = await stripe.subscriptions.retrieve(schoolSub.stripeSubscriptionId);
        const item = sub.items?.data?.[0];
        if (item) {
            await db.update(schoolSubscriptionTable).set({
                currentPeriodStart: new Date(item.current_period_start * 1000),
                currentPeriodEnd: new Date(item.current_period_end * 1000),
                status: sub.status as any,
            }).where(eq(schoolSubscriptionTable.id, schoolSub.id));
            console.log("Fixed school →", new Date(item.current_period_end * 1000));
        }
    }

    console.log("Done.");
    process.exit(0);
}

main().catch((err) => {
    console.error(err);
    process.exit(1);
});