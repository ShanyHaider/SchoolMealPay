import { createEnv } from "@t3-oss/env-nextjs";
import z from "zod";

export const env = createEnv({
  server: {
    DATABASE_URL: z.string().url(),
    CLERK_SECRET_KEY: z.string().min(1),
    CLERK_WEBHOOK_SIGNING_SECRET: z.string().min(1),

    BOOTSTRAP_ADMIN_EMAIL: z.string().email().optional(), // 👈

    // Stripe core
    STRIPE_SECRET_KEY: z.string().min(1),
    STRIPE_WEBHOOK_SECRET: z.string().min(1),
    STRIPE_CURRENCY: z.string().default("pkr"),

    // Parent Pro prices
    STRIPE_PARENT_PRO_MONTHLY_PRICE_ID: z.string().min(1),
    STRIPE_PARENT_PRO_ANNUAL_PRICE_ID: z.string().min(1),

    // School Premium prices
    STRIPE_SCHOOL_PREMIUM_MONTHLY_PRICE_ID: z.string().min(1),
    STRIPE_SCHOOL_PREMIUM_ANNUAL_PRICE_ID: z.string().min(1),
  },
  emptyStringAsUndefined: true,
  experimental__runtimeEnv: process.env,
});