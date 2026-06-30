"use server";

import { db } from "@/drizzle/db";
import {
  canteensTable,
  menuItemsTable,
  dailyMenusTable,
  inventoryItemsTable,
  canteenStaffAssignmentsTable,
} from "@/drizzle/schema";
import { and, eq } from "drizzle-orm";
import {
  revalidateCanteenCache,
  revalidateMenuItemCache,
  revalidateDailyMenuCache,
  revalidateInventoryCache,
  revalidateCanteenStaffCache,
} from "@/lib/cacheRevalidation";
import { revalidatePath } from "next/cache";
import { assertRole } from "@/lib/guards/serverGuards";
import {
  CreateInventoryItemInput,
  createInventoryItemSchema,
  CreateMenuItemInput,
  createMenuItemSchema,
  ScheduleDailyMenuInput,
  scheduleDailyMenuSchema,
  updateInventoryQuantitySchema,
  UpdateMenuItemInput,
  updateMenuItemSchema,
} from "@/lib/validations/validators";
import { MealSlot } from "@/types/menuTypes";

// ─── Canteens ──────────────────────────────────────────────────

export async function createCanteen(
  canteen: typeof canteensTable.$inferInsert,
) {
  const [created] = await db.insert(canteensTable).values(canteen).returning();

  revalidateCanteenCache(created.id);
  revalidatePath("/school-admin/canteen");

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
  revalidatePath("/school-admin/canteen");
}

export async function deleteCanteen(id: string) {
  await assertRole(["school_admin"]);

  // Remove staff assignments first (FK cascade would handle it, but being
  // explicit keeps the revalidation calls accurate).
  await db.transaction(async (tx) => {
    const assignments = await tx.query.canteenStaffAssignmentsTable.findMany({
      where: eq(canteenStaffAssignmentsTable.canteenId, id),
    });

    if (assignments.length > 0) {
      await tx
        .delete(canteenStaffAssignmentsTable)
        .where(eq(canteenStaffAssignmentsTable.canteenId, id));

      for (const a of assignments) {
        revalidateCanteenStaffCache(id, a.staffId);
      }
    }

    await tx.delete(canteensTable).where(eq(canteensTable.id, id));
  });

  revalidateCanteenCache(id);
}

// ─── Menu Items ────────────────────────────────────────────────

export async function createMenuItem(raw: CreateMenuItemInput) {
  await assertRole(["school_admin"]);
  const data = createMenuItemSchema.parse(raw);

  const [created] = await db
    .insert(menuItemsTable)
    .values({
      ...data,
      price: Number(data.price),
    })
    .returning();
  revalidateMenuItemCache(created.id, created.canteenId);
}

export async function updateMenuItem(id: string, raw: UpdateMenuItemInput) {
  await assertRole(["school_admin"]);
  const data = updateMenuItemSchema.parse(raw);

  const existing = await db.query.menuItemsTable.findFirst({
    where: eq(menuItemsTable.id, id),
  });

  await db
    .update(menuItemsTable)
    .set({
      ...data,
      price: data.price !== undefined ? Number(data.price) : undefined,
      updatedAt: new Date(),
    })
    .where(eq(menuItemsTable.id, id));

  revalidateMenuItemCache(id, existing?.canteenId ?? "");
}

export async function deleteMenuItem(id: string) {
  await assertRole(["school_admin"]);

  const existing = await db.query.menuItemsTable.findFirst({
    where: eq(menuItemsTable.id, id),
  });

  await db.delete(menuItemsTable).where(eq(menuItemsTable.id, id));
  revalidateMenuItemCache(id, existing?.canteenId ?? "");
}

// ─── Daily Menus ───────────────────────────────────────────────

export async function scheduleDailyMenu(raw: ScheduleDailyMenuInput) {
  await assertRole(["school_admin", "canteen_staff"]);
  const data = scheduleDailyMenuSchema.parse(raw);

  await db.insert(dailyMenusTable).values(data).onConflictDoNothing();
  await revalidateDailyMenuCache(data.canteenId);
}

export async function removeDailyMenu(
  canteenId: string,
  menuItemId: string,
  menuDate: string,
  mealSlot: string,
) {
  await assertRole(["school_admin", "canteen_staff"]);

  const result = await db
    .delete(dailyMenusTable)
    .where(
      and(
        eq(dailyMenusTable.canteenId, canteenId),
        eq(dailyMenusTable.menuItemId, menuItemId),
        eq(dailyMenusTable.menuDate, menuDate),
        eq(dailyMenusTable.mealSlot, mealSlot as MealSlot),
      ),
    )
    .returning();

  if (result.length === 0) {
    throw new Error(
      `removeDailyMenu: no row found for ${menuDate} ${mealSlot} ${menuItemId}`,
    );
  }

  await revalidateDailyMenuCache(canteenId);
}

// ─── Inventory ─────────────────────────────────────────────────

export async function createInventoryItem(raw: CreateInventoryItemInput) {
  await assertRole(["school_admin", "canteen_staff"]);
  const data = createInventoryItemSchema.parse(raw);

  const [created] = await db
    .insert(inventoryItemsTable)
    .values(data)
    .returning();
  revalidateInventoryCache(created.id, created.canteenId);
}

export async function updateInventoryQuantity(id: string, quantity: string) {
  await assertRole(["school_admin", "canteen_staff"]);
  const { quantity: validated } = updateInventoryQuantitySchema.parse({
    quantity,
  });

  const existing = await db.query.inventoryItemsTable.findFirst({
    where: eq(inventoryItemsTable.id, id),
  });

  await db
    .update(inventoryItemsTable)
    .set({ quantity: validated, updatedAt: new Date() })
    .where(eq(inventoryItemsTable.id, id));

  if (existing) revalidateInventoryCache(id, existing.canteenId);
}

export async function updateInventoryItem(
  id: string,
  data: { name: string; unit: string; lowStockThreshold?: string },
) {
  await assertRole(["school_admin", "canteen_staff"]);

  const existing = await db.query.inventoryItemsTable.findFirst({
    where: eq(inventoryItemsTable.id, id),
  });

  await db
    .update(inventoryItemsTable)
    .set({
      name: data.name,
      unit: data.unit,
      lowStockThreshold: data.lowStockThreshold ?? null,
      updatedAt: new Date(),
    })
    .where(eq(inventoryItemsTable.id, id));

  if (existing) revalidateInventoryCache(id, existing.canteenId);
}
