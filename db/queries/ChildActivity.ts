"use server";

import { db } from "@/drizzle/db";
import { ordersTable, orderItemsTable, menuItemsTable } from "@/drizzle/schema";
import { and, eq, gte, lte, desc, inArray, sql } from "drizzle-orm";

export type ChildActivitySummary = {
    studentId: string;
    todayOrder: { status: string; total: number } | null;
    weeklySpend: number;
    lastMeal: { name: string; date: string } | null;
};

const ACTIVE_STATUSES = ["pending", "ready", "delivered"] as const;

function getWeekBounds() {
    const now = new Date();
    const day = now.getDay(); // 0 = Sun
    const start = new Date(now);
    start.setDate(now.getDate() - day);
    start.setHours(0, 0, 0, 0);
    const end = new Date(start);
    end.setDate(start.getDate() + 6);
    end.setHours(23, 59, 59, 999);
    return {
        start: start.toISOString().split("T")[0],
        end: end.toISOString().split("T")[0],
    };
}

export async function getChildActivitySummaries(
    studentIds: string[],
): Promise<ChildActivitySummary[]> {
    if (studentIds.length === 0) return [];

    const today = new Date().toISOString().split("T")[0];
    const { start: weekStart, end: weekEnd } = getWeekBounds();

    // ── All active orders this week for these students ───────────────────────────
    const weekOrders = await db
        .select({
            id: ordersTable.id,
            studentId: ordersTable.studentId,
            orderDate: ordersTable.orderDate,
            totalAmount: ordersTable.totalAmount,
            status: ordersTable.status,
        })
        .from(ordersTable)
        .where(
            and(
                inArray(ordersTable.studentId, studentIds),
                inArray(ordersTable.status, [...ACTIVE_STATUSES]),
                sql`${ordersTable.orderDate} >= ${weekStart}`,
                sql`${ordersTable.orderDate} <= ${weekEnd}`,
            ),
        );

    // ── Last delivered meal per student (name from order items) ─────────────────
    const lastDeliveredOrders = await db
        .select({
            studentId: ordersTable.studentId,
            orderDate: ordersTable.orderDate,
            menuItemName: menuItemsTable.name,
        })
        .from(ordersTable)
        .innerJoin(orderItemsTable, eq(orderItemsTable.orderId, ordersTable.id))
        .innerJoin(menuItemsTable, eq(menuItemsTable.id, orderItemsTable.menuItemId))
        .where(
            and(
                inArray(ordersTable.studentId, studentIds),
                eq(ordersTable.status, "delivered"),
            ),
        )
        .orderBy(desc(ordersTable.orderDate))
        .limit(studentIds.length * 2); // fetch a few per student, dedupe below

    // ── Assemble per-student summary ─────────────────────────────────────────────
    return studentIds.map((studentId) => {
        const studentWeekOrders = weekOrders.filter((o) => o.studentId === studentId);

        const todayOrder = studentWeekOrders.find((o) => {
            const d = typeof o.orderDate === "string"
                ? o.orderDate
                : (o.orderDate as Date).toISOString().split("T")[0];
            return d === today;
        });

        const weeklySpend = studentWeekOrders.reduce(
            (sum, o) => sum + parseFloat(o.totalAmount as string),
            0,
        );

        const lastDelivered = lastDeliveredOrders.find(
            (o) => o.studentId === studentId,
        );

        return {
            studentId,
            todayOrder: todayOrder
                ? {
                    status: todayOrder.status as string,
                    total: parseFloat(todayOrder.totalAmount as string),
                }
                : null,
            weeklySpend,
            lastMeal: lastDelivered
                ? {
                    name: lastDelivered.menuItemName,
                    date: typeof lastDelivered.orderDate === "string"
                        ? lastDelivered.orderDate
                        : (lastDelivered.orderDate as Date).toISOString().split("T")[0],
                }
                : null,
        };
    });
}