import { decimal, integer, pgTable, varchar } from "drizzle-orm/pg-core";
import { id, createdAt, updatedAt } from "../schemaHelpers";

// Reference nutrition targets used for comparison reports (SRS-185).
// Seeded with national/WHO standards. Admins can add custom targets.
// ageGroupMin/Max in years — e.g. 5–10, 11–14, 15–18.
export const nutritionTargetsTable = pgTable("nutrition_targets", {
  id,
  label: varchar().notNull(), // e.g. "WHO Primary School (5–10)"
  ageGroupMin: integer("age_group_min"),
  ageGroupMax: integer("age_group_max"),
  dailyCalories: integer("daily_calories"),
  dailyProteinG: decimal("daily_protein_g", { precision: 6, scale: 2 }),
  dailyFiberG: decimal("daily_fiber_g", { precision: 6, scale: 2 }),
  dailyCarbsG: decimal("daily_carbs_g", { precision: 6, scale: 2 }),
  dailyFatG: decimal("daily_fat_g", { precision: 6, scale: 2 }),
  source: varchar(), // e.g. "WHO 2023", "Pakistan NNS"
  isDefault: varchar("is_default").notNull().default("false"),
  createdAt,
  updatedAt,
});
