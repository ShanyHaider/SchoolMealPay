import { db } from "@/drizzle/db";
import {
  usersTable,
  auditLogsTable,
  schoolSubscriptionTable,
  schoolProfileTable,
  ordersTable,
  transactionsTable,
} from "@/drizzle/schema";
import { eq, desc, sum, count } from "drizzle-orm";
import { cacheLife, cacheTag } from "next/cache";
import { getGlobalTag } from "@/lib/cache";
import { assertRole } from "@/lib/guards/serverGuards";

export async function getSuperAdminStats(userId: string) {
  "use cache";
  cacheLife("seconds");
  cacheTag(
    getGlobalTag("users"),
    getGlobalTag("orders"),
    getGlobalTag("transactions"),
    getGlobalTag("school-profile"),
  );

  await assertRole(["system_admin"], userId);

  const todayStr = new Date().toISOString().split("T")[0];
  const startTime = performance.now();

  const [revResult, ordersResult, schoolsResult] = await Promise.all([
    db
      .select({ total: sum(transactionsTable.amount) })
      .from(transactionsTable)
      .where(eq(transactionsTable.status, "success")),
    db
      .select({ count: count() })
      .from(ordersTable)
      .where(eq(ordersTable.orderDate, todayStr)),
    db
      .select({ count: count() })
      .from(schoolProfileTable),
  ]);

  const endTime = performance.now();
  const actualLatencyMs = Math.round(endTime - startTime);

  return {
    revenue: parseFloat(revResult[0]?.total ?? "0"),
    activeOrdersCount: ordersResult[0]?.count ?? 0,
    schoolsCount: schoolsResult[0]?.count ?? 0,
    latencyMs: actualLatencyMs,
  };
}

export async function getSystemAuditLogs(userId: string) {
  "use cache";
  cacheLife("minutes");
  cacheTag(getGlobalTag("audit-logs"));

  await assertRole(["system_admin"], userId);

  return db.query.auditLogsTable.findMany({
    orderBy: [desc(auditLogsTable.createdAt)],
    limit: 50,
    with: {
      user: {
        columns: { name: true, email: true },
      },
    },
  });
}

export async function getSchoolSubscriptionData(userId: string) {
  "use cache";
  cacheLife("minutes");
  cacheTag(getGlobalTag("school-subscription"), getGlobalTag("school-profile"));

  await assertRole(["system_admin"], userId);

  const [sub, profile] = await Promise.all([
    db.query.schoolSubscriptionTable.findFirst(),
    db.query.schoolProfileTable.findFirst(),
  ]);

  return {
    subscription: sub ?? null,
    profile: profile ?? null,
  };
}

export async function getGlobalUsers(userId: string) {
  "use cache";
  cacheLife("minutes");
  cacheTag(getGlobalTag("users"));

  await assertRole(["system_admin"], userId);

  return db.query.usersTable.findMany({
    orderBy: [desc(usersTable.createdAt)],
  });
}