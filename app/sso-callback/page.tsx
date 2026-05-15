"use client";

import { useEffect } from "react";
import { useClerk } from "@clerk/nextjs";

export default function SSOCallback() {
  const { handleRedirectCallback } = useClerk();

  useEffect(() => {
    handleRedirectCallback({
      signInForceRedirectUrl: "/dashboard",
      signUpForceRedirectUrl: "/onboarding", // or "/dashboard" if same destination
    });
  }, [handleRedirectCallback]);

  return (
    <div
      style={{
        blockSize: "100vh",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        background: "var(--bg-secondary)",
      }}
    >
      <div style={{ textAlign: "center" }}>
        <div
          style={{
            inlineSize: 32,
            blockSize: 32,
            borderRadius: "50%",
            border: "2px solid var(--border-primary)",
            borderTopColor: "var(--text-primary)",
            animation: "spin 0.7s linear infinite",
            margin: "0 auto 16px",
          }}
        />
        <p style={{ fontSize: 14, color: "var(--text-secondary)", margin: 0 }}>
          Signing you in…
        </p>
      </div>
      <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
    </div>
  );
}
