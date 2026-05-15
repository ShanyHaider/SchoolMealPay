import {
  boolean,
  date,
  decimal,
  index,
  integer,
  pgEnum,
  pgTable,
  text,
  time,
  unique,
  uuid,
  varchar,
} from "drizzle-orm/pg-core";
import { id, createdAt, updatedAt } from "../schemaHelpers";
import { canteensTable } from "./canteens";

export const mealCategoryEnum = pgEnum("meal_category", [
  "breakfast",
  "lunch",
  "snack",
  "beverage",
]);

export const mealSlotEnum = pgEnum("meal_slot", [
  "breakfast",
  "lunch",
  "snack",
]);

// Core food item catalogue for a canteen.
// Nutrition data is stored here to power the AI engine (SRS-115).
export const menuItemsTable = pgTable("menu_items", {
  id,
  canteenId: uuid("canteen_id")
    .notNull()
    .references(() => canteensTable.id, { onDelete: "cascade" }),
  name: varchar().notNull(),
  description: text(),
  price: decimal({ precision: 10, scale: 2 }).notNull(),
  category: mealCategoryEnum().notNull(),

  // Nutrition tagging (SRS-115)
  calories: integer(),
  proteinG: decimal("protein_g", { precision: 6, scale: 2 }),
  fiberG: decimal("fiber_g", { precision: 6, scale: 2 }),
  carbsG: decimal("carbs_g", { precision: 6, scale: 2 }),
  fatG: decimal("fat_g", { precision: 6, scale: 2 }),

  // Category tagging (SRS-116)
  isVegetarian: boolean("is_vegetarian").notNull().default(false),
  isVegan: boolean("is_vegan").notNull().default(false),
  containsNuts: boolean("contains_nuts").notNull().default(false),
  containsGluten: boolean("contains_gluten").notNull().default(false),
  containsDairy: boolean("contains_dairy").notNull().default(false),

  isAvailable: boolean("is_available").notNull().default(true),
  isSpecialOfDay: boolean("is_special_of_day").notNull().default(false),
  imageUrl: varchar("image_url"),
  createdAt,
  updatedAt,
});

// Schedules which items are available on which dates and slots.
// Separating this from menu_items allows the same item on multiple days
// without duplication (SRS-112).
// FIX: added unique constraint — prevents the same item being scheduled
// to the same canteen/date/slot twice.
export const dailyMenusTable = pgTable(
  "daily_menus",
  {
    id,
    canteenId: uuid("canteen_id")
      .notNull()
      .references(() => canteensTable.id, { onDelete: "cascade" }),
    menuItemId: uuid("menu_item_id")
      .notNull()
      .references(() => menuItemsTable.id, { onDelete: "cascade" }),
    menuDate: date("menu_date").notNull(),
    mealSlot: mealSlotEnum("meal_slot").notNull(),
    availableFrom: time("available_from"),
    availableUntil: time("available_until"),
  },
  (t) => [
    unique().on(t.canteenId, t.menuItemId, t.menuDate, t.mealSlot),
    index("daily_menus_date_idx").on(t.canteenId, t.menuDate),
  ],
);

// Tracks raw ingredient stock (SRS-165 to SRS-170).
export const inventoryItemsTable = pgTable("inventory_items", {
  id,
  canteenId: uuid("canteen_id")
    .notNull()
    .references(() => canteensTable.id, { onDelete: "cascade" }),
  name: varchar().notNull(),
  quantity: decimal({ precision: 10, scale: 3 }).notNull().default("0"),
  unit: varchar().notNull(), // e.g. "kg", "litres", "pieces"
  lowStockThreshold: decimal("low_stock_threshold", {
    precision: 10,
    scale: 3,
  }),
  updatedAt,
});
