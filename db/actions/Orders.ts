"use server";

// db/actions/Orders.ts
// Push + in-app notifications wired into: createOrder, updateOrderStatus, collectOrder, cancelOrder, createTransaction

import { db } from "@/drizzle/db";
import {
  ordersTable,
  orderItemsTable,
  transactionsTable,
  parentWalletsTable,
  studentsTable,
} from "@/drizzle/schema";
import { and, eq } from "drizzle-orm";
import {
  revalidateOrderCache,
  revalidateTransactionCache,
  revalidateWallet,
} from "@/lib/cacheRevalidation";
import crypto from "crypto";
import { revalidatePath } from "next/cache";
import { sendPushNotification, PushEvents } from "@/lib/webpush";
import { createNotification } from "@/db/actions/Notifications";

// ── Result type ────────────────────────────────────────────────────────────────

type OrderResult =
  | { success: true; data: typeof ordersTable.$inferSelect }
  | {
    success: false;
    error: string;
    code: "INSUFFICIENT_BALANCE" | "WALLET_NOT_FOUND" | "UNKNOWN";
  };

// ── Helper: fetch student name for notification copy ──────────────────────────

async function getStudentName(studentId: string): Promise<string> {
  const student = await db.query.studentsTable.findFirst({
    where: eq(studentsTable.id, studentId),
    columns: { name: true },
  });
  return student?.name ?? "Your child";
}

// ── Helper: send push + write in-app notification together ────────────────────

async function notifyParent(
  userId: string,
  type: string,
  event: { title: string; body: string },
) {
  await Promise.all([
    sendPushNotification(userId, event).catch(console.error),
    createNotification({
      userId,
      type,
      title: event.title,
      message: event.body,
      channel: "in_app",
    }),
  ]);
}

// ── createOrder ────────────────────────────────────────────────────────────────

export async function createOrder(params: {
  order: Omit<typeof ordersTable.$inferInsert, "qrCode" | "status">;
  items: Omit<typeof orderItemsTable.$inferInsert, "orderId">[];
  paymentMethod?: "wallet" | "stripe";
}): Promise<OrderResult> {
  const { order, items, paymentMethod = "wallet" } = params;
  const qrCode = crypto.randomUUID();

  if (paymentMethod === "wallet") {
    try {
      const created = await db.transaction(async (tx) => {
        const [wallet] = await tx
          .select()
          .from(parentWalletsTable)
          .where(eq(parentWalletsTable.parentId, order.parentId))
          .for("update");

        if (!wallet) {
          throw Object.assign(new Error("Wallet not found."), {
            code: "WALLET_NOT_FOUND",
          });
        }

        const currentBalance = parseFloat(wallet.balance);
        const orderTotal = parseFloat(order.totalAmount as string);

        if (currentBalance < orderTotal) {
          throw Object.assign(
            new Error(
              `Insufficient wallet balance. Available: ${currentBalance.toFixed(2)}, Required: ${orderTotal.toFixed(2)}`,
            ),
            { code: "INSUFFICIENT_BALANCE" },
          );
        }

        const [created] = await tx
          .insert(ordersTable)
          .values({ ...order, qrCode, status: "pending" })
          .returning();

        if (items.length > 0) {
          await tx
            .insert(orderItemsTable)
            .values(items.map((item) => ({ ...item, orderId: created.id })));
        }

        const newBalance = (currentBalance - orderTotal).toFixed(2);
        await tx
          .update(parentWalletsTable)
          .set({ balance: newBalance, updatedAt: new Date() })
          .where(eq(parentWalletsTable.parentId, order.parentId));

        const [txRecord] = await tx
          .insert(transactionsTable)
          .values({
            parentId: order.parentId,
            orderId: created.id,
            amount: order.totalAmount as string,
            paymentMethod: "wallet",
            transactionType: "purchase",
            status: "success",
            processedAt: new Date(),
          })
          .returning();

        revalidateOrderCache(
          created.id,
          created.parentId,
          created.studentId,
          created.canteenId,
        );
        revalidateTransactionCache(txRecord.id, order.parentId);
        revalidateWallet(order.parentId);
        revalidatePath("/parent");
        revalidatePath("/parent/orders");
        revalidatePath("/parent/wallet");
        revalidatePath("/canteen-staff");

        return created;
      });

      // Fire-and-forget — don't let notifications fail the order response
      getStudentName(created.studentId).then((name) =>
        notifyParent(
          created.parentId,
          "order_confirmed",
          PushEvents.orderPlaced(name, parseFloat(created.totalAmount)),
        ).catch(console.error),
      );

      return { success: true, data: created };
    } catch (e: any) {
      const code = e?.code;
      if (code === "INSUFFICIENT_BALANCE" || code === "WALLET_NOT_FOUND") {
        return { success: false, error: e.message, code };
      }
      console.error("[createOrder] unexpected error:", e);
      return {
        success: false,
        error: "An unexpected error occurred. Please try again.",
        code: "UNKNOWN",
      };
    }
  }

  // ── Stripe path ──────────────────────────────────────────────────────────────
  try {
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
    revalidatePath("/parent");
    revalidatePath("/parent/orders");

    // Stripe orders also get notifications
    getStudentName(created.studentId).then((name) =>
      notifyParent(
        created.parentId,
        "order_confirmed",
        PushEvents.orderPlaced(name, parseFloat(created.totalAmount)),
      ).catch(console.error),
    );

    return { success: true, data: created };
  } catch (e) {
    console.error("[createOrder] stripe path error:", e);
    return { success: false, error: "Failed to create order.", code: "UNKNOWN" };
  }
}

