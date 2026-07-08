import { auth } from "@clerk/nextjs/server";
import { redirect } from "next/navigation";
import { requireSchoolFeature } from "@/lib/guards/pageGuards";
import { getUserFromDb } from "@/features/users/queries";
import { getAllCanteens } from "@/db/queries/Admin";
import { AiInsightsClient } from "./_components/AiInsightsClient";

export default async function AiInsightsPage() {
  await requireSchoolFeature("hasAiNutrition"); // reuse existing premium gate, or swap for a dedicated flag

  const { userId } = await auth();
  if (!userId) redirect("/sign-in");

  const dbUser = await getUserFromDb(userId);
  if (!dbUser) redirect("/");

  const canteens = await getAllCanteens();

  if (canteens.length === 0) {
    return (
      <div className="max-w-6xl mx-auto space-y-6">
        <div>
          <h1
            className="text-2xl font-bold tracking-tight"
            style={{ color: "var(--text-primary)" }}
          >
            Feedback & Demand
          </h1>
        </div>
        <div
          className="rounded-2xl border p-10 text-center"
          style={{
            background: "var(--bg-card)",
            borderColor: "var(--border-card)",
          }}
        >
          <p className="text-sm" style={{ color: "var(--text-primary)" }}>
            No canteens registered yet.
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-6xl mx-auto space-y-6">
      <div>
        <h1
          className="text-2xl font-bold tracking-tight"
          style={{ color: "var(--text-primary)" }}
        >
          Feedback & Demand
        </h1>
        <p className="text-sm mt-1" style={{ color: "var(--text-secondary)" }}>
          Demand forecasting and meal feedback sentiment, powered by your order
          and review history.
        </p>
      </div>

      <AiInsightsClient
        canteens={canteens.map((c) => ({ id: c.id, name: c.name }))}
      />
    </div>
  );
}
