"use server";

import { db } from "@/drizzle/db";
import { ordersTable, inventoryItemsTable } from "@/drizzle/schema";
import { eq } from "drizzle-orm";
import { revalidateTag as _revalidateTag } from "next/cache";
import { getGlobalTag } from "@/lib/cache";
import { getOrderByQrCode } from "@/db/queries/Staff";
import { notify } from "@/lib/notification/notify";
import { PushEvents } from "@/lib/notification/webpush";
import {
  revalidateOrderCache,
  revalidateInventoryCache,
} from "@/lib/cacheRevalidation";

const revalidateTag = _revalidateTag as (tag: string) => void;

type OrderStatus =
  | "pending"
  | "preparing"
  | "ready"
  | "delivered"
  | "cancelled";

// ─── Update order status ──────────────────────────────────────────────────────

export async function updateOrderStatus(orderId: string, status: OrderStatus) {
  const [updated] = await db
    .update(ordersTable)
    .set({ status })
    .where(eq(ordersTable.id, orderId))
    .returning();

  if (updated) {
    revalidateOrderCache(
      updated.id,
      updated.parentId,
      updated.studentId,
      updated.canteenId,
    );
  } else {
    revalidateTag(getGlobalTag("orders"));
  }
}

// ─── QR verification and pickup confirmation ──────────────────────────────────

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
      error: `Already collected${
        order.collectedAt ?
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
    .set({ status: "delivered", qrUsed: true, collectedAt: new Date() })
    .where(eq(ordersTable.id, order.id));

  revalidateOrderCache(
    order.id,
    order.parentId,
    (order as any).studentId,
    order.canteenId,
  );

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
  const existing = await db.query.inventoryItemsTable.findFirst({
    where: eq(inventoryItemsTable.id, id),
  });

  await db
    .update(inventoryItemsTable)
    .set({ quantity, updatedAt: new Date() })
    .where(eq(inventoryItemsTable.id, id));

  if (existing) {
    revalidateInventoryCache(id, existing.canteenId);
  } else {
    revalidateTag(getGlobalTag("inventory-items"));
  }
}
