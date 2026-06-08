import { z } from "zod";

export const schoolProfileSchema = z.object({
    name: z.string().min(1, "School name is required").max(100),
    address: z.string().max(200).optional().nullable(),
    city: z.string().max(100).optional().nullable(),
    phone: z
        .string()
        .regex(/^[+\d\s\-()]{7,20}$/, "Invalid phone number")
        .optional()
        .nullable()
        .or(z.literal("")),
    email: z.string().email("Invalid email address").optional().nullable().or(z.literal("")),
    logoUrl: z.string().url("Invalid URL").optional().nullable().or(z.literal("")),
    primaryColor: z
        .string()
        .regex(/^#[0-9A-Fa-f]{6}$/, "Must be a valid hex colour e.g. #1a2b3c")
        .optional()
        .nullable(),
    timezone: z.string().min(1, "Timezone is required"),
    academicYear: z
        .string()
        .regex(/^\d{4}-\d{4}$/, "Format must be YYYY-YYYY e.g. 2025-2026")
        .optional()
        .nullable()
        .or(z.literal(""))
        .superRefine((val, ctx) => {
            if (!val || val === "") return;
            const [start, end] = val.split("-").map(Number);
            if (end !== start + 1) {
                ctx.addIssue({
                    code: z.ZodIssueCode.custom,
                    message: "End year must be exactly one year after start year",
                });
            }
        }),
    schoolType: z.enum(["primary", "secondary", "both"]).optional().nullable(),
});

export type SchoolProfileInput = z.infer<typeof schoolProfileSchema>;


export const updateSpendingLimitSchema = z.object({
    studentId: z.string().min(1, "Student ID is required."),
    dailySpendingLimit: z
        // Zod v4: use `error` instead of `invalid_type_error`
        .number({ error: "Spending limit must be a number." })
        .min(10, "Daily spending limit must be at least $10.")
        .max(200, "Daily spending limit cannot exceed $200."),
});

export type UpdateSpendingLimitInput = z.infer<typeof updateSpendingLimitSchema>;


export const createOrderPayloadSchema = z.object({
    studentId: z.string().min(1, "Student ID is required."),
    canteenId: z.string().min(1, "Please select a canteen."),
    orderDate: z
        .string()
        .regex(/^\d{4}-\d{2}-\d{2}$/, "Order date must be in YYYY-MM-DD format."),
    // Zod v4: z.literal() only accepts `message` or `error`, not `errorMap`
    paymentMethod: z.literal("wallet", { message: "Only wallet payment is supported." }),
    items: z
        .array(
            z.object({
                menuItemId: z.string().min(1, "Menu item ID is required."),
                quantity: z
                    // Zod v4: use `error` instead of `invalid_type_error`
                    .number({ error: "Quantity must be a number." })
                    .int("Quantity must be a whole number.")
                    .min(1, "Quantity must be at least 1."),
            })
        )
        .min(1, "Your cart is empty. Please add at least one item before ordering."),
});

export type CreateOrderPayloadInput = z.infer<typeof createOrderPayloadSchema>;