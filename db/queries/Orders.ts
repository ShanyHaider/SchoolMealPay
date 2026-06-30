import { db } from "@/drizzle/db";
import {
  menuItemsTable,
  orderItemsTable,
  ordersTable,
  transactionsTable,
} from "@/drizzle/schema";
import { and, desc, eq } from "drizzle-orm";
import { cacheLife, cacheTag } from "next/cache";
import {
  getGlobalTag,
  getIdTag,
  getUserTag,
  getStudentTag,
  getCanteenTag,
} from "@/lib/cache";
import { RecentOrder } from "@/types/childProfileTypes";

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
    where: and(eq(ordersTable.qrCode, qrCode), eq(ordersTable.qrUsed, false)),
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

export async function getRecentOrdersForStudent(
  studentId: string,
  limit = 7,
): Promise<RecentOrder[]> {
  const rows = await db
    .select({
      orderId: ordersTable.id,
      orderDate: ordersTable.orderDate,
      status: ordersTable.status,
      totalAmount: ordersTable.totalAmount,
      itemName: menuItemsTable.name,
      itemQty: orderItemsTable.quantity,
    })
    .from(ordersTable)
    .innerJoin(orderItemsTable, eq(orderItemsTable.orderId, ordersTable.id))
    .innerJoin(
      menuItemsTable,
      eq(menuItemsTable.id, orderItemsTable.menuItemId),
    )
    .where(eq(ordersTable.studentId, studentId))
    .orderBy(desc(ordersTable.orderDate))
    .limit(limit * 4); // over-fetch to account for multi-item orders

  // Group items back onto their orders
  const orderMap = new Map<string, RecentOrder>();
  for (const row of rows) {
    if (!orderMap.has(row.orderId)) {
      orderMap.set(row.orderId, {
        id: row.orderId,
        orderDate:
          typeof row.orderDate === "string" ?
            row.orderDate
          : (row.orderDate as Date).toISOString().split("T")[0],
        status: row.status as string,
        totalAmount: row.totalAmount as string,
        items: [],
      });
    }
    orderMap.get(row.orderId)!.items.push({
      name: row.itemName,
      quantity: row.itemQty ?? 1,
    });
  }

  return [...orderMap.values()].slice(0, limit);
}
