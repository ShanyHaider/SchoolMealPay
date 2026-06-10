"use client";

import Link from "next/link";
import { useState } from "react";
import { useSignIn } from "@clerk/nextjs";
import { useRouter } from "next/navigation";
import {
  AuthCard,
  AuthButton,
  AuthInput,
} from "@/app/(auth)/_components/AuthCard";

type Step = "email" | "code" | "password";

export default function ForgotPasswordPage() {
  const { signIn, fetchStatus } = useSignIn();
  const router = useRouter();

  const [step, setStep] = useState<Step>("email");
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [passwordMismatch, setPasswordMismatch] = useState(false);

  const loading = fetchStatus === "fetching";

  // ── Step 1: identify user & send reset code ──────────────
  const handleSendCode = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setErrorMessage(null);

    const emailAddress = (
      e.currentTarget.elements.namedItem("email") as HTMLInputElement
    ).value;

    try {
      const { error: createError } = await signIn.create({
        identifier: emailAddress,
      });

      if (createError) {
        setErrorMessage(
          createError.longMessage ??
          createError.message ??
          "Something went wrong.",
        );
        return;
      }

      const { error: sendError } =
        await signIn.resetPasswordEmailCode.sendCode();

      if (sendError) {
        setErrorMessage(
          sendError.longMessage ?? sendError.message ?? "Failed to send code.",
        );
        return;
      }

      setStep("code");
    } catch (err: any) {
      console.error("[ForgotPassword] caught error:", err);
      setErrorMessage(
        err?.errors?.[0]?.longMessage ??
        err?.errors?.[0]?.message ??
        "Something went wrong. Please try again.",
      );
    }
  };

  // ── Step 2: verify the code ───────────────────────────────
  const handleVerifyCode = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setErrorMessage(null);

    const code = (
      e.currentTarget.elements.namedItem("resetCode") as HTMLInputElement
    ).value;

    try {
      const { error: verifyError } =
        await signIn.resetPasswordEmailCode.verifyCode({ code });
      if (verifyError) {
        setErrorMessage(
          verifyError.longMessage ??
          verifyError.message ??
          "Invalid or expired code.",
        );
        return;
      }

      setStep("password");
    } catch (err: any) {
      setErrorMessage(
        err?.errors?.[0]?.longMessage ??
        err?.errors?.[0]?.message ??
        "Something went wrong. Please try again.",
      );
    }
  };

  // ── Step 3: set new password ──────────────────────────────
  const handleSetPassword = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setErrorMessage(null);
    setPasswordMismatch(false);

    const form = e.currentTarget;
    const password = (
      form.elements.namedItem("newPassword") as HTMLInputElement
    ).value;
    const confirmPassword = (
      form.elements.namedItem("confirmPassword") as HTMLInputElement
    ).value;

    if (password !== confirmPassword) {
      setPasswordMismatch(true);
      return;
    }

    try {
      const { error: submitError } =
        await signIn.resetPasswordEmailCode.submitPassword({ password });
      if (submitError) {
        setErrorMessage(
          submitError.longMessage ??
          submitError.message ??
          "Failed to reset password.",
        );
        return;
      }

      if (signIn.status === "complete") {
        await signIn.finalize({
          navigate: ({ decorateUrl }) => router.push(decorateUrl("/dashboard")),
        });
      }
    } catch (err: any) {
      setErrorMessage(
        err?.errors?.[0]?.longMessage ??
        err?.errors?.[0]?.message ??
        "Something went wrong. Please try again.",
      );
    }
  };

  // ── Step 1 UI: enter email ────────────────────────────────
  if (step === "email") {
    return (
      <AuthCard
        title="Forgot password?"
        subtitle="Enter your email and we'll send you a reset code"
      >
        <form className="auth-form" onSubmit={handleSendCode}>
          <AuthInput
            id="email"
            type="email"
            placeholder="you@example.com"
            required
          />

          {errorMessage && <p className="auth-error">{errorMessage}</p>}

          <AuthButton type="submit" disabled={loading}>
            {loading ? "Sending…" : "Send reset code"}
          </AuthButton>
        </form>

        <p className="auth-footer">
          Remember your password? <Link href="/sign-in">Sign in</Link>
        </p>
      </AuthCard>
    );
  }

  // ── Step 2 UI: enter code ─────────────────────────────────
  if (step === "code") {
    return (
      <AuthCard
        title="Check your email"
        subtitle="We sent a 6-digit code to your email address"
      >
        <form className="auth-form" onSubmit={handleVerifyCode}>
          <AuthInput
            id="resetCode"
            type="text"
            placeholder="Enter 6-digit code"
            required
          />

          {errorMessage && <p className="auth-error">{errorMessage}</p>}

          <AuthButton type="submit" disabled={loading}>
            {loading ? "Verifying…" : "Verify code"}
          </AuthButton>
        </form>

        <p className="auth-footer">
          Didn't receive it?{" "}
          <button className="auth-link-btn" onClick={() => setStep("email")}>
            Try again
          </button>
        </p>
      </AuthCard>
    );
  }

  // ── Step 3 UI: set new password ───────────────────────────
  return (
    <AuthCard
      title="Choose a new password"
      subtitle="Make it strong and memorable"
    >
      <form className="auth-form" onSubmit={handleSetPassword}>
        <AuthInput
          id="newPassword"
          type="password"
          placeholder="••••••••"
          required
        />
        <AuthInput
          id="confirmPassword"
          type="password"
          placeholder="••••••••"
          required
        />

        {passwordMismatch && (
          <p className="auth-error">Passwords do not match.</p>
        )}
        {errorMessage && <p className="auth-error">{errorMessage}</p>}

        <AuthButton type="submit" disabled={loading}>
          {loading ? "Resetting…" : "Reset password"}
        </AuthButton>
      </form>
    </AuthCard>
  );
}
