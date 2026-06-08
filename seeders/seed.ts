// drizzle/seed.ts
// Run with: npx tsx drizzle/seed.ts
//
// Safe to run multiple times — uses onConflictDoNothing() throughout.
// On first deploy this creates the school_subscription row that the
// entire admin sidebar depends on. Without it, getSchoolSubscription()
// returns undefined and tier-gating silently breaks.

import "dotenv/config"; // loads .env.local so DATABASE_URL is available
import { drizzle } from "drizzle-orm/node-postgres";
import * as schema from "@/drizzle/schema";

const db = drizzle(process.env.DATABASE_URL!, { schema });

async function seed() {
    console.log("🌱 Seeding database...");

    // ── 1. School subscription ───────────────────────────────────────────────
    // Single row — the entire app reads this with findFirst().
    // Start on "free" / "trialing" so the upgrade flow is exercised in dev.
    // In production you can change this to "premium_school" / "active" after
    // the school completes checkout, or run:
    //   UPDATE school_subscription SET tier = 'premium_school', status = 'active';
    const [sub] = await db
        .insert(schema.schoolSubscriptionTable)
        .values({
            tier: "free",
            status: "trialing",
            studentLimit: 50,
            trialStartedAt: new Date(),
            // 14-day trial window — adjust to match your sales agreement
            trialEndsAt: new Date(Date.now() + 14 * 24 * 60 * 60 * 1000),
            trialUsed: false,
        })
        .onConflictDoNothing()
        .returning();

    if (sub) {
        console.log("  ✓ school_subscription row created:", sub.id);
    } else {
        console.log("  · school_subscription row already exists — skipped");
    }

    // ── 2. School profile ────────────────────────────────────────────────────
    // Single row — edit name/timezone to match the school before deploying.
    const [profile] = await db
        .insert(schema.schoolProfileTable)
        .values({
            name: "My School",
            timezone: "Asia/Karachi",
            primaryColor: "#000000",
        })
        .onConflictDoNothing()
        .returning();

    if (profile) {
        console.log("  ✓ school_profile row created:", profile.id);
    } else {
        console.log("  · school_profile row already exists — skipped");
    }

    // ── 3. Nutrition targets ─────────────────────────────────────────────────
    // WHO reference values for Pakistani school age groups.
    // AI engine compares actual intake against these rows.
    const targets = [
        {
            label: "WHO Primary (5–10 yrs)",
            ageGroupMin: 5,
            ageGroupMax: 10,
            dailyCalories: 1600,
            dailyProteinG: "40.00",
            dailyFiberG: "20.00",
            dailyCarbsG: "220.00",
            dailyFatG: "50.00",
            source: "WHO 2023",
            isDefault: true,
        },
        {
            label: "WHO Middle School (11–14 yrs)",
            ageGroupMin: 11,
            ageGroupMax: 14,
            dailyCalories: 2000,
            dailyProteinG: "52.00",
            dailyFiberG: "25.00",
            dailyCarbsG: "260.00",
            dailyFatG: "65.00",
            source: "WHO 2023",
            isDefault: false,
        },
        {
            label: "WHO Secondary (15–18 yrs)",
            ageGroupMin: 15,
            ageGroupMax: 18,
            dailyCalories: 2200,
            dailyProteinG: "59.00",
            dailyFiberG: "28.00",
            dailyCarbsG: "300.00",
            dailyFatG: "70.00",
            source: "WHO 2023",
            isDefault: false,
        },
    ];

    for (const target of targets) {
        const [row] = await db
            .insert(schema.nutritionTargetsTable)
            .values(target)
            .onConflictDoNothing()
            .returning();

        if (row) {
            console.log(`  ✓ nutrition_target created: ${row.label}`);
        } else {
            console.log(`  · nutrition_target already exists: ${target.label}`);
        }
    }

    console.log("\n✅ Seed complete.");
    process.exit(0);
}

seed().catch((err) => {
    console.error("❌ Seed failed:", err);
    process.exit(1);
});