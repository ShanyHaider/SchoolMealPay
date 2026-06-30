export const ALL_ALLERGENS = [
    "nuts",
    "gluten",
    "dairy",
    "eggs",
    "soy",
    "shellfish",
    "fish",
    "sesame",
] as const;

export type Allergen = (typeof ALL_ALLERGENS)[number];

export const ALLERGEN_ICONS: Record<Allergen, string> = {
    nuts: "🥜",
    gluten: "🌾",
    dairy: "🥛",
    eggs: "🥚",
    soy: "🫘",
    shellfish: "🦐",
    fish: "🐟",
    sesame: "⚪",
};

export const ORDER_STATUS_CONFIG: Record<string, { label: string; className: string }> = {
    pending: { label: "Pending", className: "bg-amber-500/10 text-amber-600 border-amber-500/20" },
    ready: { label: "Ready", className: "bg-blue-500/10 text-blue-600 border-blue-500/20" },
    delivered: { label: "Collected", className: "bg-green-500/10 text-green-600 border-green-500/20" },
    cancelled: { label: "Cancelled", className: "bg-zinc-100 text-zinc-500 border-zinc-200 dark:bg-zinc-800 dark:text-zinc-400 dark:border-zinc-700" },
};