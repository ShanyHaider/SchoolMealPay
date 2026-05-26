"use server";

import { db } from "@/drizzle/db";
import {
  ordersTable,
  orderItemsTable,
  transactionsTable,
  parentWalletsTable,
} from "@/drizzle/schema";
import { and, eq } from "drizzle-orm";
import {
  revalidateOrderCache,
  revalidateTransactionCache,
  revalidateWallet,
} from "@/lib/cacheRevalidation";
import crypto from "crypto";

// ─── Orders ────────────────────────────────────────────────────

/**
 * Creates an order and its line items.
 *
 * When paymentMethod is "wallet":
 *   1. Reads the parent's wallet balance inside a DB transaction.
 *   2. Throws if insufficient funds (caller should catch and surface to UI).
 *   3. Atomically deducts the order total and inserts a transaction record.
 *
 * When paymentMethod is "stripe" (or any non-wallet value):
 *   The order is created with status "pending". The Stripe webhook is
 *   responsible for inserting the transaction and flipping status to
 *   "confirmed" after payment succeeds.
 */
export async function createOrder(params: {
  order: Omit<typeof ordersTable.$inferInsert, "qrCode" | "status">;
  items: Omit<typeof orderItemsTable.$inferInsert, "orderId">[];
  paymentMethod: "wallet" | "stripe";
}) {
  const { order, items, paymentMethod } = params;
  const qrCode = crypto.randomUUID();

  if (paymentMethod === "wallet") {
    // ── Wallet path — everything in one atomic transaction ──────
    return await db.transaction(async (tx) => {
      // 1. Read wallet
      const wallet = await tx.query.parentWalletsTable.findFirst({
        where: eq(parentWalletsTable.parentId, order.parentId),
      });

      const currentBalance = parseFloat(wallet?.balance ?? "0");
      const orderTotal = parseFloat(order.totalAmount as string);

      if (!wallet || currentBalance < orderTotal) {
        throw new Error(
          `Insufficient wallet balance. Available: ${currentBalance.toFixed(2)}, Required: ${orderTotal.toFixed(2)}`,
        );
      }

      // 2. Insert order
      const [created] = await tx
        .insert(ordersTable)
        .values({ ...order, qrCode, status: "pending" })
        .returning();

      // 3. Insert order items
      if (items.length > 0) {
        await tx
          .insert(orderItemsTable)
          .values(items.map((item) => ({ ...item, orderId: created.id })));
      }

      // 4. Deduct from wallet
      const newBalance = (currentBalance - orderTotal).toFixed(2);
      await tx
        .update(parentWalletsTable)
        .set({ balance: newBalance })
        .where(eq(parentWalletsTable.parentId, order.parentId));

      // 5. Record the transaction
      const [txRecord] = await tx
        .insert(transactionsTable)
        .values({
          parentId: order.parentId,
          orderId: created.id,
          amount: order.totalAmount as string,
          paymentMethod: "wallet", // required notNull field
          transactionType: "purchase",
          status: "success",
          processedAt: new Date(),
        })
        .returning();

      // Revalidate outside the DB transaction (side-effects only)
      revalidateOrderCache(
        created.id,
        created.parentId,
        created.studentId,
        created.canteenId,
      );
      revalidateTransactionCache(txRecord.id, order.parentId);
      revalidateWallet(order.parentId);

      return created;
    });
  }

  // ── Stripe path — order created, payment handled by webhook ──
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
