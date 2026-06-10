// app/(dashboard)/system-admin/audit/page.tsx

import { auth } from "@clerk/nextjs/server";
import { redirect } from "next/navigation";
import { getUserFromDb } from "@/features/users/queries";
import { getAuditLogs } from "@/db/queries/SystemAdminAudit";
import { AuditTrailClient } from "./_components/AuditTrailClient";

interface AuditPageProps {
    searchParams: Promise<{
        page?: string;
        action?: string;
        entityType?: string;
    }>;
}

export default async function AuditTrailPage({ searchParams }: AuditPageProps) {
    const { userId } = await auth();
    if (!userId) redirect("/sign-in");

    const dbUser = await getUserFromDb(userId);
    if (!dbUser || dbUser.role !== "system_admin") redirect("/");

    const params = await searchParams;
    const page = Math.max(1, parseInt(params.page ?? "1", 10));
    const action = params.action ?? undefined;
    const entityType = params.entityType ?? undefined;

    const data = await getAuditLogs(userId, { action, entityType }, page, 50);

    return (
        <div className="space-y-6">
            <div>
                <h1
                    className="text-2xl font-bold tracking-tight"
                    style={{ color: "var(--text-primary)" }}
                >
                    Audit Trail
                </h1>
                <p className="text-sm mt-1" style={{ color: "var(--text-secondary)" }}>
                    Immutable log of all administrative and system-level changes.
                </p>
            </div>

            <AuditTrailClient
                initialData={data}
                currentAdminUserId={dbUser.id}
                initialAction={action}
                initialEntityType={entityType}
            />
        </div>
    );
}