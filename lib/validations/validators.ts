// lib/validators/index.ts
//
// Single source of truth for ALL form/action validation schemas.
// Import these in BOTH client forms (for react-hook-form) and
// server actions (for authoritative re-validation).
//
// Rule: server actions must ALWAYS call schema.parse() or schema.safeParse()
// on incoming data — never trust the client even if the form validated first.

import { z } from "zod";

// ─── Shared primitives ─────────────────────────────────────────────────────

const uuidField = z.string().uuid("Invalid ID format");

// Decimal fields come in as string from form inputs but need to be
// valid numbers. Transform keeps the string type for DB (drizzle decimal cols).
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

// ─── School Profile ────────────────────────────────────────────────────────


// ─── Classes ──────────────────────────────────────────────────────────────

export const createClassSchema = z.object({
    grade: z
        .string()
        .min(1, "Grade is required")
        .max(10, "Grade too long — max 10 characters"),
    section: z
        .string()
        .min(1, "Section is required")
        .max(10, "Section too long — max 10 characters"),
});

export const updateClassSchema = createClassSchema.partial();

export type CreateClassInput = z.infer<typeof createClassSchema>;
export type UpdateClassInput = z.infer<typeof updateClassSchema>;

// ─── Students ─────────────────────────────────────────────────────────────

export const allergenEnum = z.enum([
    "nuts",
    "gluten",
    "dairy",
    "eggs",
    "soy",
    "shellfish",
    "fish",
    "sesame",
]);

export const createStudentSchema = z.object({
    name: z.string().min(1, "Full name is required"),
    studentCode: z.string().min(1, "Student code is required"),
    classId: z.string().uuid().optional().nullable(),
    imageUrl: z.string().url("Invalid image URL layout format").or(z.string().length(0)).optional().nullable(),
    allergenIds: z.array(z.string()),
});

export const updateStudentSchema = z.object({
    name: z.string().min(1, "Full name is required").optional(),
    classId: z.string().uuid().optional().nullable(),
    imageUrl: z.string().url("Invalid image URL layout format").or(z.string().length(0)).optional().nullable(),
    orderingEnabled: z.boolean().optional(),
});

export type CreateStudentInput = z.infer<typeof createStudentSchema>;
export type UpdateStudentInput = z.infer<typeof updateStudentSchema>;

// ─── Child profile (parental spending / dietary) ──────────────────────────

export const childProfileSchema = z.object({
    studentId: uuidField,
    dietaryPreferences: z.string().max(500).optional().nullable(),
    medicalNotes: z.string().max(500).optional().nullable(),
    dailySpendingLimit: nonNegativeDecimalField("Daily limit").optional().nullable(),
    weeklySpendingLimit: nonNegativeDecimalField("Weekly limit").optional().nullable(),
    approvalThreshold: nonNegativeDecimalField("Approval threshold").optional().nullable(),
});

export type ChildProfileInput = z.infer<typeof childProfileSchema>;

// ─── Canteens ─────────────────────────────────────────────────────────────

export const createCanteenSchema = z.object({
    name: z.string().min(1, "Canteen name is required").max(100),
    location: z.string().max(200).optional().nullable(),
    operatingHours: z
        .string()
        .max(100, "Operating hours too long")
        .optional()
        .nullable(),
    capacity: z
        .coerce
        .number()
        .int("Capacity must be a whole number")
        .positive("Capacity must be greater than zero")
        .optional()
        .nullable(),
});

export const updateCanteenSchema = createCanteenSchema
    .extend({
        isActive: z.boolean().optional(),
    })
    .partial();

export type CreateCanteenInput = z.infer<typeof createCanteenSchema>;
export type UpdateCanteenInput = z.infer<typeof updateCanteenSchema>;

// ─── Menu Items ───────────────────────────────────────────────────────────

