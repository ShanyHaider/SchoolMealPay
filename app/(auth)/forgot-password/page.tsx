"use client";

import Link from "next/link";
import { useState, useEffect } from "react";
import { useSignIn } from "@clerk/nextjs";
import { useRouter } from "next/navigation";
import { useClerk } from "@clerk/nextjs";
import {
  AuthCard,
  AuthButton,
  AuthInput,
} from "@/app/(auth)/_components/AuthCard";

type Step = "email" | "code" | "password";

const RESEND_COOLDOWN = 60;

export default function ForgotPasswordPage() {
  const { signIn, fetchStatus } = useSignIn();
  const { setActive } = useClerk();
  const router = useRouter();

  const [step, setStep] = useState<Step>("email");
  const [email, setEmail] = useState("");
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [passwordMismatch, setPasswordMismatch] = useState(false);
  const [cooldown, setCooldown] = useState(0);

  const loading = fetchStatus === "fetching";

  useEffect(() => {
    if (cooldown <= 0) return;
    const t = setTimeout(() => setCooldown((c) => c - 1), 1000);
    return () => clearTimeout(t);
  }, [cooldown]);

  const sendCode = async (emailAddress: string) => {
    const { error: createError } = await signIn.create({
      identifier: emailAddress,
    });
    if (createError) {
      setErrorMessage(createError.longMessage ?? createError.message ?? "Something went wrong.");
      return false;
    }
    const { error: sendError } = await signIn.resetPasswordEmailCode.sendCode();
    if (sendError) {
      setErrorMessage(sendError.longMessage ?? sendError.message ?? "Failed to send code.");
      return false;
    }
    setCooldown(RESEND_COOLDOWN);
    return true;
  };

  const handleSendCode = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setErrorMessage(null);
    const emailAddress = (e.currentTarget.elements.namedItem("email") as HTMLInputElement).value;
    setEmail(emailAddress);
    const ok = await sendCode(emailAddress);
    if (ok) setStep("code");
  };

  const handleResend = async () => {
    if (cooldown > 0 || !email) return;
    setErrorMessage(null);
    await sendCode(email);
  };

  const handleVerifyCode = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setErrorMessage(null);
    const code = (e.currentTarget.elements.namedItem("resetCode") as HTMLInputElement).value;
    try {
      const { error } = await signIn.resetPasswordEmailCode.verifyCode({ code });
      if (error) {
        setErrorMessage(error.longMessage ?? error.message ?? "Invalid or expired code.");
        return;
      }
      setStep("password");
    } catch (err: any) {
      setErrorMessage(err?.errors?.[0]?.longMessage ?? "Something went wrong.");
    }
  };

  const handleSetPassword = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setErrorMessage(null);
    setPasswordMismatch(false);
    const form = e.currentTarget;
    const password = (form.elements.namedItem("newPassword") as HTMLInputElement).value;
    const confirmPassword = (form.elements.namedItem("confirmPassword") as HTMLInputElement).value;

    if (password !== confirmPassword) {
      setPasswordMismatch(true);
      return;
    }

    try {
      const { error } = await signIn.resetPasswordEmailCode.submitPassword({ password });
      if (error) {
        setErrorMessage(error.longMessage ?? error.message ?? "Failed to reset password.");
        return;
      }
      if (signIn.status === "complete") {
        await setActive({ session: signIn.createdSessionId });
        router.refresh();
        router.replace("/dashboard");
      }
    } catch (err: any) {
      setErrorMessage(err?.errors?.[0]?.longMessage ?? "Something went wrong.");
    }
  };

  if (step === "email") {
    return (
      <AuthCard title="Forgot password?" subtitle="Enter your email and we'll send you a reset code">
        <form className="space-y-4" onSubmit={handleSendCode}>
          <AuthInput id="email" type="email" placeholder="you@example.com" required />
          {errorMessage && <p className="text-xs" style={{ color: "#ef4444" }}>{errorMessage}</p>}
          <AuthButton type="submit" disabled={loading}>
            {loading ? "Sending…" : "Send reset code"}
          </AuthButton>
        </form>
        <p className="mt-4 text-center text-sm" style={{ color: "var(--text-muted)" }}>
          Remember your password?{" "}
          <Link href="/sign-in" className="font-medium" style={{ color: "var(--text-primary)" }}>
            Sign in
          </Link>
        </p>
      </AuthCard>
    );
  }

  if (step === "code") {
    return (
      <AuthCard
        title="Check your email"
        subtitle={`We sent a 6-digit code to ${email}`}
      >
        <form className="space-y-4" onSubmit={handleVerifyCode}>
          {/* key forces React to remount with empty value when step changes */}
          <AuthInput key="resetCode" id="resetCode" type="text" placeholder="Enter 6-digit code" required />
          {errorMessage && <p className="text-xs" style={{ color: "#ef4444" }}>{errorMessage}</p>}
          <AuthButton type="submit" disabled={loading}>
            {loading ? "Verifying…" : "Verify code"}
          </AuthButton>
        </form>

        <p className="mt-4 text-center text-sm" style={{ color: "var(--text-muted)" }}>
          Didn't receive it?{" "}
          {cooldown > 0 ? (
            <span style={{ color: "var(--text-muted)" }}>
              Resend in {cooldown}s
            </span>
          ) : (
            <button
              onClick={handleResend}
              disabled={loading}
              className="font-medium disabled:opacity-50"
              style={{ color: "var(--text-primary)" }}
            >
              Resend code
            </button>
          )}
        </p>
      </AuthCard>
    );
  }

  return (
    <AuthCard title="Choose a new password" subtitle="Make it strong and memorable">
      <form className="space-y-4" onSubmit={handleSetPassword}>
        <AuthInput id="newPassword" type="password" placeholder="New password" required />
        <AuthInput id="confirmPassword" type="password" placeholder="Confirm password" required />
        {passwordMismatch && <p className="text-xs" style={{ color: "#ef4444" }}>Passwords do not match.</p>}
        {errorMessage && <p className="text-xs" style={{ color: "#ef4444" }}>{errorMessage}</p>}
        <AuthButton type="submit" disabled={loading}>
          {loading ? "Resetting…" : "Reset password"}
        </AuthButton>
      </form>
    </AuthCard>
  );
}