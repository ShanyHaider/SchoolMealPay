import { currentUser } from "@clerk/nextjs/server";
import { redirect } from "next/navigation";
import { getUserFromDb } from "@/features/users/queries";
import {
  getSuperAdminStats,
  getSchoolSubscriptionData,
  getGlobalUsers,
  getSystemAuditLogs,
} from "@/db/queries/SuperAdmin";
import { SuperAdminClient } from "./_components/SystemAdminClient";

export const dynamic = "force-dynamic";

export default async function SuperAdminConsolePage() {
  const clerkUser = await currentUser();
  if (!clerkUser) redirect("/sign-in");

  const dbUser = await getUserFromDb(clerkUser.id);
  if (!dbUser || dbUser.role !== "system_admin") {
    // Re-route if they bypass the layout guard somehow
    redirect("/");
  }

  // Fetch all compliance management records in parallel
  const [stats, subscriptionData, users, auditLogs] = await Promise.all([
    getSuperAdminStats(),
    getSchoolSubscriptionData(),
    getGlobalUsers(),
    getSystemAuditLogs(),
  ]);

  // Map dates and formats cleanly for Client component hydration
  const mappedUsers = users.map((u) => ({
    id: u.id,
    name: u.name,
    email: u.email,
    role: u.role,
    isActive: u.isActive,
    createdAt: u.createdAt,
  }));

  const mappedAuditLogs = auditLogs.map((l) => ({
    id: l.id,
    action: l.action,
    entityType: l.entityType,
    entityId: l.entityId,
    oldValues: l.oldValues,
    newValues: l.newValues,
    ipAddress: l.ipAddress,
    createdAt: l.createdAt,
    user: l.user ? { name: l.user.name, email: l.user.email } : null,
  }));

  return (
    <div className="space-y-6">
      <div>
        <h1
          className="text-2xl font-bold tracking-tight"
          style={{ color: "var(--text-primary)" }}
        >
          Super Admin Console
        </h1>
        <p className="text-sm mt-1" style={{ color: "var(--text-secondary)" }}>
          Overview system health, adjust student capacity, and review system changes.
        </p>
      </div>

      <SuperAdminClient
        stats={stats}
        subscriptionData={subscriptionData}
        users={mappedUsers}
        auditLogs={mappedAuditLogs}
        currentAdminUserId={dbUser.id}
      />
    </div>
  );
}
