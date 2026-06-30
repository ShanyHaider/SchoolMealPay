// app/(dashboard)/parent/constants/index.ts

// ─── Spending Limit Slider ────────────────────────────────────────────────────

/** Pull these from your school's config or env at runtime if they vary per school */
export const SPENDING_SLIDER = {
    MIN: 100,   // PKR
    MAX: 5000,  // PKR
    STEP: 50,   // PKR
} as const;

// ─── Order Status Config ──────────────────────────────────────────────────────

export const ORDER_STATUS_CONFIG: Record<string, { label: string; style: string }> = {
    pending: {
        label: "Pending",
        style: "bg-amber-500/10 text-amber-600 border-amber-500/20",
    },
    preparing: {
        label: "Preparing",
        style: "bg-blue-500/10 text-blue-600 border-blue-500/20",
    },
    ready: {
        label: "Ready",
        style: "bg-green-500/10 text-green-600 border-green-500/20",
    },
    delivered: {
        label: "Collected",
        style:
            "bg-zinc-100 dark:bg-zinc-800 text-zinc-500 border-zinc-200 dark:border-zinc-700",
    },
    cancelled: {
        label: "Cancelled",
        style: "bg-red-500/10 text-red-600 border-red-500/20",
    },
};

const ALLERGEN_COLORS: Record<string, string> = {
    nuts: "bg-zinc-100 text-zinc-900 border-zinc-200 dark:bg-zinc-800 dark:text-zinc-100 dark:border-zinc-700",
    gluten: "bg-zinc-100 text-zinc-900 border-zinc-200 dark:bg-zinc-800 dark:text-zinc-100 dark:border-zinc-700",
    dairy: "bg-zinc-100 text-zinc-900 border-zinc-200 dark:bg-zinc-800 dark:text-zinc-100 dark:border-zinc-700",
    eggs: "bg-zinc-100 text-zinc-900 border-zinc-200 dark:bg-zinc-800 dark:text-zinc-100 dark:border-zinc-700",
    soy: "bg-zinc-100 text-zinc-900 border-zinc-200 dark:bg-zinc-800 dark:text-zinc-100 dark:border-zinc-700",
    shellfish: "bg-zinc-100 text-zinc-900 border-zinc-200 dark:bg-zinc-800 dark:text-zinc-100 dark:border-zinc-700",
    fish: "bg-zinc-100 text-zinc-900 border-zinc-200 dark:bg-zinc-800 dark:text-zinc-100 dark:border-zinc-700",
    sesame: "bg-zinc-100 text-zinc-900 border-zinc-200 dark:bg-zinc-800 dark:text-zinc-100 dark:border-zinc-700",
};

// ─── Quick Actions ────────────────────────────────────────────────────────────

import {
    UtensilsCrossed,
    Salad,
    Wallet,
    UserPlus,
} from "lucide-react";

export const QUICK_ACTIONS = [
    {
        label: "Order a meal",
        href: "/parent/menu",
        icon: UtensilsCrossed,
        color: "text-blue-500 bg-blue-500/10 border-blue-500/20",
    },
    {
        label: "View nutrition",
        href: "/parent/nutrition",
        icon: Salad,
        color: "text-green-500 bg-green-500/10 border-green-500/20",
    },
    {
        label: "Spending limits",
        href: "/parent/spending",
        icon: Wallet,
        color: "text-amber-500 bg-amber-500/10 border-amber-500/20",
    },
    {
        label: "Link a child",
        href: "/parent/children/link",
        icon: UserPlus,
        color: "text-purple-500 bg-purple-500/10 border-purple-500/20",
    },
] as const;

// ─── Sidebar Nav ──────────────────────────────────────────────────────────────

import {
    LayoutDashboard,
    Users,
    ShoppingBag,
} from "lucide-react";

export type ParentFeature =
    | "hasNutritionDashboard"
    | "hasAiMealPlanning"
    | "hasHealthTrends"
    | "hasPrioritySupport";

export type NavItem = {
    label: string;
    href: string;
    icon: React.ElementType;
    exact?: boolean;
    requiredFeature?: ParentFeature;
    premium?: boolean;
};

export const NAV_ITEMS: NavItem[] = [
    { label: "Dashboard", href: "/parent", icon: LayoutDashboard, exact: true },
    { label: "Children", href: "/parent/children", icon: Users },
    { label: "Menu", href: "/parent/menu", icon: UtensilsCrossed },
    { label: "Orders", href: "/parent/orders", icon: ShoppingBag },
    {
        label: "Nutrition",
        href: "/parent/nutrition",
        icon: Salad,
        requiredFeature: "hasNutritionDashboard",
        premium: true,
    },
    { label: "Wallet", href: "/parent/wallet", icon: Wallet },
];

// ─── Breadcrumb Map ───────────────────────────────────────────────────────────

export const BREADCRUMB_MAP: Record<string, string> = {
    "/parent": "Dashboard",
    "/parent/children": "Children",
    "/parent/menu": "Menu",
    "/parent/orders": "Orders",
    "/parent/nutrition": "Nutrition",
    "/parent/spending": "Spending",
    "/parent/notifications": "Notifications",
    "/parent/settings": "Settings",
};