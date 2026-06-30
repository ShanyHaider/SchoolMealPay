import type { Allergen } from "@/constants/childProfileConstants";

export interface StudentData {
  id: string;
  name: string;
  studentCode: string;
  imageUrl?: string | null;
  orderingEnabled?: boolean;
  class?: { grade: string; section: string } | null;
  allergens: { allergen: Allergen }[];
  childProfile?: {
    dailySpendingLimit?: string | null;
    weeklySpendingLimit?: string | null;
    dietaryPreferences?: string | null;
    medicalNotes?: string | null;
  } | null;
}

export interface BlockedItem {
  id: string;
  menuItemId: string;
  menuItem?: { name: string } | null;
}

export interface RecentOrder {
  id: string;
  orderDate: string;
  status: string;
  totalAmount: string;
  items: { name: string; quantity: number }[];
}

export interface SpendingSummary {
  todaySpend: number;
  weeklySpend: number;
  dailyLimit: number | null;
  weeklyLimit: number | null;
}
