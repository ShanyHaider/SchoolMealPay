import { db } from "@/drizzle/db";
import {
  canteensTable,
  menuItemsTable,
  dailyMenusTable,
  inventoryItemsTable,
} from "@/drizzle/schema";
import { and, eq } from "drizzle-orm";
import { unstable_cache } from "next/cache";
import { getGlobalTag, getIdTag, getCanteenTag } from "@/lib/cache";

// ─── Canteens ──────────────────────────────────────────────────

export function getAllCanteens() {
  return unstable_cache(
    () =>
      db.query.canteensTable.findMany({
        where: eq(canteensTable.isActive, true),
        with: { staffAssignments: { with: { staff: true } } },
      }),
    [getGlobalTag("canteens")],
    { tags: [getGlobalTag("canteens")] },
  )();
}

export function getCanteenById(canteenId: string) {
  return unstable_cache(
    () =>
      db.query.canteensTable.findFirst({
        where: eq(canteensTable.id, canteenId),
        with: { staffAssignments: { with: { staff: true } } },
      }),
    [getIdTag("canteens", canteenId)],
    {
      tags: [getGlobalTag("canteens"), getIdTag("canteens", canteenId)],
    },
  )();
}

// ─── Menu Items ────────────────────────────────────────────────

export function getMenuItemsByCanteen(canteenId: string) {
  return unstable_cache(
    () =>
      db.query.menuItemsTable.findMany({
        where: and(
          eq(menuItemsTable.canteenId, canteenId),
          eq(menuItemsTable.isAvailable, true),
        ),
      }),
    [getCanteenTag("menu-items", canteenId)],
    {
      tags: [
        getGlobalTag("menu-items"),
        getCanteenTag("menu-items", canteenId),
      ],
    },
  )();
}

export function getMenuItemById(menuItemId: string) {
  return unstable_cache(
    () =>
      db.query.menuItemsTable.findFirst({
        where: eq(menuItemsTable.id, menuItemId),
      }),
    [getIdTag("menu-items", menuItemId)],
    {
      tags: [getGlobalTag("menu-items"), getIdTag("menu-items", menuItemId)],
    },
  )();
}

// ─── Daily Menus ───────────────────────────────────────────────

export function getDailyMenu(canteenId: string, date: string) {
  return unstable_cache(
    () =>
      db.query.dailyMenusTable.findMany({
        where: and(
          eq(dailyMenusTable.canteenId, canteenId),
          eq(dailyMenusTable.menuDate, date),
        ),
        with: { menuItem: true },
      }),
    [getCanteenTag("daily-menus", canteenId)],
    {
      tags: [
        getGlobalTag("daily-menus"),
        getCanteenTag("daily-menus", canteenId),
      ],
    },
  )();
}

// ─── Inventory ─────────────────────────────────────────────────

export function getInventoryByCanteen(canteenId: string) {
  return unstable_cache(
    () =>
      db.query.inventoryItemsTable.findMany({
        where: eq(inventoryItemsTable.canteenId, canteenId),
      }),
    [getCanteenTag("inventory-items", canteenId)],
    {
      tags: [
        getGlobalTag("inventory-items"),
        getCanteenTag("inventory-items", canteenId),
      ],
    },
  )();
}

export function getLowStockItems(canteenId: string) {
  return unstable_cache(
    () =>
      // Fetch all inventory and filter low stock in JS
      // since Drizzle doesn't support column-vs-column comparison natively
      db.query.inventoryItemsTable
        .findMany({ where: eq(inventoryItemsTable.canteenId, canteenId) })
        .then((items) =>
          items.filter(
            (item) =>
              item.lowStockThreshold != null &&
              parseFloat(item.quantity) <= parseFloat(item.lowStockThreshold),
          ),
        ),
    [getCanteenTag("inventory-items", canteenId)],
    {
      tags: [
        getGlobalTag("inventory-items"),
        getCanteenTag("inventory-items", canteenId),
      ],
    },
  )();
}
