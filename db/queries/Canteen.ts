import { db } from "@/drizzle/db";
import {
  canteensTable,
  menuItemsTable,
  dailyMenusTable,
  inventoryItemsTable,
} from "@/drizzle/schema";
import { and, eq } from "drizzle-orm";
import { cacheLife, cacheTag } from "next/cache";
import { getGlobalTag, getIdTag, getCanteenTag } from "@/lib/cache";

// ─── Canteens ──────────────────────────────────────────────────

// Replace getAllCanteens and getCanteenById in your queries file.
// Uses explicit `columns` on the nested with() to avoid Drizzle generating
// positional json_build_array instead of named-key objects — which happens
// when a table has two FKs to the same table (staffId + assignedBy → users).

export async function getAllCanteensAdmin() {
  "use cache";
  cacheLife("hours");
  cacheTag(getGlobalTag("canteens"));

  return db.query.canteensTable.findMany({
    orderBy: (t, { desc }) => desc(t.createdAt),
    with: {
      staffAssignments: {
        columns: {
          staffId: true,
          canteenId: true,
        },
        with: {
          staff: {
            columns: {
              id: true,
              name: true,
              email: true,
            },
          },
        },
      },
    },
  });
}

// Public-facing: active canteens only, same explicit columns
export async function getAllCanteens() {
  "use cache";
  cacheLife("hours");
  cacheTag(getGlobalTag("canteens"));

  return db.query.canteensTable.findMany({
    where: eq(canteensTable.isActive, true),
    with: {
      staffAssignments: {
        columns: {
          staffId: true,
          canteenId: true,
        },
        with: {
          staff: {
            columns: {
              id: true,
              name: true,
              email: true,
            },
          },
        },
      },
    },
  });
}

export async function getCanteenById(canteenId: string) {
  "use cache";
  cacheLife("hours");
  cacheTag(getGlobalTag("canteens"), getIdTag("canteens", canteenId));

  return db.query.canteensTable.findFirst({
    where: eq(canteensTable.id, canteenId),
    with: {
      staffAssignments: {
        columns: {
          staffId: true,
          canteenId: true,
        },
        with: {
          staff: {
            columns: {
              id: true,
              name: true,
              email: true,
            },
          },
        },
      },
    },
  });
}

// ─── Menu Items ────────────────────────────────────────────────

export async function getMenuItemsByCanteen(canteenId: string) {
  "use cache";
  cacheLife("minutes");
  cacheTag(getGlobalTag("menu-items"), getCanteenTag("menu-items", canteenId));
  return db.query.menuItemsTable.findMany({
    where: and(
      eq(menuItemsTable.canteenId, canteenId),
      eq(menuItemsTable.isAvailable, true),
    ),
  });
}

export async function getMenuItemById(menuItemId: string) {
  "use cache";
  cacheLife("minutes");
  cacheTag(getGlobalTag("menu-items"), getIdTag("menu-items", menuItemId));
  return db.query.menuItemsTable.findFirst({
    where: eq(menuItemsTable.id, menuItemId),
  });
}

// ─── Daily Menus ───────────────────────────────────────────────

export async function getDailyMenu(canteenId: string, date: string) {
  "use cache";
  cacheLife("minutes");
  cacheTag(getGlobalTag("daily-menus"), getCanteenTag("daily-menus", canteenId));
  return db.query.dailyMenusTable.findMany({
    where: and(
      eq(dailyMenusTable.canteenId, canteenId),
      eq(dailyMenusTable.menuDate, date),
    ),
    with: { menuItem: true },
  });
}

// ─── Inventory ─────────────────────────────────────────────────

export async function getInventoryByCanteen(canteenId: string) {
  "use cache";
  cacheLife("minutes");
  cacheTag(getGlobalTag("inventory-items"), getCanteenTag("inventory-items", canteenId));
  return db.query.inventoryItemsTable.findMany({
    where: eq(inventoryItemsTable.canteenId, canteenId),
  });
}

export async function getLowStockItems(canteenId: string) {
  "use cache";
  cacheLife("seconds");
  cacheTag(getGlobalTag("inventory-items"), getCanteenTag("inventory-items", canteenId));
  // Fetch all inventory and filter low stock in JS
  // since Drizzle doesn't support column-vs-column comparison natively
  return db.query.inventoryItemsTable
    .findMany({ where: eq(inventoryItemsTable.canteenId, canteenId) })
    .then((items) =>
      items.filter(
        (item) =>
          item.lowStockThreshold != null &&
          parseFloat(item.quantity) <= parseFloat(item.lowStockThreshold),
      ),
    );
}