// ── updateOrderStatus ──────────────────────────────────────────────────────────

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
  revalidatePath("/parent");
  revalidatePath("/parent/orders");
  revalidatePath("/canteen-staff");

  if (status === "ready") {
    getStudentName(studentId).then((name) =>
      notifyParent(parentId, "order_ready", PushEvents.mealReady(name)).catch(
        console.error,
      ),
    );
  }
}

// ── collectOrder ───────────────────────────────────────────────────────────────

export async function collectOrder(
  orderId: string,
  parentId: string,
  studentId: string,
  canteenId: string,
) {
  await db
    .update(ordersTable)
    .set({
      status: "delivered",
      qrUsed: true,
      qrInvalidatedAt: new Date(),
      collectedAt: new Date(),
    })
    .where(and(eq(ordersTable.id, orderId), eq(ordersTable.qrUsed, false)));

  revalidateOrderCache(orderId, parentId, studentId, canteenId);
  revalidatePath("/parent");
  revalidatePath("/parent/orders");
  revalidatePath("/canteen-staff");

  getStudentName(studentId).then((name) =>
    notifyParent(
      parentId,
      "meal_collected",
      PushEvents.orderCollected(name),
    ).catch(console.error),
  );
}

// ── cancelOrder ────────────────────────────────────────────────────────────────

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
  revalidatePath("/parent");
  revalidatePath("/parent/orders");
  revalidatePath("/canteen-staff");

  getStudentName(studentId).then((name) =>
    notifyParent(
      parentId,
      "order_cancelled",
      PushEvents.orderCancelled(name),
    ).catch(console.error),
  );
}

// ── Transactions ───────────────────────────────────────────────────────────────

export async function createTransaction(
  transaction: typeof transactionsTable.$inferInsert,
) {
  const [created] = await db
    .insert(transactionsTable)
    .values(transaction)
    .returning();

  revalidateTransactionCache(created.id, created.parentId);
  revalidatePath("/parent/wallet");
  revalidatePath("/parent/settings");

  if (transaction.transactionType === "wallet_topup") {
    notifyParent(
      created.parentId,
      "payment_success",
      PushEvents.walletTopUp(parseFloat(created.amount)),
    ).catch(console.error);
  }

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
  revalidatePath("/parent/wallet");
  revalidatePath("/parent/settings");
}

export async function fetchDailyMenuAction(canteenId: string, dateStr: string) {
  const { getDailyMenu } = await import("@/db/queries/Canteen");
  return getDailyMenu(canteenId, dateStr);
}