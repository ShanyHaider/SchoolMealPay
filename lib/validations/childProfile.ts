import z from "zod";

const positiveWholeNumber = (v: string | undefined) =>
    !v || (Number.isInteger(parseFloat(v)) && parseFloat(v) >= 0);

export const profileSchema = z.object({
    dailyLimit: z
        .string()
        .optional()
        .refine(positiveWholeNumber, "Must be a whole number (PKR)"),
    weeklyLimit: z
        .string()
        .optional()
        .refine(positiveWholeNumber, "Must be a whole number (PKR)"),
    dietary: z.string().max(200, "Max 200 characters").optional(),
    medical: z.string().max(500, "Max 500 characters").optional(),
});