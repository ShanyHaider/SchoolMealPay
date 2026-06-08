import { db } from "@/drizzle/db";
import {
  canteenStaffAssignmentsTable,
  ordersTable,
  dailyMenusTable,
  inventoryItemsTable,
} from "@/drizzle/schema";
import { eq, and, desc, count } from "drizzle-orm";
import { cacheLife, cacheTag } from "next/cache";
import { getGlobalTag, getCanteenTag, getUserTag } from "@/lib/cache";

// ─── Staff's assigned canteen ─────────────────────────────────────
export async function getStaffCanteen(staffId: string) {
  "use cache";
  cacheLife("hours");
  cacheTag(
    getGlobalTag("canteens"),
    getGlobalTag("canteen-staff-assignments"),
    getUserTag("canteen-staff-assignments", staffId),
  );
  const assignment = await db.query.canteenStaffAssignmentsTable.findFirst({
    where: eq(canteenStaffAssignmentsTable.staffId, staffId),
    with: { canteen: true },
  });
  return assignment?.canteen ?? null;
}

// ─── Today's orders for a canteen ─────────────────────────────────
export async function getTodayOrders(canteenId: string, today: string) {
  "use cache";
  cacheLife("seconds"); // Canteen order list needs to be super fresh
  cacheTag(getGlobalTag("orders"), getCanteenTag("orders", canteenId));
  return db.query.ordersTable.findMany({
    where: and(
      eq(ordersTable.canteenId, canteenId),
      eq(ordersTable.orderDate, today),
    ),
    orderBy: [desc(ordersTable.placedAt)],
    with: {
      student: {
        columns: { name: true, studentCode: true, imageUrl: true },
        with: { allergens: true },
      },
      orderItems: {
        with: {
          menuItem: {
            columns: { name: true, category: true, isVegetarian: true },
          },
        },
      },
    },
  });
}

// ─── Overview stats ───────────────────────────────────────────────
export async function getStaffOverviewStats(canteenId: string) {
  "use cache";
  cacheLife("seconds");
  cacheTag(getGlobalTag("orders"), getCanteenTag("orders", canteenId));
  const today = new Date().toISOString().split("T")[0];

  const [total] = await db
    .select({ count: count() })
    .from(ordersTable)
    .where(
      and(
        eq(ordersTable.canteenId, canteenId),
        eq(ordersTable.orderDate, today),
      ),
    );

  const [pending] = await db
    .select({ count: count() })
    .from(ordersTable)
    .where(
      and(
        eq(ordersTable.canteenId, canteenId),
        eq(ordersTable.orderDate, today),
        eq(ordersTable.status, "pending"),
      ),
    );

  const [preparing] = await db
    .select({ count: count() })
    .from(ordersTable)
    .where(
      and(
        eq(ordersTable.canteenId, canteenId),
        eq(ordersTable.orderDate, today),
        eq(ordersTable.status, "preparing"),
      ),
    );

  const [ready] = await db
    .select({ count: count() })
    .from(ordersTable)
    .where(
      and(
        eq(ordersTable.canteenId, canteenId),
        eq(ordersTable.orderDate, today),
        eq(ordersTable.status, "ready"),
      ),
    );

  const [collected] = await db
    .select({ count: count() })
    .from(ordersTable)
    .where(
      and(
        eq(ordersTable.canteenId, canteenId),
        eq(ordersTable.orderDate, today),
        eq(ordersTable.status, "delivered"),
      ),
    );

  return {
    total: total.count,
    pending: pending.count,
    preparing: preparing.count,
    ready: ready.count,
    collected: collected.count,
  };
}

// ─── Verify QR code (No cache for this query, always fresh check) ────
export async function getOrderByQrCode(qrCode: string) {
  return db.query.ordersTable.findFirst({
    where: eq(ordersTable.qrCode, qrCode),
    with: {
      student: {
        columns: { name: true, studentCode: true, imageUrl: true },
        with: { allergens: true },
      },
      orderItems: {
        with: {
          menuItem: { columns: { name: true, category: true } },
        },
      },
    },
  });
}

// ─── Today's menu ─────────────────────────────────────────────────
export async function getTodayMenu(canteenId: string) {
  "use cache";
  cacheLife("minutes");
  cacheTag(getGlobalTag("daily-menus"), getCanteenTag("daily-menus", canteenId));
  const today = new Date().toISOString().split("T")[0];
  return db.query.dailyMenusTable.findMany({
    where: and(
      eq(dailyMenusTable.canteenId, canteenId),
      eq(dailyMenusTable.menuDate, today),
    ),
    with: {
      menuItem: true,
    },
    orderBy: [dailyMenusTable.mealSlot],
  });
}

// ─── Inventory ────────────────────────────────────────────────────
export async function getCanteenInventory(canteenId: string) {
  "use cache";
  cacheLife("minutes");
  cacheTag(getGlobalTag("inventory-items"), getCanteenTag("inventory-items", canteenId));
  return db.query.inventoryItemsTable.findMany({
    where: eq(inventoryItemsTable.canteenId, canteenId),
    orderBy: [inventoryItemsTable.name],
  });
}
