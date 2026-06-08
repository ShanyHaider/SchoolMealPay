// app/(dashboard)/school-admin/ai-nutrition/page.tsx
//
// requireSchoolFeature runs before any data fetching.
// Non-premium schools are redirected to billing before this page renders.

import { requireSchoolFeature } from "@/lib/guards/pageGuards";

export default async function AiNutritionPage() {
    // ── Premium gate ──────────────────────────────────────────────────────────
    await requireSchoolFeature("hasAiNutrition");

    // Only reached by premium_school with status active | trialing
    return (
        <div className="max-w-6xl mx-auto space-y-6">
            <div>
                <h1
                    className="text-2xl font-bold tracking-tight"
                    style={{ color: "var(--text-primary)" }}
                >
                    AI Nutrition
                </h1>
                <p className="text-sm mt-1" style={{ color: "var(--text-secondary)" }}>
                    Nutrition trends and AI meal suggestions across your student population.
                </p>
            </div>

            {/* Build AiNutritionClient here when ready */}
            <div
                className="rounded-xl border p-8 text-center"
                style={{ background: "var(--bg-card)", borderColor: "var(--border-card)" }}
            >
                <p className="text-sm" style={{ color: "var(--text-muted)" }}>
                    AI Nutrition dashboard coming soon.
                </p>
            </div>
        </div>
    );
}