import Stripe from "stripe";

// Singleton — import this everywhere instead of new Stripe() each time.
// This prevents exhausting connections under load.
export const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!, {
  apiVersion: "2026-04-22.dahlia",
  typescript: true,
});
