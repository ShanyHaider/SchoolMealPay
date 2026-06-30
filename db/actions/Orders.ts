"use server";

import { db } from "@/drizzle/db";
import {
  ordersTable,
  orderItemsTable,
  transactionsTable,
  parentWalletsTable,
  studentsTable,
  childProfilesTable,
} from "@/drizzle/schema";
import { and, eq, inArray, sql } from "drizzle-orm";
import {
  revalidateOrderCache,
  revalidateTransactionCache,
  revalidateWallet,
} from "@/lib/cacheRevalidation";
import crypto from "crypto";
import { revalidatePath } from "next/cache";
import { PushEvents } from "@/lib/notification/webpush";
import { notify } from "@/lib/notification/notify";
import { invalidateStudentMealSuggestions } from "@/db/actions/ai/nutrition";
import {
  notifyStaffNewOrder,
  notifyStaffOrderCancelled,
} from "@/db/actions/Notifications";
import { after } from "next/server";

// ── Result type ────────────────────────────────────────────────────────────────

type OrderResult =
  | { success: true; data: typeof ordersTable.$inferSelect }
  | {
    success: false;
    error: string;
    code:
    | "INSUFFICIENT_BALANCE"
    | "WALLET_NOT_FOUND"
    | "DAILY_LIMIT_EXCEEDED"
    | "WEEKLY_LIMIT_EXCEEDED"
    | "UNKNOWN";
  };

// ── Active order statuses (count toward spending limits) ───────────────────────

const ACTIVE_STATUSES = ["pending", "ready", "delivered"] as const;

// ── Helper: fetch student name for notification copy ──────────────────────────

async function getStudentName(studentId: string): Promise<string> {
  const student = await db.query.studentsTable.findFirst({
    where: eq(studentsTable.id, studentId),
    columns: { name: true },
  });
  return student?.name ?? "Your child";
}

// ── createOrder ────────────────────────────────────────────────────────────────

