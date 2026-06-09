"use server";

import { db } from "@/drizzle/db";
import { ordersTable, inventoryItemsTable } from "@/drizzle/schema";
import { eq, and } from "drizzle-orm";
import { revalidateTag as _revalidateTag } from "next/cache";
import { getGlobalTag } from "@/lib/cache";
import { getOrderByQrCode } from "@/db/queries/Staff";

// Fix for Next.js 15 broken revalidateTag types (profile arg incorrectly required)
const revalidateTag = _revalidateTag as (tag: string) => void;

// Explicitly union the allowed string literals using the | symbol
type OrderStatus = "pending" | "preparing" | "ready" | "delivered" | "cancelled";

// ─── Update order status ──────────────────────────────────────────
export async function updateOrderStatus(orderId: string, status: OrderStatus) {
    await db
        .update(ordersTable)
        .set({ status })
        .where(eq(ordersTable.id, orderId));
    revalidateTag(getGlobalTag("orders"));
}

// ─── QR verification and pickup confirmation ──────────────────────
export async function verifyAndCollectQr(
    qrCode: string,
    canteenId: string,
): Promise<
    | {
        success: true;
        order: NonNullable<Awaited<ReturnType<typeof getOrderByQrCode>>>;
    }
    | { success: false; error: string }
> {
    const order = await getOrderByQrCode(qrCode);

    if (!order) {
        return {
            success: false,
            error: "QR code not found. This code may be invalid.",
        };
    }

    if (order.canteenId !== canteenId) {
        return {
            success: false,
            error: "This order belongs to a different canteen.",
        };
    }

    if (order.qrUsed) {
        return {
            success: false,
            error: `Already collected${order.collectedAt ?
                    ` at ${new Date(order.collectedAt).toLocaleTimeString("en-US", {
                        hour: "2-digit",
                        minute: "2-digit",
                    })}`
                    : ""
                }.`,
        };
    }

    if (order.status === "cancelled") {
        return { success: false, error: "This order has been cancelled." };
    }

    if (order.status === "pending") {
        return { success: false, error: "This order has not been prepared yet." };
    }

    await db
        .update(ordersTable)
        .set({
            status: "delivered",
            qrUsed: true,
            collectedAt: new Date(),
        })
        .where(eq(ordersTable.id, order.id));

    revalidateTag(getGlobalTag("orders"));
    return { success: true, order };
}

// ─── Update inventory stock ───────────────────────────────────────
// Schema field is `quantity` (not currentStock)
export async function updateInventoryQuantity(id: string, quantity: string) {
    await db
        .update(inventoryItemsTable)
        .set({ quantity, updatedAt: new Date() })
        .where(eq(inventoryItemsTable.id, id));
    revalidateTag(getGlobalTag("inventory-items"));
}
