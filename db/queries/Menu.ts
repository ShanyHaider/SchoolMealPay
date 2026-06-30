import { db } from "@/drizzle/db";
import {
  dailyMenusTable,
  canteensTable,
  menuItemsTable,
} from "@/drizzle/schema";
import { eq, and, gte, lte } from "drizzle-orm";
import { cacheLife, cacheTag } from "next/cache";
import { getGlobalTag, getCanteenTag } from "@/lib/cache";

/**
 * Daily menu for a specific canteen on a specific date.
 * Used by parents when placing orders — shows what's available today.
 */
export async function getDailyMenuForParent(canteenId: string, date: string) {
  "use cache";
  cacheLife("minutes");
  cacheTag(
    getGlobalTag("daily-menus"),
    getCanteenTag("daily-menus", canteenId),
  );
  return db.query.dailyMenusTable.findMany({
    where: and(
      eq(dailyMenusTable.canteenId, canteenId),
      eq(dailyMenusTable.menuDate, date),
    ),
    with: {
      menuItem: true,
    },
    orderBy: [dailyMenusTable.mealSlot],
  });
}

/**
 * All active canteens — used in the parent ordering flow to select a canteen.
 */
export async function getActiveCanteens() {
  "use cache";
  cacheLife("hours");
  cacheTag(getGlobalTag("canteens"));
  return db.query.canteensTable.findMany({
    where: eq(canteensTable.isActive, true),
    columns: {
      id: true,
      name: true,
      location: true,
    },
  });
}

/**
 * Full menu item catalogue — used on admin menu page and parent browse page.
 */
export async function getAllMenuItemsCached() {
  "use cache";
  cacheLife("minutes");
  cacheTag(getGlobalTag("menu-items"));
  return db.query.menuItemsTable.findMany({
    where: eq(menuItemsTable.isAvailable, true),
    orderBy: [menuItemsTable.category, menuItemsTable.name],
  });
}

/**
 * Weekly menu for a canteen. Used on admin scheduling and parent "upcoming" view.
 */
export async function getWeeklyMenu(
  canteenId: string,
  startDate: string,
  endDate: string,
) {
  "use cache";
  cacheLife("minutes");
  cacheTag(
    getGlobalTag("daily-menus"),
    getCanteenTag("daily-menus", canteenId),
  );

  const result = await db.query.dailyMenusTable.findMany({
    where: and(
      eq(dailyMenusTable.canteenId, canteenId),
      gte(dailyMenusTable.menuDate, startDate),
      lte(dailyMenusTable.menuDate, endDate),
    ),
    with: {
      menuItem: {
        columns: {
          id: true,
          name: true,
          price: true,
          category: true,
          calories: true,
          isVegetarian: true,
          isVegan: true,
          imageUrl: true,
        },
      },
    },
    orderBy: [dailyMenusTable.menuDate, dailyMenusTable.mealSlot],
  });

  return result.map((row) => ({
    ...row,
    menuItem: {
      ...row.menuItem,
      price: Number(row.menuItem.price),
    },
  }));
}
