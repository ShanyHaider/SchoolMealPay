"use server";

import { db } from "@/drizzle/db";
import {
  ordersTable,
  orderItemsTable,
  transactionsTable,
} from "@/drizzle/schema";
import { and, eq } from "drizzle-orm";
import { revalidateOrderCache, revalidateTransactionCache } from "@/lib/cacheRevalidation";
import crypto from "crypto";

// ─── Orders ────────────────────────────────────────────────────

export async function createOrder(params: {
  order: Omit<typeof ordersTable.$inferInsert, "qrCode" | "status">;
  items: Omit<typeof orderItemsTable.$inferInsert, "orderId">[];
}) {
  const { order, items } = params;

  // Generate a secure unique QR code for this order
  const qrCode = crypto.randomUUID();

  const [created] = await db
    .insert(ordersTable)
    .values({ ...order, qrCode, status: "pending" })
    .returning();

  if (items.length > 0) {
    await db
      .insert(orderItemsTable)
      .values(items.map((item) => ({ ...item, orderId: created.id })));
  }

  revalidateOrderCache(
    created.id,
    created.parentId,
    created.studentId,
    created.canteenId,
  );

  return created;
}

export async function updateOrderStatus(
  orderId: string,
  status: (typeof ordersTable.$inferInsert)["status"],
  parentId: string,
  studentId: string,
  canteenId: string,
) {
  await db
    .update(ordersTable)
    .set({ status })
    .where(eq(ordersTable.id, orderId));

  revalidateOrderCache(orderId, parentId, studentId, canteenId);
}

export async function collectOrder(
  orderId: string,
  parentId: string,
  studentId: string,
  canteenId: string,
) {
  // Mark order as delivered, invalidate QR, stamp collected time
  await db
    .update(ordersTable)
    .set({
      status: "delivered",
      qrUsed: true,
      qrInvalidatedAt: new Date(),
      collectedAt: new Date(),
    })
    .where(
      and(
        eq(ordersTable.id, orderId),
        eq(ordersTable.qrUsed, false), // prevent double collection
      ),
    );

  revalidateOrderCache(orderId, parentId, studentId, canteenId);
}

export async function cancelOrder(
  orderId: string,
  parentId: string,
  studentId: string,
  canteenId: string,
) {
  await db
    .update(ordersTable)
    .set({ status: "cancelled" })
    .where(eq(ordersTable.id, orderId));

  revalidateOrderCache(orderId, parentId, studentId, canteenId);
}

// ─── Transactions ──────────────────────────────────────────────

export async function createTransaction(
  transaction: typeof transactionsTable.$inferInsert,
) {
  const [created] = await db
    .insert(transactionsTable)
    .values(transaction)
    .returning();

  revalidateTransactionCache(created.id, created.parentId);
  return created;
}

export async function updateTransactionStatus(
  transactionId: string,
  parentId: string,
  status: (typeof transactionsTable.$inferInsert)["status"],
  failureReason?: string,
) {
  await db
    .update(transactionsTable)
    .set({
      status,
      failureReason: failureReason ?? null,
      processedAt: new Date(),
    })
    .where(eq(transactionsTable.id, transactionId));

  revalidateTransactionCache(transactionId, parentId);
}
