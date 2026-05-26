// app/(marketing)/checkout/_components/CheckoutTrigger.tsx
"use client";

import { useEffect, useState } from "react";

interface Props {
  tier: string;
  cycle: string;
}

export default function CheckoutTrigger({ tier, cycle }: Props) {
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    // Auto-fire checkout as soon as this component mounts
    async function startCheckout() {
      try {
        const res = await fetch("/api/stripe/checkout", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ tier, cycle }),
        });

        const data = await res.json();

        if (!res.ok) {
          setError(data.error ?? "Checkout failed. Please try again.");
          return;
        }

        if (data.url) {
          window.location.href = data.url;
        }
      } catch (err) {
        setError("Something went wrong. Please go back and try again.");
      }
    }

    startCheckout();
  }, [tier, cycle]);

  if (error) {
    return (
      <div
        style={{
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          justifyContent: "center",
          height: "100vh",
          gap: "16px",
          fontFamily: "system-ui, sans-serif",
        }}
      >
        <p style={{ fontSize: 14, color: "#ef4444" }}>{error}</p>
        <a
          href="/#pricing"
          style={{
            fontSize: 13,
            color: "#6b7280",
            textDecoration: "underline",
          }}
        >
          Go back to pricing
        </a>
      </div>
    );
  }

  return (
    <div
      style={{
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        justifyContent: "center",
        height: "100vh",
        gap: "16px",
        fontFamily: "system-ui, sans-serif",
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
        Redirecting to checkout…
      </p>
      <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
    </div>
  );
}
