// app/(dashboard)/parent/types/index.ts

// ─── Child / Student ──────────────────────────────────────────────────────────

export type ChildLink = {
  id: string;
  status: string;
  student: Student;
};

export type Student = {
  id: string;
  name: string;
  studentCode: string;
  orderingEnabled: boolean;
  imageUrl: string | null;
  classId: string | null;
  class?: { grade: string; section: string } | null;
  childProfile?: ChildProfile | null;
  allergens: { allergen: string }[];
};

export type ChildProfile = {
  dailySpendingLimit: string | null;
  weeklySpendingLimit: string | null;
  dietaryPreferences: string | null;
  medicalNotes: string | null;
};

// ─── Orders ───────────────────────────────────────────────────────────────────

export type Order = {
  id: string;
  status: string | null;
  totalAmount: string;
  orderDate: string;
  studentId: string;
  orderItems: OrderItem[];
};

export type OrderItem = {
  id: string;
  quantity: number;
  menuItem: { name: string } | null;
};

export type MenuItem = {
  id: string;
  name: string;
  price: string;
  mealSlot: string;
};

export type CartEntry = {
  item: MenuItem;
  qty: number;
};

export type Cart = Record<string, CartEntry>;

// ─── Approvals ────────────────────────────────────────────────────────────────

export type Approval = {
  id: string;
  orderAmount: string;
  status: string;
  parentId: string;
  student: { name: string } | null;
  order: {
    id: string;
    orderItems: {
      id: string;
      quantity: number;
      menuItem: { name: string } | null;
    }[];
  } | null;
};

// ─── Canteen ──────────────────────────────────────────────────────────────────

export type Canteen = {
  id: string;
  name: string;
};

// ─── Stats ────────────────────────────────────────────────────────────────────

export type StatsRowProps = {
  childCount: number;
  activeOrderCount: number;
  monthlySpend: number;
  unreadCount: number;
  /** Stripe subscription status */
  subscriptionStatus: string | null | undefined;
  recentOrders?: Order[];
  children?: ChildLink[];
};

export type LimitWarning = {
  message: string;
  code: "DAILY_LIMIT_EXCEEDED" | "WEEKLY_LIMIT_EXCEEDED";
};
