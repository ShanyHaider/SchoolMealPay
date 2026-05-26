import { db } from "@/drizzle/db";
import {
  menuItemsTable,
  dailyMenusTable,
  canteensTable,
} from "@/drizzle/schema";
import { eq, and, gte, lte, isNull } from "drizzle-orm";
import { unstable_cache } from "next/cache";
import { getGlobalTag } from "@/lib/cache";

/**
 * Daily menu for a specific canteen on a specific date.
 * Used by parents when placing orders — shows what's available today.
 */
export const getDailyMenuForParent = unstable_cache(
  async (canteenId: string, date: string) => {
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
  },
  ["daily-menu-for-parent"],
  { tags: [getGlobalTag("menu-items")] },
);

/**
 * All active canteens — used in the parent ordering flow to select a canteen.
 */
export const getActiveCanteens = unstable_cache(
  async () => {
    return db.query.canteensTable.findMany({
      where: eq(canteensTable.isActive, true),
      columns: {
        id: true,
        name: true,
        location: true,
      },
    });
  },
  ["active-canteens"],
  { tags: [getGlobalTag("canteens")] },
);

/**
 * Full menu item catalogue — used on admin menu page and parent browse page.
 */
export const getAllMenuItemsCached = unstable_cache(
  async () => {
    return db.query.menuItemsTable.findMany({
      where: eq(menuItemsTable.isAvailable, true),
      orderBy: [menuItemsTable.category, menuItemsTable.name],
    });
  },
  ["all-menu-items-parent"],
  { tags: [getGlobalTag("menu-items")] },
);

/**
 * Weekly menu for a canteen. Used on admin scheduling and parent "upcoming" view.
 */
export const getWeeklyMenu = unstable_cache(
  async (canteenId: string, startDate: string, endDate: string) => {
    return db.query.dailyMenusTable.findMany({
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
            imageUrl: true,
          },
        },
      },
      orderBy: [dailyMenusTable.menuDate, dailyMenusTable.mealSlot],
    });
  },
  ["weekly-menu"],
  { tags: [getGlobalTag("menu-items")] },
);
