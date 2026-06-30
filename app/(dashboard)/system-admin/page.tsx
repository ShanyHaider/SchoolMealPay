// app/(dashboard)/system-admin/page.tsx

import {
  getSuperAdminStats,
  getSchoolSubscriptionData,
  getGlobalUsers,
  getSystemAuditLogs,
} from "@/db/queries/SystemAdmin";
import { getUserFromDb } from "@/features/users/queries";
import { auth } from "@clerk/nextjs/server";
import { redirect } from "next/navigation";
import { SystemAdminClient } from "./_components/SystemAdminClient";
import type { UserRow } from "./_components/UserLedgerTable";
import type { AuditLogRow } from "./_components/AuditLogTable";

export default async function SuperAdminConsolePage() {
  // Layout already guards role — this just gives us dbUser.id for scoped queries.
  const { userId } = await auth();
  if (!userId) redirect("/sign-in");

  const dbUser = await getUserFromDb(userId);
  if (!dbUser || dbUser.role !== "system_admin") redirect("/");

  const [stats, subscriptionData, users, auditLogs] = await Promise.all([
    getSuperAdminStats(userId),
    getSchoolSubscriptionData(userId),
    getGlobalUsers(userId),
    getSystemAuditLogs(userId),
  ]);

  const mappedUsers: UserRow[] = users.map((u) => ({
    id: u.id,
    name: u.name,
    email: u.email,
    role: u.role,
    isActive: u.isActive,
    createdAt: u.createdAt,
  }));

  const mappedAuditLogs: AuditLogRow[] = auditLogs.map((l) => ({
    id: l.id,
    action: l.action,
    entityType: l.entityType,
    entityId: l.entityId ?? null,
    oldValues: l.oldValues,
    newValues: l.newValues,
    ipAddress: l.ipAddress ?? null,
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
          System health, user management, school settings, and audit trail.
        </p>
      </div>

      <SystemAdminClient
        stats={stats}
        subscriptionData={subscriptionData}
        users={mappedUsers}
        auditLogs={mappedAuditLogs}
        currentAdminUserId={dbUser.id}
      />
    </div>
  );
}
