import type { NutritionAverages } from "@/types/nutritionTypes";
import type { NutritionTargets } from "@/db/actions/Nutrition";

export type MenuItem = {
  id: string;
  name: string;
  description: string | null;
  price: number;
  category: string;
  calories: number | null;
  isVegetarian: boolean;
  isAvailable: boolean;
  isSpecialOfDay: boolean;
};

export type Student = {
  id: string;
  name: string;
  imageUrl: string | null;
};

export type Canteen = {
  id: string;
  name: string;
  location: string | null;
};

export type CartItem = {
  menuItemId: string;
  name: string;
  price: number;
  quantity: number;
};

export type LimitWarning = {
  message: string;
  type: "DAILY_LIMIT_EXCEEDED" | "WEEKLY_LIMIT_EXCEEDED";
};

export interface MenuClientProps {
  canteens: Canteen[];
  menuItems: MenuItem[];
  students: Student[];
  parentId: string;
  selectedCanteenId: string;
  selectedDate: string;
  today: string;
  menuByDate: Record<string, { id: string; name: string; price: number }[]>;
  nutritionByChild?: Record<
    string,
    { avg: NutritionAverages; targets: NutritionTargets }
  >;
}
