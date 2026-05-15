"use server";

import { db } from "@/drizzle/db";
import {
  canteensTable,
  menuItemsTable,
  dailyMenusTable,
  inventoryItemsTable,
  inventoryUsageLogsTable,
} from "@/drizzle/schema";
import { eq } from "drizzle-orm";
import {
  revalidateCanteenCache,
  revalidateMenuItemCache,
  revalidateDailyMenuCache,
  revalidateInventoryCache,
  revalidateInventoryLogCache,
} from "@/lib/cacheRevalidation";

// ─── Canteens ──────────────────────────────────────────────────

export async function createCanteen(
  canteen: typeof canteensTable.$inferInsert,
) {
  const [created] = await db.insert(canteensTable).values(canteen).returning();

  revalidateCanteenCache(created.id);
  return created;
}

export async function updateCanteen(
  canteenId: string,
  updates: Partial<typeof canteensTable.$inferInsert>,
) {
  await db
    .update(canteensTable)
    .set({ ...updates, updatedAt: new Date() })
    .where(eq(canteensTable.id, canteenId));

  revalidateCanteenCache(canteenId);
}

// ─── Menu Items ────────────────────────────────────────────────

export async function createMenuItem(item: typeof menuItemsTable.$inferInsert) {
  const [created] = await db.insert(menuItemsTable).values(item).returning();

  revalidateMenuItemCache(created.id, created.canteenId);
  return created;
}

export async function updateMenuItem(
  menuItemId: string,
  canteenId: string,
  updates: Partial<typeof menuItemsTable.$inferInsert>,
) {
  await db
    .update(menuItemsTable)
    .set({ ...updates, updatedAt: new Date() })
    .where(eq(menuItemsTable.id, menuItemId));

  revalidateMenuItemCache(menuItemId, canteenId);
}

export async function markItemOutOfStock(
  menuItemId: string,
  canteenId: string,
) {
  await db
    .update(menuItemsTable)
    .set({ isAvailable: false, updatedAt: new Date() })
    .where(eq(menuItemsTable.id, menuItemId));

  revalidateMenuItemCache(menuItemId, canteenId);
}

export async function setSpecialOfDay(
  menuItemId: string,
  canteenId: string,
  isSpecial: boolean,
) {
  await db
    .update(menuItemsTable)
    .set({ isSpecialOfDay: isSpecial, updatedAt: new Date() })
    .where(eq(menuItemsTable.id, menuItemId));

  revalidateMenuItemCache(menuItemId, canteenId);
}

// ─── Daily Menus ───────────────────────────────────────────────

export async function scheduleDailyMenu(
  entry: typeof dailyMenusTable.$inferInsert,
) {
  await db.insert(dailyMenusTable).values(entry).onConflictDoNothing(); // unique constraint handles duplicates

  revalidateDailyMenuCache(entry.canteenId!);
}

export async function removeDailyMenuEntry(
  dailyMenuId: string,
  canteenId: string,
) {
  await db.delete(dailyMenusTable).where(eq(dailyMenusTable.id, dailyMenuId));

  revalidateDailyMenuCache(canteenId);
}

// ─── Inventory ─────────────────────────────────────────────────

export async function createInventoryItem(
  item: typeof inventoryItemsTable.$inferInsert,
) {
  const [created] = await db
    .insert(inventoryItemsTable)
    .values(item)
    .returning();

  revalidateInventoryCache(created.id, created.canteenId);
  return created;
}

export async function adjustInventory(params: {
  inventoryItemId: string;
  canteenId: string;
  quantityChanged: number; // positive = add, negative = reduce
  reason: (typeof inventoryUsageLogsTable.$inferInsert)["reason"];
  orderId?: string;
  performedBy?: string;
}) {
  const {
    inventoryItemId,
    canteenId,
    quantityChanged,
    reason,
    orderId,
    performedBy,
  } = params;

  // Get current quantity
  const item = await db.query.inventoryItemsTable.findFirst({
    where: eq(inventoryItemsTable.id, inventoryItemId),
  });

  if (!item) throw new Error("Inventory item not found");

  const quantityBefore = parseFloat(item.quantity);
  const quantityAfter = quantityBefore + quantityChanged;

  if (quantityAfter < 0) throw new Error("Insufficient inventory");

  // Update stock level
  await db
    .update(inventoryItemsTable)
    .set({
      quantity: quantityAfter.toString(),
      updatedAt: new Date(),
    })
    .where(eq(inventoryItemsTable.id, inventoryItemId));

  // Append log entry
  await db.insert(inventoryUsageLogsTable).values({
    canteenId,
    inventoryItemId,
    orderId: orderId ?? null,
    performedBy: performedBy ?? null,
    reason,
    quantityBefore: quantityBefore.toString(),
    quantityChanged: quantityChanged.toString(),
    quantityAfter: quantityAfter.toString(),
  });

  revalidateInventoryCache(inventoryItemId, canteenId);
  revalidateInventoryLogCache(canteenId);
}
