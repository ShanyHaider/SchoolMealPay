import { db } from "@/drizzle/db";
import { ordersTable, transactionsTable } from "@/drizzle/schema";
import { and, eq } from "drizzle-orm";
import { cacheLife, cacheTag } from "next/cache";
import { getGlobalTag, getIdTag, getUserTag, getStudentTag, getCanteenTag } from "@/lib/cache";

// ─── Orders ────────────────────────────────────────────────────

export async function getOrderById(orderId: string) {
  "use cache";
  cacheLife("seconds");
  cacheTag(getGlobalTag("orders"), getIdTag("orders", orderId));
  return db.query.ordersTable.findFirst({
    where: eq(ordersTable.id, orderId),
    with: {
      orderItems: { with: { menuItem: true } },
      mealFeedback: true, // add this
    },
  });
}

export async function getOrdersByParent(parentId: string) {
  "use cache";
  cacheLife("seconds");
  cacheTag(getGlobalTag("orders"), getUserTag("orders", parentId));
  return db.query.ordersTable.findMany({
    where: eq(ordersTable.parentId, parentId),
    with: { orderItems: { with: { menuItem: true } } },
  });
}

export async function getOrdersByStudent(studentId: string) {
  "use cache";
  cacheLife("seconds");
  cacheTag(getGlobalTag("orders"), getStudentTag("orders", studentId));
  return db.query.ordersTable.findMany({
    where: eq(ordersTable.studentId, studentId),
    with: { orderItems: { with: { menuItem: true } } },
  });
}

export async function getOrdersByCanteen(canteenId: string, date: string) {
  "use cache";
  cacheLife("seconds");
  cacheTag(getGlobalTag("orders"), getCanteenTag("orders", canteenId));
  return db.query.ordersTable.findMany({
    where: and(
      eq(ordersTable.canteenId, canteenId),
      eq(ordersTable.orderDate, date),
    ),
    with: {
      orderItems: { with: { menuItem: true } },
      student: { with: { allergens: true } },
    },
  });
}

// Fetch by QR code — used during meal pickup (No cache for this critical check)
export async function getOrderByQrCode(qrCode: string) {
  return db.query.ordersTable.findFirst({
    where: and(
      eq(ordersTable.qrCode, qrCode),
      eq(ordersTable.qrUsed, false),
    ),
    with: {
      student: { with: { allergens: true } },
      orderItems: { with: { menuItem: true } },
    },
  });
}

// ─── Transactions ──────────────────────────────────────────────

export async function getTransactionsByParent(parentId: string) {
  "use cache";
  cacheLife("seconds");
  cacheTag(getGlobalTag("transactions"), getUserTag("transactions", parentId));
  return db.query.transactionsTable.findMany({
    where: eq(transactionsTable.parentId, parentId),
  });
}
