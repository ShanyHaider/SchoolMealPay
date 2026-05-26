import { db } from "@/drizzle/db";
import {
  canteensTable,
  canteenStaffAssignmentsTable,
  ordersTable,
  orderItemsTable,
  menuItemsTable,
  dailyMenusTable,
  inventoryItemsTable,
  studentsTable,
} from "@/drizzle/schema";
import { eq, and, desc, count, sql } from "drizzle-orm";
import { unstable_cache } from "next/cache";
import { getGlobalTag } from "@/lib/cache";

// ─── Staff's assigned canteen ─────────────────────────────────────
export const getStaffCanteen = unstable_cache(
  async (staffId: string) => {
    const assignment = await db.query.canteenStaffAssignmentsTable.findFirst({
      where: eq(canteenStaffAssignmentsTable.staffId, staffId),
      with: { canteen: true },
    });
    return assignment?.canteen ?? null;
  },
  ["staff-canteen"],
  { tags: [getGlobalTag("canteens")] },
);

// ─── Today's orders for a canteen ─────────────────────────────────
export const getTodayOrders = unstable_cache(
  async (canteenId: string) => {
    const today = new Date().toISOString().split("T")[0];
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
  },
  ["today-orders"],
  { tags: [getGlobalTag("orders")], revalidate: 15 },
);

// ─── Overview stats ───────────────────────────────────────────────
export const getStaffOverviewStats = unstable_cache(
  async (canteenId: string) => {
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
  },
  ["staff-overview-stats"],
  { tags: [getGlobalTag("orders")], revalidate: 15 },
);

// ─── Verify QR code ───────────────────────────────────────────────
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
export const getTodayMenu = unstable_cache(
  async (canteenId: string) => {
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
  },
  ["today-menu"],
  { tags: [getGlobalTag("menu-items")], revalidate: 60 },
);

// ─── Inventory ────────────────────────────────────────────────────
export const getCanteenInventory = unstable_cache(
  async (canteenId: string) => {
    return db.query.inventoryItemsTable.findMany({
      where: eq(inventoryItemsTable.canteenId, canteenId),
      orderBy: [inventoryItemsTable.name],
    });
  },
  ["canteen-inventory"],
  { tags: [getGlobalTag("inventory-items")] },
);
