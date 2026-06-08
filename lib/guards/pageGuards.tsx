// lib/guards/pageGuards.ts
//
// Server-only guards for page.tsx files.
// Call at the very top of any page that requires a subscription feature —
// before any data fetching, so no DB queries run for unauthorized requests.
//
// Usage:
//   import { requireSchoolFeature } from "@/lib/guards/pageGuards";
//
//   export default async function ReportsPage() {
//     await requireSchoolFeature("hasAdvancedAnalytics");
//     // only reached if premium + active
//   }

import { redirect } from "next/navigation";
import { auth } from "@clerk/nextjs/server";
import { getSchoolSubscription, getParentProSubscription } from "@/db/queries/Subscription";
import { getUserFromDb } from "@/features/users/queries";

// ─── School premium feature guard ─────────────────────────────────────────────
//
// Redirects to /school-admin/billing with a reason param so the billing page
// can show a contextual message ("Upgrade to access Advanced Reports").
// Accepts "trialing" as active — trial users get full premium access.

export async function requireSchoolFeature(
    feature: "hasAdvancedAnalytics" | "hasAiNutrition" | "hasPrioritySupport",
) {
    const sub = await getSchoolSubscription();

    const isPremiumActive =
        sub?.tier === "premium_school" &&
        (sub.status === "active" || sub.status === "trialing");

    if (!isPremiumActive) {
        redirect(`/school-admin/billing?reason=${feature}`);
    }
}

// ─── Parent Pro feature guard ──────────────────────────────────────────────────
//
// Redirects to /parent/settings?tab=billing with a reason param.
// Resolves the parent's DB id from the Clerk session automatically —
// no need to pass it in from the page.

export async function requireParentProFeature(
    feature:
        | "hasNutritionDashboard"
        | "hasAiMealPlanning"
        | "hasHealthTrends"
        | "hasPrioritySupport",
) {
    const { userId: clerkId } = await auth();
    if (!clerkId) redirect("/sign-in");

    const dbUser = await getUserFromDb(clerkId);
    if (!dbUser) redirect("/sign-in");

    const sub = await getParentProSubscription(dbUser.id);

    const isProActive =
        sub?.status === "active" || sub?.status === "trialing";

    if (!isProActive) {
        redirect(`/parent/settings?tab=billing&reason=${feature}`);
    }
}