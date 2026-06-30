// ─── Enums ────────────────────────────────────────────────────────────────────
// Mirror the pgEnum values from the schema exactly.

export const MEAL_SLOTS = ["breakfast", "lunch", "snack"] as const;
export type MealSlot = (typeof MEAL_SLOTS)[number];

export const ITEM_CATEGORIES = [
  "breakfast",
  "lunch",
  "snack",
  "beverage",
] as const;
export type ItemCategory = (typeof ITEM_CATEGORIES)[number];

export const DAYS = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"] as const;

// ─── MenuItem ─────────────────────────────────────────────────────────────────
// Full shape of menuItemsTable. All nullable/defaulted columns are optional.

export interface MenuItem {
  id: string;
  canteenId: string;
  name: string;
  description?: string | null;
  price: number; // decimal → string from Drizzle
  category: ItemCategory;

  // Nutrition
  calories?: number | null;
  proteinG?: string | null; // decimal → string
  fiberG?: string | null;
  carbsG?: string | null;
  fatG?: string | null;

  // Dietary flags
  isVegetarian: boolean;
  isVegan: boolean;
  containsNuts: boolean;
  containsGluten: boolean;
  containsDairy: boolean;

  isAvailable: boolean;
  isSpecialOfDay: boolean;
  imageUrl?: string | null;

  createdAt?: Date | string | null;
  updatedAt?: Date | string | null;
}

// ─── DailyMenu ────────────────────────────────────────────────────────────────
// Full shape of dailyMenusTable.
// menuItem is the Drizzle `with: { menuItem: true }` relation — it returns the
// full MenuItem row minus canteenId (the relation join omits the FK column in
// the nested projection by default). We make the nested type a Pick so the
// type precisely matches what getDailyMenu actually returns.

export type DailyMenuMenuItem = Pick<
  MenuItem,
  | "id"
  | "name"
  | "price"
  | "category"
  | "calories"
  | "isVegetarian"
  | "isVegan"
  | "imageUrl"
>;

export interface DailyMenu {
  id: string;
  canteenId: string;
  menuItemId: string;
  menuDate: string; // date → string from Drizzle
  mealSlot: MealSlot;
  availableFrom?: string | null; // time → string
  availableUntil?: string | null;
  menuItem?: DailyMenuMenuItem;
}

// ─── Canteen ──────────────────────────────────────────────────────────────────
// Minimal shape used by the schedule tab canteen switcher.

export interface Canteen {
  id: string;
  name: string;
}

// ─── Helpers ──────────────────────────────────────────────────────────────────

export const TODAY = (() => {
  const d = new Date();
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
})();

export function getDayDates(weekStart: string): string[] {
  return Array.from({ length: 7 }, (_, i) => {
    const d = new Date(weekStart + "T00:00:00");
    d.setDate(d.getDate() + i);
    // Use local date parts instead of toISOString() which shifts to UTC
    const year = d.getFullYear();
    const month = String(d.getMonth() + 1).padStart(2, "0");
    const day = String(d.getDate()).padStart(2, "0");
    return `${year}-${month}-${day}`;
  });
}

export function buildScheduleMap(
  dailyMenus: DailyMenu[],
): Record<string, Record<string, DailyMenu[]>> {
  const map: Record<string, Record<string, DailyMenu[]>> = {};
  for (const dm of dailyMenus) {
    if (!map[dm.menuDate]) map[dm.menuDate] = {};
    if (!map[dm.menuDate][dm.mealSlot]) map[dm.menuDate][dm.mealSlot] = [];
    map[dm.menuDate][dm.mealSlot].push(dm);
  }
  return map;
}

// ─── Shared input style ───────────────────────────────────────────────────────

export const inputStyle = {
  background: "var(--bg-secondary)",
  border: "1px solid var(--border-input)",
  borderRadius: 8,
  color: "var(--text-primary)",
  fontSize: 13,
  padding: "8px 12px",
  width: "100%",
  outline: "none",
  fontFamily: "inherit",
} as React.CSSProperties;
