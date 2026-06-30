// db/queries/SuperAdmin.systemHealth.ts

import { db } from "@/drizzle/db";
import {
    auditLogsTable,
    ordersTable,
    transactionsTable,
    usersTable,
    studentsTable,
} from "@/drizzle/schema";
import { and, count, desc, eq, gte, sql, sum } from "drizzle-orm";
import { cacheLife, cacheTag } from "next/cache";
import { getGlobalTag } from "@/lib/cache";
import { assertRole } from "@/lib/guards/serverGuards";

export type SystemHealthData = {
    db: {
        latencyMs: number;
        status: "healthy" | "degraded" | "down";
    };
    counts: {
        totalUsers: number;
        totalStudents: number;
        totalOrders: number;
        pendingOrders: number;
        failedTransactions: number;
        successfulTransactions: number;
    };
    recentErrors: {
        id: string;
        action: string;
        entityType: string;
        createdAt: Date;
        user: { name: string; email: string } | null;
    }[];
    orderStatusBreakdown: {
        status: string;
        count: number;
    }[];
    recentActivity: {
        /** ISO date string YYYY-MM-DD */
        date: string;
        orders: number;
        transactions: number;
    }[];
    environment: {
        nodeEnv: string;
        nextVersion: string;
        timezone: string;
        checkedAt: Date;
    };
};

export async function getSystemHealth(adminUserId: string): Promise<SystemHealthData> {
    "use cache";
    cacheLife("seconds");
    cacheTag(
        getGlobalTag("users"),
        getGlobalTag("students"),
        getGlobalTag("orders"),
        getGlobalTag("transactions"),
        getGlobalTag("audit-logs"),
    );

    await assertRole(["system_admin"], adminUserId);

    const t0 = performance.now();

    const sevenDaysAgo = new Date();
    sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);

    const [
        userCountResult,
        studentCountResult,
        orderCountResult,
        pendingOrderResult,
        failedTxResult,
        successTxResult,
        orderStatusRows,
        recentAuditErrors,
        dailyOrderRows,
        dailyTxRows,
    ] = await Promise.all([
        db.select({ total: count() }).from(usersTable),

        db.select({ total: count() }).from(studentsTable),

        db.select({ total: count() }).from(ordersTable),

        db
            .select({ total: count() })
            .from(ordersTable)
            .where(eq(ordersTable.status, "pending")),

        db
            .select({ total: count() })
            .from(transactionsTable)
            .where(eq(transactionsTable.status, "failed")),

        db
            .select({ total: count() })
            .from(transactionsTable)
            .where(eq(transactionsTable.status, "success")),

        // Order counts grouped by status
        db
            .select({
                status: ordersTable.status,
                count: count(),
            })
            .from(ordersTable)
            .groupBy(ordersTable.status),

        // Last 10 audit log entries (used as "recent activity" proxy)
        db.query.auditLogsTable.findMany({
            orderBy: [desc(auditLogsTable.createdAt)],
            limit: 10,
            with: {
                user: { columns: { name: true, email: true } },
            },
        }),

        // Daily order counts for last 7 days
        db
            .select({
                date: sql<string>`DATE(${ordersTable.placedAt})`,
                count: count(),
            })
            .from(ordersTable)
            .where(gte(ordersTable.placedAt, sevenDaysAgo))
            .groupBy(sql`DATE(${ordersTable.placedAt})`),

        // Daily transaction counts for last 7 days
        db
            .select({
                date: sql<string>`DATE(${transactionsTable.createdAt})`,
                count: count(),
            })
            .from(transactionsTable)
            .where(gte(transactionsTable.createdAt, sevenDaysAgo))
            .groupBy(sql`DATE(${transactionsTable.createdAt})`),
    ]);

    const latencyMs = Math.round(performance.now() - t0);

    // Build a unified 7-day activity array
    const dateMap = new Map<string, { orders: number; transactions: number }>();
    for (let i = 6; i >= 0; i--) {
        const d = new Date();
        d.setDate(d.getDate() - i);
        const key = d.toISOString().split("T")[0];
        dateMap.set(key, { orders: 0, transactions: 0 });
    }
    for (const row of dailyOrderRows) {
        const entry = dateMap.get(row.date);
        if (entry) entry.orders = row.count;
    }
    for (const row of dailyTxRows) {
        const entry = dateMap.get(row.date);
        if (entry) entry.transactions = row.count;
    }
    const recentActivity = Array.from(dateMap.entries()).map(([date, v]) => ({
        date,
        ...v,
    }));

    return {
        db: {
            latencyMs,
            status: latencyMs < 200 ? "healthy" : latencyMs < 600 ? "degraded" : "down",
        },
        counts: {
            totalUsers: userCountResult[0]?.total ?? 0,
            totalStudents: studentCountResult[0]?.total ?? 0,
            totalOrders: orderCountResult[0]?.total ?? 0,
            pendingOrders: pendingOrderResult[0]?.total ?? 0,
            failedTransactions: failedTxResult[0]?.total ?? 0,
            successfulTransactions: successTxResult[0]?.total ?? 0,
        },
        recentErrors: recentAuditErrors.map((e) => ({
            id: e.id,
            action: e.action,
            entityType: e.entityType,
            createdAt: e.createdAt,
            user: e.user ? { name: e.user.name, email: e.user.email } : null,
        })),
        orderStatusBreakdown: orderStatusRows.map((r) => ({
            status: r.status,
            count: r.count,
        })),
        recentActivity,
        environment: {
            nodeEnv: process.env.NODE_ENV ?? "unknown",
            nextVersion: process.env.NEXT_PUBLIC_APP_VERSION ?? "unknown",
            timezone: Intl.DateTimeFormat().resolvedOptions().timeZone,
            checkedAt: new Date(),
        },
    };
}