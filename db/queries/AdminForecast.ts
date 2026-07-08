import { db } from "@/drizzle/db";
import {
    ordersTable,
    orderItemsTable,
    menuItemsTable,
    mealFeedbackTable,
} from "@/drizzle/schema";
import { eq, gte, and, isNotNull } from "drizzle-orm";

export async function getOrderHistoryForForecast(canteenId: string, weeksBack = 8) {
    const since = new Date();
    since.setDate(since.getDate() - weeksBack * 7);
    const sinceStr = since.toISOString().split("T")[0];

    const rows = await db
        .select({
            date: ordersTable.orderDate,
            menuItemId: orderItemsTable.menuItemId,
            menuItemName: menuItemsTable.name,
            quantity: orderItemsTable.quantity,
        })
        .from(orderItemsTable)
        .innerJoin(ordersTable, eq(orderItemsTable.orderId, ordersTable.id))
        .innerJoin(menuItemsTable, eq(orderItemsTable.menuItemId, menuItemsTable.id))
        .where(
            and(eq(ordersTable.canteenId, canteenId), gte(ordersTable.orderDate, sinceStr)),
        );

    // Collapse multiple order_items rows for the same date+item into one total
    const map = new Map<string, {
        date: string;
        menuItemId: string;
        menuItemName: string;
        quantity: number;
    }>();

    for (const r of rows) {
        const key = `${r.date}_${r.menuItemId}`;
        const existing = map.get(key);
        if (existing) existing.quantity += r.quantity;
        else
            map.set(key, {
                date: r.date,
                menuItemId: r.menuItemId,
                menuItemName: r.menuItemName,
                quantity: r.quantity,
            });
    }
    return Array.from(map.values());
}

export async function getFeedbackForSentiment(canteenId: string, daysBack = 30) {
    const since = new Date();
    since.setDate(since.getDate() - daysBack);

    const rows = await db
        .select({
            id: mealFeedbackTable.id,
            comment: mealFeedbackTable.comment,
            rating: mealFeedbackTable.rating,
        })
        .from(mealFeedbackTable)
        .innerJoin(ordersTable, eq(mealFeedbackTable.orderId, ordersTable.id))
        .where(
            and(
                eq(ordersTable.canteenId, canteenId),
                gte(mealFeedbackTable.submittedAt, since),
                isNotNull(mealFeedbackTable.comment),
            ),
        );

    return rows
        .filter((r): r is { id: string; comment: string; rating: number } => !!r.comment?.trim())
        .map((r) => ({ id: r.id, comment: r.comment, rating: r.rating }));
}