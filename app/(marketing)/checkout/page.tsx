// app/(marketing)/checkout/page.tsx
// Landing page after sign-up from pricing section.
// Reads tier + cycle from search params and auto-triggers Stripe checkout.

import { auth } from "@clerk/nextjs/server";
import { redirect } from "next/navigation";
import { getUserFromDb } from "@/features/users/queries";

interface Props {
  searchParams: Promise<{ tier?: string; cycle?: string }>;
}

export default async function CheckoutRedirectPage({ searchParams }: Props) {
  await connection();
  const { userId } = await auth();
  if (!userId) redirect("/sign-in");

  const { tier, cycle } = await searchParams;

  if (!tier) redirect("/");

  // Wait for webhook to create the DB user — poll with a small delay
  const dbUser = await getUserFromDb(userId);
  if (!dbUser) {
    // Webhook hasn't fired yet — refresh after 2s
    return <CheckoutWaiting tier={tier} cycle={cycle ?? "monthly"} />;
  }

  // User exists — hand off to client component that fires the checkout fetch
  return <Suspense
    fallback={
      <div className="flex min-h-screen items-center justify-center">
        <Loader2 size={24} className="animate-spin" style={{ color: "var(--text-muted)" }} />
      </div>
    }>
    <CheckoutTrigger tier={tier} cycle={cycle ?? "monthly"} />;
  </Suspense>
}

// ─── Waiting state (webhook not fired yet) ────────────────────────────────
function CheckoutWaiting({ tier, cycle }: { tier: string; cycle: string }) {
  return (
    <html>
      <head>
        {/* Meta refresh — retries this page every 2 seconds until webhook fires */}
        <meta
          httpEquiv="refresh"
          content={`2;url=/checkout?tier=${tier}&cycle=${cycle}`}
        />
      </head>
      <body style={{ margin: 0 }}>
        <div
          style={{
            display: "flex",
            flexDirection: "column",
            alignItems: "center",
            justifyContent: "center",
            height: "100vh",
            gap: "16px",
            fontFamily: "system-ui, sans-serif",
            background: "var(--bg-primary, #fff)",
          }}
        >
          <div
            style={{
              width: 32,
              height: 32,
              border: "3px solid #e5e7eb",
              borderTop: "3px solid #111",
              borderRadius: "50%",
              animation: "spin 0.8s linear infinite",
            }}
          />
          <p style={{ fontSize: 14, color: "#6b7280", margin: 0 }}>
            Setting up your account…
          </p>
          <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
        </div>
      </body>
    </html>
  );
}

// ─── Checkout trigger (client component) ─────────────────────────────────
import CheckoutTrigger from "./_components/CheckoutTrigger"; import { Suspense } from "react";
import { Loader2 } from "lucide-react";
import { connection } from "next/server";

