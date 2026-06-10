// db/queries/SuperAdmin.auditLogs.ts

import { db } from "@/drizzle/db";
import { auditLogsTable } from "@/drizzle/schema";
import { and, desc, eq, gte, lte } from "drizzle-orm";
import { cacheLife, cacheTag } from "next/cache";
import { getGlobalTag } from "@/lib/cache";
import { assertRole } from "@/lib/guards/serverGuards";

export type AuditLogEntry = {
    id: string;
    action: string;
    entityType: string;
    entityId: string | null;
    oldValues: unknown;
    newValues: unknown;
    ipAddress: string | null;
    createdAt: Date;
    user: { name: string; email: string } | null;
};

export type AuditLogFilters = {
    action?: string;
    entityType?: string;
    userId?: string;
    from?: Date;
    to?: Date;
    search?: string;
};

export type PaginatedAuditLogs = {
    logs: AuditLogEntry[];
    total: number;
    page: number;
    pageSize: number;
    totalPages: number;
};



export async function getAuditLogs(
    adminUserId: string,
    filters: AuditLogFilters = {},
    page = 1,
    pageSize = 50,
): Promise<PaginatedAuditLogs> {
    "use cache";
    cacheLife("seconds");
    cacheTag(getGlobalTag("audit-logs"));

    await assertRole(["system_admin"], adminUserId);

    const conditions = [];

    if (filters.action) {
        conditions.push(eq(auditLogsTable.action, filters.action));
    }
    if (filters.entityType) {
        conditions.push(eq(auditLogsTable.entityType, filters.entityType));
    }
    if (filters.from) {
        conditions.push(gte(auditLogsTable.createdAt, filters.from));
    }
    if (filters.to) {
        conditions.push(lte(auditLogsTable.createdAt, filters.to));
    }

    const where = conditions.length > 0 ? and(...conditions) : undefined;

    const [logs, countResult] = await Promise.all([
        db.query.auditLogsTable.findMany({
            where,
            orderBy: [desc(auditLogsTable.createdAt)],
            limit: pageSize,
            offset: (page - 1) * pageSize,
            with: {
                user: {
                    columns: { name: true, email: true },
                },
            },
        }),
        db
            .select({ count: auditLogsTable.id })
            .from(auditLogsTable)
            .where(where),
    ]);

    const total = countResult.length;

    return {
        logs: logs.map((l) => ({
            id: l.id,
            action: l.action,
            entityType: l.entityType,
            entityId: l.entityId ?? null,
            oldValues: l.oldValues,
            newValues: l.newValues,
            ipAddress: l.ipAddress ?? null,
            createdAt: l.createdAt,
            user: l.user ? { name: l.user.name, email: l.user.email } : null,
        })),
        total,
        page,
        pageSize,
        totalPages: Math.ceil(total / pageSize),
    };
}