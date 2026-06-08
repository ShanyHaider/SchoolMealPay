import { db } from "@/drizzle/db";
import { eq, desc, and, gte, sql, inArray } from "drizzle-orm";
import {
    parentWalletsTable,
    transactionsTable,
    ordersTable,
    studentsTable,
    orderItemsTable,
    menuItemsTable,
} from "@/drizzle/schema";

// ─── Wallet balance ────────────────────────────────────────────────────────────

export async function getWalletBalance(parentId: string) {
    const wallet = await db.query.parentWalletsTable.findFirst({
        where: eq(parentWalletsTable.parentId, parentId),
    });
    return wallet ? parseFloat(wallet.balance) : 0;
}

// ─── Transaction history ───────────────────────────────────────────────────────

export type WalletTransaction = {
    id: string;
    amount: string;
    transactionType: "wallet_topup" | "purchase" | "refund";
    paymentMethod: "stripe" | "jazzcash" | "easypaisa" | "wallet";
    status: "pending" | "success" | "failed" | "refunded";
    transactionRef: string | null;
    failureReason: string | null;
    processedAt: Date | null;
    createdAt: Date;
    // Joined from order
    orderDate: string | null;
    studentName: string | null;
};

export async function getWalletTransactions(
    parentId: string,
    limit = 50,
): Promise<WalletTransaction[]> {
    const rows = await db
        .select({
            id: transactionsTable.id,
            amount: transactionsTable.amount,
            transactionType: transactionsTable.transactionType,
            paymentMethod: transactionsTable.paymentMethod,
            status: transactionsTable.status,
            transactionRef: transactionsTable.transactionRef,
            failureReason: transactionsTable.failureReason,
            processedAt: transactionsTable.processedAt,
            createdAt: transactionsTable.createdAt,
            orderDate: ordersTable.orderDate,
            studentName: studentsTable.name,
        })
        .from(transactionsTable)
        .leftJoin(ordersTable, eq(transactionsTable.orderId, ordersTable.id))
        .leftJoin(studentsTable, eq(ordersTable.studentId, studentsTable.id))
        .where(eq(transactionsTable.parentId, parentId))
        .orderBy(desc(transactionsTable.createdAt))
        .limit(limit);

    return rows as WalletTransaction[];
}

// ─── Per-student spending breakdown ────────────────────────────────────────────

export type StudentSpending = {
    studentId: string;
    studentName: string;
    totalSpent: number;
    orderCount: number;
    lastOrderDate: string | null;
};


export async function getPerStudentSpending(
    parentId: string,
    sinceDate?: Date,
): Promise<StudentSpending[]> {
    const since = sinceDate ?? new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);

    const rows = await db
        .select({
            studentId: studentsTable.id,
            studentName: studentsTable.name,
            totalSpent: sql<string>`COALESCE(SUM(${ordersTable.totalAmount}::numeric), 0)`,
            orderCount: sql<number>`COUNT(${ordersTable.id})`,
            lastOrderDate: sql<string | null>`MAX(${ordersTable.orderDate})`,
        })
        .from(ordersTable)
        .innerJoin(studentsTable, eq(ordersTable.studentId, studentsTable.id))
        .where(
            and(
                eq(ordersTable.parentId, parentId),
                gte(ordersTable.placedAt, since),
                inArray(ordersTable.status, ["pending", "preparing", "ready", "delivered"]),
            ),
        )
        .groupBy(studentsTable.id, studentsTable.name)
        .orderBy(sql`SUM(${ordersTable.totalAmount}::numeric) DESC`);

    return rows.map((r) => ({
        studentId: r.studentId,
        studentName: r.studentName,
        totalSpent: parseFloat(r.totalSpent),
        orderCount: Number(r.orderCount),
        lastOrderDate: r.lastOrderDate,
    }));
}

// ─── Spending summary stats ────────────────────────────────────────────────────

export async function getWalletStats(parentId: string) {
    const thirtyDaysAgo = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);
    const sevenDaysAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000);

    const [monthStats] = await db
        .select({
            totalSpent: sql<string>`COALESCE(SUM(${transactionsTable.amount}::numeric) FILTER (WHERE ${transactionsTable.transactionType} = 'purchase'), 0)`,
            totalTopups: sql<string>`COALESCE(SUM(${transactionsTable.amount}::numeric) FILTER (WHERE ${transactionsTable.transactionType} = 'wallet_topup'), 0)`,
            txCount: sql<number>`COUNT(*)`,
        })
        .from(transactionsTable)
        .where(
            and(
                eq(transactionsTable.parentId, parentId),
                eq(transactionsTable.status, "success"),
                gte(transactionsTable.createdAt, thirtyDaysAgo),
            ),
        );

    const [weekStats] = await db
        .select({
            totalSpent: sql<string>`COALESCE(SUM(${transactionsTable.amount}::numeric) FILTER (WHERE ${transactionsTable.transactionType} = 'purchase'), 0)`,
        })
        .from(transactionsTable)
        .where(
            and(
                eq(transactionsTable.parentId, parentId),
                eq(transactionsTable.status, "success"),
                gte(transactionsTable.createdAt, sevenDaysAgo),
            ),
        );

    return {
        monthSpent: parseFloat(monthStats?.totalSpent ?? "0"),
        monthTopups: parseFloat(monthStats?.totalTopups ?? "0"),
        weekSpent: parseFloat(weekStats?.totalSpent ?? "0"),
        txCount: Number(monthStats?.txCount ?? 0),
    };
}