// lib/validators/index.ts  — UPDATED SECTION: Canteens
// Only the canteen schemas changed; everything else is unchanged.
// Replace the "─── Canteens ─────" block in your existing validators/index.ts

import { z } from "zod";

// ─── Shared primitives ─────────────────────────────────────────────────────

const uuidField = z.string().uuid("Invalid ID format");

const decimalField = (label: string) =>
    z
        .union([z.string(), z.number()])
        .transform((v) => String(v))
        .refine((v) => !isNaN(parseFloat(v)) && isFinite(Number(v)), {
            message: `${label} must be a valid number`,
        });

const positiveDecimalField = (label: string) =>
    decimalField(label).refine((v) => parseFloat(v) > 0, {
        message: `${label} must be greater than zero`,
    });

const nonNegativeDecimalField = (label: string) =>
    decimalField(label).refine((v) => parseFloat(v) >= 0, {
        message: `${label} must be zero or more`,
    });

// ─── Canteens ─────────────────────────────────────────────────────────────

// HH:MM time string validator
// lib/validators/index.ts — UPDATED CANTEEN SECTION
// Replace the "─── Canteens ─────" block in your existing validators/index.ts

// ─── Canteens ─────────────────────────────────────────────────────────────

// lib/validators/index.ts — UPDATED CANTEEN SECTION
// Replace the "─── Canteens ─────" block in your existing validators/index.ts

// ─── Canteens ─────────────────────────────────────────────────────────────

const timeField = z
    .string()
    .regex(/^\d{2}:\d{2}$/, "Time must be HH:MM")
    .optional()
    .nullable();

// Shared cross-field time validation — reused by both schemas via superRefine.
// superRefine signature is (data, ctx), not (ctx, data).
function refineOperatingHours<
    T extends { operatingFrom?: string | null; operatingUntil?: string | null },
>(d: T, ctx: z.RefinementCtx) {
    const hasFrom = !!d.operatingFrom;
    const hasUntil = !!d.operatingUntil;

    if (hasFrom !== hasUntil) {
        ctx.addIssue({
            code: z.ZodIssueCode.custom,
            message: "Provide both opening and closing times, or neither",
            path: ["operatingUntil"],
        });
        return;
    }

    if (d.operatingFrom && d.operatingUntil && d.operatingFrom >= d.operatingUntil) {
        ctx.addIssue({
            code: z.ZodIssueCode.custom,
            message: "Closing time must be after opening time",
            path: ["operatingUntil"],
        });
    }
}

// Shared fields between create and update.
const canteenBaseSchema = z.object({
    location: z.string().max(200).optional().nullable(),
    operatingFrom: timeField,
    operatingUntil: timeField,
    capacity: z
        .coerce
        .number()
        .int("Capacity must be a whole number")
        .positive("Capacity must be greater than zero")
        .optional()
        .nullable(),
});

export const createCanteenSchema = canteenBaseSchema
    .extend({
        name: z.string().min(1, "Canteen name is required").max(100),
    })
    .superRefine(refineOperatingHours);

export const updateCanteenSchema = canteenBaseSchema
    .extend({
        name: z.string().min(1, "Canteen name is required").max(100).optional(),
        isActive: z.boolean().optional(),
    })
    .superRefine(refineOperatingHours);

export type CreateCanteenInput = z.infer<typeof createCanteenSchema>;
export type UpdateCanteenInput = z.infer<typeof updateCanteenSchema>;


// lib/validators/staff.ts

export const inviteStaffSchema = z.object({
    name: z.string().min(2, "Name must be at least 2 characters"),
    email: z.string().email("Invalid email address"),
    phone: z
        .string()
        .regex(/^\+?[0-9\s\-()]{7,15}$/, "Invalid phone number")
        .optional()
        .or(z.literal("")),
    canteenId: z.string().uuid("Invalid canteen").optional().or(z.literal("")),
});

export const menuItemFormSchema = z.object({
    name: z.string().min(1, "Name is required").max(100),
    description: z.string().max(500).optional(),
    price: z.string().min(1, "Price is required"),
    category: z.enum(["breakfast", "lunch", "snack", "beverage"]),
    calories: z.string().optional(),
    proteinG: z.string().optional(),
    carbsG: z.string().optional(),
    fatG: z.string().optional(),
    fiberG: z.string().optional(),
    isVegetarian: z.boolean(),
    isVegan: z.boolean(),
});

export type InviteStaffInput = z.infer<typeof inviteStaffSchema>;
export type MenuItemFormValues = z.infer<typeof menuItemFormSchema>;