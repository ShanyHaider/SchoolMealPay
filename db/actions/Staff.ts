"use server";

import { db } from "@/drizzle/db";
import {
    ordersTable,
    inventoryItemsTable,
    canteensTable,
    usersTable,
} from "@/drizzle/schema";
import { eq } from "drizzle-orm";
import { revalidateTag as _revalidateTag } from "next/cache";
import { getGlobalTag } from "@/lib/cache";
import { getOrderByQrCode } from "@/db/queries/Staff";
import { notify } from "@/lib/notification/notify";
import { PushEvents } from "@/lib/notification/webpush";
import { assertRole } from "@/lib/guards/serverGuards";
import { clerkClient } from "@clerk/nextjs/server";
import {
    revalidateCanteenStaffCache,
    revalidateStaffCache,
} from "@/lib/cacheRevalidation";

const revalidateTag = _revalidateTag as (tag: string) => void;

type OrderStatus = "pending" | "preparing" | "ready" | "delivered" | "cancelled";

// ─── Update order status ──────────────────────────────────────────────────────

export async function updateOrderStatus(orderId: string, status: OrderStatus) {
    await db
        .update(ordersTable)
        .set({ status })
        .where(eq(ordersTable.id, orderId));
    revalidateTag(getGlobalTag("orders"));
}

// ─── QR verification and pickup confirmation ──────────────────────────────────

export async function verifyAndCollectQr(
    qrCode: string,
    canteenId: string,
): Promise<
    | { success: true; order: NonNullable<Awaited<ReturnType<typeof getOrderByQrCode>>> }
    | { success: false; error: string }
> {
    const order = await getOrderByQrCode(qrCode);

    if (!order) {
        return { success: false, error: "QR code not found. This code may be invalid." };
    }

    if (order.canteenId !== canteenId) {
        return { success: false, error: "This order belongs to a different canteen." };
    }

    if (order.qrUsed) {
        return {
            success: false,
            error: `Already collected${order.collectedAt
                ? ` at ${new Date(order.collectedAt).toLocaleTimeString("en-US", {
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
        .set({ status: "delivered", qrUsed: true, collectedAt: new Date() })
        .where(eq(ordersTable.id, order.id));

    revalidateTag(getGlobalTag("orders"));

    // Notify parent — order.parentId and order.student.name must be present in
    // the getOrderByQrCode query. Add them if they aren't already selected.
    if (order.parentId) {
        const studentName = (order as any).student?.name ?? "Your child";
        notify({
            userId: order.parentId,
            type: "meal_collected",
            event: PushEvents.orderCollected(studentName),
        }).catch(console.error);
    }

    return { success: true, order };
}

// ─── Update inventory stock ───────────────────────────────────────────────────

export async function updateInventoryQuantity(id: string, quantity: string) {
    await db
        .update(inventoryItemsTable)
        .set({ quantity, updatedAt: new Date() })
        .where(eq(inventoryItemsTable.id, id));
    revalidateTag(getGlobalTag("inventory-items"));
}
