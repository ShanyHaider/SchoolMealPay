import { z } from "zod";

// ─── Domain types ─────────────────────────────────────────────────────────────

export type InventoryItem = {
    id: string;
    name: string;
    unit: string;
    quantity: string;
    lowStockThreshold: string | null;
    canteenId: string;
};

export type Canteen = {
    id: string;
    name: string;
    staffAssignments: { staff: { name: string } }[];
};

export type FilterType = "all" | "low" | "critical" | "healthy";

// ─── Constants ────────────────────────────────────────────────────────────────

export const UNITS = ["kg", "g", "L", "ml", "pcs", "boxes", "bags", "dozen"] as const;
export type UnitType = (typeof UNITS)[number];

// ─── Zod schemas ──────────────────────────────────────────────────────────────

export const addInventorySchema = z.object({
    name: z.string().min(1, "Item name is required").max(100),
    unit: z.enum(UNITS, { message: "Unit is required" }),
    quantity: z
        .string()
        .min(1, "Quantity is required")
        .refine((v) => !isNaN(parseFloat(v)) && parseFloat(v) >= 0, "Must be a valid number"),
    lowStockThreshold: z
        .string()
        .refine(
            (v) => v === "" || (!isNaN(parseFloat(v)) && parseFloat(v) >= 0),
            "Must be a valid number",
        )
        .optional(),
});

export const editInventorySchema = z.object({
    name: z.string().min(1, "Item name is required").max(100),
    unit: z.enum(UNITS, { message: "Unit is required" }),
    quantity: z
        .string()
        .min(1, "Quantity is required")
        .refine((v) => !isNaN(parseFloat(v)) && parseFloat(v) >= 0, "Must be a valid number"),
    lowStockThreshold: z
        .string()
        .refine(
            (v) => v === "" || (!isNaN(parseFloat(v)) && parseFloat(v) >= 0),
            "Must be a valid number",
        )
        .optional(),
});

export type AddInventoryValues = z.infer<typeof addInventorySchema>;
export type EditInventoryValues = z.infer<typeof editInventorySchema>;

// ─── Shared styles ────────────────────────────────────────────────────────────

export const inputStyle: React.CSSProperties = {
    background: "var(--bg-secondary)",
    border: "1px solid var(--border-input)",
    borderRadius: 8,
    color: "var(--text-primary)",
    fontSize: 14,
    padding: "9px 12px",
    width: "100%",
    outline: "none",
    fontFamily: "inherit",
};

export const cardStyle = {
    background: "var(--bg-card)",
    borderColor: "var(--border-card)",
    boxShadow: "var(--shadow-card)",
};