export const createMenuItemSchema = z.object({
    canteenId: uuidField,
    name: z.string().min(1, "Name is required").max(100),
    description: z.string().max(500).optional().nullable(),
    price: positiveDecimalField("Price"),
    category: z.enum(["breakfast", "lunch", "snack", "beverage"]),
    calories: z
        .coerce
        .number()
        .int("Calories must be a whole number")
        .nonnegative("Calories cannot be negative")
        .optional()
        .nullable(),
    proteinG: nonNegativeDecimalField("Protein").optional().nullable(),
    carbsG: nonNegativeDecimalField("Carbs").optional().nullable(),
    fatG: nonNegativeDecimalField("Fat").optional().nullable(),
    fiberG: nonNegativeDecimalField("Fiber").optional().nullable(),
    isVegetarian: z.boolean().default(false),
    isVegan: z.boolean().default(false),
    containsNuts: z.boolean().default(false),
    containsGluten: z.boolean().default(false),
    containsDairy: z.boolean().default(false),
    imageUrl: z.string().url("Invalid image URL").optional().nullable().or(z.literal("")),
});

export const updateMenuItemSchema = createMenuItemSchema.partial().omit({ canteenId: true });

export type CreateMenuItemInput = z.infer<typeof createMenuItemSchema>;
export type UpdateMenuItemInput = z.infer<typeof updateMenuItemSchema>;

// ─── Daily Menu Scheduling ────────────────────────────────────────────────

export const scheduleDailyMenuSchema = z.object({
    canteenId: uuidField,
    menuItemId: uuidField,
    menuDate: z
        .string()
        .regex(/^\d{4}-\d{2}-\d{2}$/, "Date must be YYYY-MM-DD"),
    mealSlot: z.enum(["breakfast", "lunch", "snack"]),
    availableFrom: z
        .string()
        .regex(/^\d{2}:\d{2}(:\d{2})?$/, "Invalid time format HH:MM")
        .optional()
        .nullable(),
    availableUntil: z
        .string()
        .regex(/^\d{2}:\d{2}(:\d{2})?$/, "Invalid time format HH:MM")
        .optional()
        .nullable(),
});

export type ScheduleDailyMenuInput = z.infer<typeof scheduleDailyMenuSchema>;

// ─── Inventory ────────────────────────────────────────────────────────────

export const createInventoryItemSchema = z.object({
    canteenId: uuidField,
    name: z.string().min(1, "Item name is required").max(100),
    unit: z.string().min(1, "Unit is required").max(20),
    quantity: nonNegativeDecimalField("Quantity").optional(),
    lowStockThreshold: nonNegativeDecimalField("Low stock threshold").optional().nullable(),
});

export const updateInventoryQuantitySchema = z.object({
    quantity: nonNegativeDecimalField("Quantity"),
});

export type CreateInventoryItemInput = z.infer<typeof createInventoryItemSchema>;
export type UpdateInventoryQuantityInput = z.infer<typeof updateInventoryQuantitySchema>;

// ─── Orders ───────────────────────────────────────────────────────────────

export const createOrderSchema = z.object({
    studentId: uuidField,
    canteenId: uuidField,
    orderDate: z
        .string()
        .regex(/^\d{4}-\d{2}-\d{2}$/, "Order date must be YYYY-MM-DD"),
    paymentMethod: z.enum(["wallet", "stripe"]).default("wallet"),
    notes: z.string().max(500).optional().nullable(),
    items: z
        .array(
            z.object({
                menuItemId: uuidField,
                quantity: z
                    .coerce
                    .number()
                    .int("Quantity must be a whole number")
                    .positive("Quantity must be at least 1"),
            }),
        )
        .min(1, "Order must contain at least one item"),
});

export type CreateOrderInput = z.infer<typeof createOrderSchema>;

// ─── Parent / Auth ────────────────────────────────────────────────────────

export const linkParentChildSchema = z.object({
    studentCode: z
        .string()
        .min(1, "Student code is required")
        .transform((v) => v.trim().toUpperCase()),
});

export const verifyQrCodeSchema = z.object({
    orderId: uuidField.optional().nullable(),
    verificationToken: z.string().min(1, "Verification token is required"),
});

export type LinkParentChildInput = z.infer<typeof linkParentChildSchema>;
export type VerifyQrCodeInput = z.infer<typeof verifyQrCodeSchema>;

// ─── System Admin ─────────────────────────────────────────────────────────

export const updateStudentLimitSchema = z.object({
    studentLimit: z
        .coerce
        .number()
        .int("Must be a whole number")
        .min(1, "Limit must be at least 1")
        .max(50000, "Limit cannot exceed 50,000"),
});

export type UpdateStudentLimitInput = z.infer<typeof updateStudentLimitSchema>;