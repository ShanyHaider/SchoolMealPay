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

export async function getSuperAdminStats() {
  "use cache";
  cacheLife("seconds");
  // Anchored cleanly to all core telemetry models
  cacheTag(
    getGlobalTag("users"),
    getGlobalTag("orders"),
    getGlobalTag("transactions"),
    getGlobalTag("school-profile")
  );

  // DATA CHECKPOINT SECURITY GUARD
  await assertRole(["system_admin"]);

  const todayStr = new Date().toISOString().split("T")[0];

  // Benchmark starting marker to track real physical performance
  const startTime = performance.now();

  // Execute database calls concurrently to bypass structural execution bottlenecks
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

  const revenue = parseFloat(revResult[0]?.total ?? "0");
  const activeOrdersCount = ordersResult[0]?.count ?? 0;
  const schoolsCount = schoolsResult[0]?.count ?? 0;

  return {
    revenue,
    activeOrdersCount,
    schoolsCount,
    latencyMs: actualLatencyMs, // No longer a hardcoded lie
  };
}

export async function getSystemAuditLogs() {
  "use cache";
  cacheLife("minutes");
  cacheTag(getGlobalTag("audit-logs"));

  // DATA CHECKPOINT SECURITY GUARD
  await assertRole(["system_admin"]);

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

export async function getSchoolSubscriptionData() {
  "use cache";
  cacheLife("minutes");
  cacheTag(getGlobalTag("school-subscription"), getGlobalTag("school-profile"));

  // DATA CHECKPOINT SECURITY GUARD
  await assertRole(["system_admin"]);

  const [sub, profile] = await Promise.all([
    db.query.schoolSubscriptionTable.findFirst(),
    db.query.schoolProfileTable.findFirst(),
  ]);

  return {
    subscription: sub ?? null,
    profile: profile ?? null,
  };
}

export async function getGlobalUsers() {
  "use cache";
  cacheLife("minutes");
  cacheTag(getGlobalTag("users"));

  // DATA CHECKPOINT SECURITY GUARD
  await assertRole(["system_admin"]);

  return db.query.usersTable.findMany({
    orderBy: [desc(usersTable.createdAt)],
  });
}