export async function createOrder(params: {
  order: Omit<typeof ordersTable.$inferInsert, "qrCode" | "status">;
  items: Omit<typeof orderItemsTable.$inferInsert, "orderId">[];
  paymentMethod?: "wallet" | "stripe";
  forceLimitOverride?: boolean;
}): Promise<OrderResult> {
  const { order, items, paymentMethod = "wallet", forceLimitOverride = false } = params;
  const qrCode = crypto.randomUUID();

  if (!order.parentId) {
    return { success: false, error: "Parent ID is required.", code: "UNKNOWN" };
  }
  const parentId = order.parentId;

  if (paymentMethod === "wallet") {
    try {
      const created = await db.transaction(async (tx) => {
        const [wallet] = await tx
          .select()
          .from(parentWalletsTable)
          .where(eq(parentWalletsTable.parentId, parentId))
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

        if (!forceLimitOverride) {

          // ── Spending limit enforcement ──────────────────────────────────────────
          const childProfile = await tx.query.childProfilesTable.findFirst({
            where: eq(childProfilesTable.studentId, order.studentId!),
            columns: { dailySpendingLimit: true, weeklySpendingLimit: true },
          });

          if (childProfile?.dailySpendingLimit) {
            const dailyLimit = parseFloat(childProfile.dailySpendingLimit);
            const orderDateStr = (order.orderDate as string).split("T")[0];

            const [{ spent }] = await tx
              .select({
                spent: sql<string>`coalesce(sum(${ordersTable.totalAmount}), '0')`,
              })
              .from(ordersTable)
              .where(
                and(
                  eq(ordersTable.studentId, order.studentId!),
                  inArray(ordersTable.status, [...ACTIVE_STATUSES]),
                  sql`${ordersTable.orderDate} = ${orderDateStr}`,
                ),
              );

            if (parseFloat(spent) + orderTotal > dailyLimit) {
              throw Object.assign(
                new Error(
                  `Daily spending limit of PKR ${Math.round(dailyLimit)} reached. Already spent PKR ${Math.round(parseFloat(spent))}.`,
                ),
                { code: "DAILY_LIMIT_EXCEEDED" },
              );
            }
          }

          if (childProfile?.weeklySpendingLimit) {
            const weeklyLimit = parseFloat(childProfile.weeklySpendingLimit);

            const orderDay = new Date(order.orderDate as string);
            const dayOfWeek = orderDay.getDay(); // 0 = Sun
            const startOfWeek = new Date(orderDay);
            startOfWeek.setDate(orderDay.getDate() - dayOfWeek);
            const endOfWeek = new Date(startOfWeek);
            endOfWeek.setDate(startOfWeek.getDate() + 6);

            const [{ spent }] = await tx
              .select({
                spent: sql<string>`coalesce(sum(${ordersTable.totalAmount}), '0')`,
              })
              .from(ordersTable)
              .where(
                and(
                  eq(ordersTable.studentId, order.studentId!),
                  inArray(ordersTable.status, [...ACTIVE_STATUSES]),
                  sql`${ordersTable.orderDate} >= ${startOfWeek.toISOString().split("T")[0]}`,
                  sql`${ordersTable.orderDate} <= ${endOfWeek.toISOString().split("T")[0]}`,
                ),
              );

            if (parseFloat(spent) + orderTotal > weeklyLimit) {
              throw Object.assign(
                new Error(
                  `Weekly spending limit of PKR ${Math.round(weeklyLimit)} reached. Already spent PKR ${Math.round(parseFloat(spent))}.`,
                ),
                { code: "WEEKLY_LIMIT_EXCEEDED" },
              );
            }
          }
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
          .where(eq(parentWalletsTable.parentId, parentId));

        const [txRecord] = await tx
          .insert(transactionsTable)
          .values({
            parentId,
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
          parentId,
          created.studentId,
          created.canteenId,
        );
        revalidateTransactionCache(txRecord.id, parentId);
        revalidateWallet(parentId);
        revalidatePath("/parent");
        revalidatePath("/parent/orders");
        revalidatePath("/parent/wallet");
        revalidatePath("/canteen-staff");

        return created;
      });

      await invalidateStudentMealSuggestions(created.studentId, created.orderDate);

      after(() => {
        getStudentName(created.studentId).then((name) => {
          notify({
            userId: parentId,
            type: "order_confirmed",
            event: PushEvents.orderPlaced(name, parseFloat(created.totalAmount)),
          }).catch(console.error);
          notifyStaffNewOrder(created.canteenId, name, items.length).catch(console.error);
        });
      });

      return { success: true, data: created };
    } catch (e: any) {
      const code = e?.code;
      if (
        code === "INSUFFICIENT_BALANCE" ||
        code === "WALLET_NOT_FOUND" ||
        code === "DAILY_LIMIT_EXCEEDED" ||
        code === "WEEKLY_LIMIT_EXCEEDED"
      ) {
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

    revalidateOrderCache(created.id, parentId, created.studentId, created.canteenId);
    revalidatePath("/parent");
    revalidatePath("/parent/orders");

    await invalidateStudentMealSuggestions(created.studentId, created.orderDate);

    after(() => {
      getStudentName(created.studentId).then((name) => {
        notify({
          userId: parentId,
          type: "order_confirmed",
          event: PushEvents.orderPlaced(name, parseFloat(created.totalAmount)),
        }).catch(console.error);
        notifyStaffNewOrder(created.canteenId, name, items.length).catch(console.error);
      })
    });

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

  after(() => {
    if (status === "ready") {
      getStudentName(studentId).then((name) =>
        notify({
          userId: parentId,
          type: "order_ready",
          event: PushEvents.mealReady(name),
        }).catch(console.error),
      );
    }
  })
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

  after(() => {
    getStudentName(studentId).then((name) =>
      notify({
        userId: parentId,
        type: "meal_collected",
        event: PushEvents.orderCollected(name),
      }).catch(console.error),
    );
  })
}

// ── cancelOrder ────────────────────────────────────────────────────────────────

export async function cancelOrder(
  orderId: string,
  parentId: string,
  studentId: string,
  canteenId: string,
) {
  await db.transaction(async (tx) => {
    const [order] = await tx
      .select()
      .from(ordersTable)
      .where(and(eq(ordersTable.id, orderId), eq(ordersTable.parentId, parentId)))
      .limit(1);

    if (!order) throw new Error("Order not found.");
    if (order.status !== "pending") throw new Error("Only pending orders can be cancelled.");

    await tx
      .update(ordersTable)
      .set({ status: "cancelled" })
      .where(eq(ordersTable.id, orderId));

    await tx
      .update(parentWalletsTable)
      .set({
        balance: sql`${parentWalletsTable.balance} + ${order.totalAmount}`,
        updatedAt: new Date(),
      })
      .where(eq(parentWalletsTable.parentId, parentId));

    await tx.insert(transactionsTable).values({
      parentId,
      orderId,
      amount: order.totalAmount,
      paymentMethod: "wallet",
      transactionType: "refund",
      status: "success",
      processedAt: new Date(),
    });
  });

  revalidateOrderCache(orderId, parentId, studentId, canteenId);
  revalidateWallet(parentId);
  revalidatePath("/parent");
  revalidatePath("/parent/orders");
  revalidatePath("/parent/wallet");
  revalidatePath("/canteen-staff");

  after(() => {
    getStudentName(studentId).then((name) => {
      notify({
        userId: parentId,
        type: "order_cancelled",
        event: PushEvents.orderCancelled(name),
      }).catch(console.error);
      notifyStaffOrderCancelled(canteenId, name).catch(console.error);
    });
  })

}

// ── Transactions ───────────────────────────────────────────────────────────────

export async function createTransaction(
  transaction: typeof transactionsTable.$inferInsert,
) {
  const [created] = await db
    .insert(transactionsTable)
    .values(transaction)
    .returning();

  revalidateTransactionCache(created.id, created.parentId ?? "");
  revalidatePath("/parent/wallet");
  revalidatePath("/parent/settings");

  if (transaction.transactionType === "wallet_topup" && created.parentId) {
    notify({
      userId: created.parentId,
      type: "payment_success",
      event: PushEvents.walletTopUp(parseFloat(created.amount)),
    }).catch(console.error);
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

// ── createRecurringOrders ──────────────────────────────────────────────────────

export async function createRecurringOrders(params: {
  parentId: string;
  studentId: string;
  canteenId: string;
  days: {
    date: string;
    menuItemId: string;
    unitPrice: string;
  }[];
}): Promise<
  { success: true; count: number } | { success: false; error: string; code: string }
> {
  const { parentId, studentId, canteenId, days } = params;

  if (days.length === 0) {
    return { success: false, error: "No days provided.", code: "NO_DAYS" };
  }

  const recurringGroupId = crypto.randomUUID();
  const totalAmount = days
    .reduce((sum, d) => sum + parseFloat(d.unitPrice), 0)
    .toFixed(2);

  try {
    await db.transaction(async (tx) => {
      const [wallet] = await tx
        .select()
        .from(parentWalletsTable)
        .where(eq(parentWalletsTable.parentId, parentId))
        .for("update");

      if (!wallet) {
        throw Object.assign(new Error("Wallet not found."), {
          code: "WALLET_NOT_FOUND",
        });
      }

      const balance = parseFloat(wallet.balance);
      const total = parseFloat(totalAmount);

      if (balance < total) {
        throw Object.assign(
          new Error(
            `Insufficient balance. You need PKR ${total.toFixed(2)} but only have PKR ${balance.toFixed(2)}.`,
          ),
          { code: "INSUFFICIENT_BALANCE" },
        );
      }

      for (const day of days) {
        const qrCode = crypto.randomUUID();
        const deadline = new Date(`${day.date}T07:30:00`);

        const [order] = await tx
          .insert(ordersTable)
          .values({
            parentId,
            studentId,
            canteenId,
            status: "pending",
            totalAmount: day.unitPrice,
            taxAmount: "0",
            qrCode,
            qrUsed: false,
            isRecurring: true,
            recurringGroupId,
            orderDate: day.date,
            preparationDeadlineAt: deadline,
          })
          .returning();

        await tx.insert(orderItemsTable).values({
          orderId: order.id,
          menuItemId: day.menuItemId,
          quantity: 1,
          unitPrice: day.unitPrice,
        });
      }

      const newBalance = (balance - total).toFixed(2);
      await tx
        .update(parentWalletsTable)
        .set({ balance: newBalance, updatedAt: new Date() })
        .where(eq(parentWalletsTable.parentId, parentId));

      await tx.insert(transactionsTable).values({
        parentId,
        amount: totalAmount,
        paymentMethod: "wallet",
        transactionType: "purchase",
        status: "success",
        processedAt: new Date(),
      });
    });

    revalidatePath("/parent");
    revalidatePath("/parent/orders");
    revalidatePath("/parent/wallet");
    revalidatePath("/canteen-staff");
    revalidateWallet(parentId);

    await Promise.all(
      days.map((d) => invalidateStudentMealSuggestions(studentId, d.date)),
    );

    after(() => {
      getStudentName(studentId).then((name) =>
        notify({
          userId: parentId,
          type: "recurring_orders_placed",
          event: {
            title: "Recurring meals scheduled",
            body: `${days.length} meals scheduled for ${name} totalling PKR ${parseFloat(totalAmount).toFixed(0)}.`,
            url: "/parent/orders",
            tag: "recurring-orders",
          },
        }).catch(console.error),
      );
    })

    return { success: true, count: days.length };
  } catch (e: any) {
    const code = e?.code;
    if (code === "INSUFFICIENT_BALANCE" || code === "WALLET_NOT_FOUND") {
      return { success: false, error: e.message, code };
    }
    console.error("[createRecurringOrders] unexpected error:", e);
    return {
      success: false,
      error: "An unexpected error occurred.",
      code: "UNKNOWN",
    };
  }
}