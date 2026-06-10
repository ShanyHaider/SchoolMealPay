// app/(dashboard)/system-admin/health/page.tsx

import { auth } from "@clerk/nextjs/server";
import { redirect } from "next/navigation";
import { getUserFromDb } from "@/features/users/queries";
import { getSystemHealth } from "@/db/queries/SuperAdminSystemHealth";
import { SystemHealthClient } from "./_components/SystemHealthClient";

export default async function SystemHealthPage() {
    const { userId } = await auth();
    if (!userId) redirect("/sign-in");

    const dbUser = await getUserFromDb(userId);
    if (!dbUser || dbUser.role !== "system_admin") redirect("/");

    const health = await getSystemHealth(userId);

    return (
        <div className="space-y-6">
            <div>
                <h1
                    className="text-2xl font-bold tracking-tight"
                    style={{ color: "var(--text-primary)" }}
                >
                    System Health
                </h1>
                <p className="text-sm mt-1" style={{ color: "var(--text-secondary)" }}>
                    Real-time platform diagnostics, entity counts, and 7-day activity.
                </p>
            </div>

            <SystemHealthClient health={health} />
        </div>
    );
}