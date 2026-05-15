import { db } from "@/drizzle/db";
import { ordersTable, transactionsTable } from "@/drizzle/schema";
import { and, eq } from "drizzle-orm";
import { unstable_cache } from "next/cache";
import {
  getGlobalTag,
  getIdTag,
  getUserTag,
  getCanteenTag,
  getStudentTag,
} from "@/lib/cache";

// ─── Orders ────────────────────────────────────────────────────

export function getOrderById(orderId: string) {
  return unstable_cache(
    () =>
      db.query.ordersTable.findFirst({
        where: eq(ordersTable.id, orderId),
        with: { orderItems: { with: { menuItem: true } } },
      }),
    [getIdTag("orders", orderId)],
    { tags: [getGlobalTag("orders"), getIdTag("orders", orderId)] },
  )();
}

export function getOrdersByParent(parentId: string) {
  return unstable_cache(
    () =>
      db.query.ordersTable.findMany({
        where: eq(ordersTable.parentId, parentId),
        with: { orderItems: { with: { menuItem: true } } },
      }),
    [getUserTag("orders", parentId)],
    { tags: [getGlobalTag("orders"), getUserTag("orders", parentId)] },
  )();
}

export function getOrdersByStudent(studentId: string) {
  return unstable_cache(
    () =>
      db.query.ordersTable.findMany({
        where: eq(ordersTable.studentId, studentId),
        with: { orderItems: { with: { menuItem: true } } },
      }),
    [getStudentTag("orders", studentId)],
    {
      tags: [getGlobalTag("orders"), getStudentTag("orders", studentId)],
    },
  )();
}

export function getOrdersByCanteen(canteenId: string, date: string) {
  return unstable_cache(
    () =>
      db.query.ordersTable.findMany({
        where: and(
          eq(ordersTable.canteenId, canteenId),
          eq(ordersTable.orderDate, date),
        ),
        with: {
          orderItems: { with: { menuItem: true } },
          student: { with: { allergens: true } },
        },
      }),
    [getCanteenTag("orders", canteenId)],
    {
      tags: [getGlobalTag("orders"), getCanteenTag("orders", canteenId)],
    },
  )();
}

// Fetch by QR code — used during meal pickup
export function getOrderByQrCode(qrCode: string) {
  return unstable_cache(
    () =>
      db.query.ordersTable.findFirst({
        where: and(
          eq(ordersTable.qrCode, qrCode),
          eq(ordersTable.qrUsed, false),
        ),
        with: {
          student: { with: { allergens: true } },
          orderItems: { with: { menuItem: true } },
        },
      }),
    // Short key — QR code lookups should not be cached long
    [`qr:${qrCode}`],
    { tags: [getGlobalTag("orders")], revalidate: 10 },
  )();
}

// ─── Transactions ──────────────────────────────────────────────

export function getTransactionsByParent(parentId: string) {
  return unstable_cache(
    () =>
      db.query.transactionsTable.findMany({
        where: eq(transactionsTable.parentId, parentId),
      }),
    [getUserTag("transactions", parentId)],
    {
      tags: [
        getGlobalTag("transactions"),
        getUserTag("transactions", parentId),
      ],
    },
  )();
}
