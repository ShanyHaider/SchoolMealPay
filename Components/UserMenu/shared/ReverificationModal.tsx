"use client";

import React, { useState } from "react";
import { useUser } from "@clerk/nextjs";
import {
  X,
  ShieldCheck,
  Mail,
  Eye,
  EyeOff,
  Loader2,
  AlertCircle,
  CheckCircle2,
  RefreshCw,
  ArrowLeft,
} from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";

type Strategy = "password" | "email_otp";

interface ReverificationModalProps {
  onComplete: (
    payload:
      | { strategy: "password"; password: string }
      | { strategy: "email_code"; code: string },
  ) => Promise<void>;
  onCancel: () => void;
}

function mapError(err: unknown): string {
  const e = err as { errors?: { message?: string }[]; message?: string };
  const raw = e?.errors?.[0]?.message ?? e?.message ?? "Verification failed.";
  if (raw.toLowerCase().includes("incorrect"))
    return "Incorrect. Please try again.";
  if (raw.toLowerCase().includes("expired"))
    return "Code expired — request a new one.";
  if (raw.toLowerCase().includes("invalid"))
    return "Invalid. Please check and try again.";
  return raw;
}

// ─── Password form ────────────────────────────────────────────────────────────

function PasswordForm({
  onSubmit,
  onSwitchToOtp,
}: {
  onSubmit: (password: string) => Promise<void>;
  onSwitchToOtp: () => void;
}) {
  const [password, setPassword] = useState("");
  const [show, setShow] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!password || loading) return;
    setLoading(true);
    setError(null);
    try {
      await onSubmit(password);
    } catch (err) {
      setError(mapError(err));
      setLoading(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div className="space-y-1.5">
        <label className="text-[11px] font-bold text-zinc-500 dark:text-zinc-400">
          Password
        </label>
        <div className="relative">
          <input
            type={show ? "text" : "password"}
            value={password}
            disabled={loading}
            onChange={(e) => {
              setPassword(e.target.value);
              setError(null);
            }}
            placeholder="Enter your password"
            autoComplete="current-password"
            autoFocus
            className="w-full rounded-xl border border-zinc-200 bg-zinc-50/50 px-3.5 py-2.5 pr-10 text-xs font-semibold text-zinc-900 focus:outline-none focus:ring-2 focus:ring-zinc-300 dark:focus:ring-zinc-700 dark:border-zinc-800 dark:bg-zinc-900 dark:text-white placeholder:font-normal placeholder:text-zinc-400 disabled:opacity-60"
          />
          <button
            type="button"
            disabled={loading}
            onClick={() => setShow((v) => !v)}
            className="absolute right-3 top-1/2 -translate-y-1/2 text-zinc-400 hover:text-zinc-600 dark:hover:text-zinc-300 disabled:opacity-40"
          >
            {show ?
              <EyeOff size={13} />
            : <Eye size={13} />}
          </button>
        </div>
        <AnimatePresence>
          {error && (
            <motion.p
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: "auto" }}
              exit={{ opacity: 0, height: 0 }}
              className="text-[11px] text-red-500 font-medium flex items-center gap-1.5 pt-0.5"
            >
              <AlertCircle size={11} /> {error}
            </motion.p>
          )}
        </AnimatePresence>
      </div>

      <button
        type="submit"
        disabled={loading || !password}
        className="w-full flex h-10 items-center justify-center gap-2 rounded-xl bg-zinc-950 text-xs font-bold text-white hover:bg-zinc-900 dark:bg-white dark:text-zinc-950 dark:hover:bg-zinc-100 disabled:opacity-40 disabled:cursor-not-allowed cursor-pointer transition-all"
      >
        {loading ?
          <Loader2 size={13} className="animate-spin" />
        : <ShieldCheck size={13} />}
        {loading ? "Verifying…" : "Continue"}
      </button>

      <button
        type="button"
        disabled={loading}
        onClick={onSwitchToOtp}
        className="w-full text-center text-[11px] text-zinc-400 hover:text-zinc-600 dark:hover:text-zinc-300 transition-colors cursor-pointer disabled:opacity-40"
      >
        Use email verification instead →
      </button>
    </form>
  );
}

// ─── OTP form ─────────────────────────────────────────────────────────────────
// For reverification: the parent already triggered the code send before rendering this.
// This component just collects and submits the code.

function OtpForm({
  email,
  onSubmit,
  onResend,
  onBack,
  hasPassword,
}: {
  email: string;
  onSubmit: (code: string) => Promise<void>;
  onResend: () => Promise<void>;
  onBack?: () => void;
  hasPassword: boolean;
}) {
  const [code, setCode] = useState("");
  const [loading, setLoading] = useState(false);
  const [resending, setResending] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);
  const [cooldown, setCooldown] = useState(0);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (code.length < 6 || loading || success) return;
    setLoading(true);
    setError(null);
    try {
      await onSubmit(code);
      setSuccess(true);
    } catch (err) {
      setError(mapError(err));
      setLoading(false);
    }
  };

  const handleResend = async () => {
    if (cooldown > 0 || resending) return;
    setResending(true);
    setError(null);
    try {
      await onResend();
      setCooldown(60);
      const iv = setInterval(
        () =>
          setCooldown((p) => {
            if (p <= 1) {
              clearInterval(iv);
              return 0;
            }
            return p - 1;
          }),
        1000,
      );
    } catch (err) {
      setError(mapError(err));
    } finally {
      setResending(false);
    }
  };

  return (
    <div className="space-y-4">
      {/* Email pill */}
      <div className="rounded-xl bg-zinc-50 dark:bg-zinc-900 border border-zinc-100 dark:border-zinc-800 px-4 py-3 flex items-center gap-2">
        <Mail size={12} className="text-zinc-400 shrink-0" />
        <p className="text-xs font-bold text-zinc-900 dark:text-white font-mono truncate">
          {email}
        </p>
      </div>

      <form onSubmit={handleSubmit} className="space-y-3">
        <div className="space-y-1.5">
          <label className="text-[11px] font-bold text-zinc-500 dark:text-zinc-400">
            Verification code
          </label>
          <input
            type="text"
            inputMode="numeric"
            pattern="[0-9]*"
            maxLength={6}
            disabled={loading || success}
            value={code}
            autoFocus
            onChange={(e) => {
              setCode(e.target.value.replace(/\D/g, ""));
              setError(null);
            }}
            placeholder="000000"
            className="w-full rounded-xl border border-zinc-200 bg-zinc-50/50 px-3.5 py-2.5 text-sm font-black tracking-[0.3em] text-zinc-900 focus:outline-none focus:ring-2 focus:ring-zinc-300 dark:focus:ring-zinc-700 dark:border-zinc-800 dark:bg-zinc-900 dark:text-white placeholder:tracking-normal placeholder:font-normal placeholder:text-zinc-400 text-center disabled:opacity-60"
          />
          <AnimatePresence>
            {error && (
              <motion.p
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: "auto" }}
                exit={{ opacity: 0, height: 0 }}
                className="text-[11px] text-red-500 font-medium flex items-center gap-1.5 pt-0.5"
              >
                <AlertCircle size={11} /> {error}
              </motion.p>
            )}
          </AnimatePresence>
        </div>

        {success ?
          <div className="flex items-center justify-center gap-2 h-10 rounded-xl bg-emerald-500/10 border border-emerald-500/20 text-xs font-bold text-emerald-600 dark:text-emerald-400">
            <CheckCircle2 size={13} /> Verified!
          </div>
        : <button
            type="submit"
            disabled={loading || code.length < 6}
            className="w-full flex h-10 items-center justify-center gap-2 rounded-xl bg-zinc-950 text-xs font-bold text-white hover:bg-zinc-900 dark:bg-white dark:text-zinc-950 dark:hover:bg-zinc-100 disabled:opacity-40 disabled:cursor-not-allowed cursor-pointer transition-all"
          >
            {loading ?
              <Loader2 size={13} className="animate-spin" />
            : <ShieldCheck size={13} />}
            {loading ? "Verifying…" : "Verify code"}
          </button>
        }
      </form>

      <div className="flex items-center justify-between">
        {hasPassword && onBack && (
          <button
            type="button"
            onClick={onBack}
            disabled={loading}
            className="flex items-center gap-1 text-[11px] text-zinc-400 hover:text-zinc-600 dark:hover:text-zinc-300 transition-colors cursor-pointer disabled:opacity-40"
          >
            <ArrowLeft size={11} /> Use password
          </button>
        )}
        <button
          type="button"
          onClick={handleResend}
          disabled={loading || resending || cooldown > 0}
          className="flex items-center gap-1 text-[11px] text-zinc-400 hover:text-zinc-600 dark:hover:text-zinc-300 transition-colors cursor-pointer disabled:opacity-40 ml-auto"
        >
          {resending ?
            <Loader2 size={11} className="animate-spin" />
          : <RefreshCw size={11} />}
          {cooldown > 0 ? `Resend in ${cooldown}s` : "Resend code"}
        </button>
      </div>
    </div>
  );
}

// ─── Modal shell ──────────────────────────────────────────────────────────────

export function ReverificationModal({
  onComplete,
  onCancel,
}: ReverificationModalProps) {
  const { user } = useUser();
  const hasPassword = user?.passwordEnabled ?? false;

  const [strategy, setStrategy] = useState<Strategy>(
    hasPassword ? "password" : "email_otp",
  );
  const [otpSent, setOtpSent] = useState(false);
  const [sending, setSending] = useState(false);
  const [sendError, setSendError] = useState<string | null>(null);

  const primaryEmail =
    user?.emailAddresses.find((e) => e.id === user.primaryEmailAddressId)
      ?.emailAddress ?? "";

  const handleSwitchToOtp = async () => {
    if (otpSent || sending) return;
    setSending(true);
    setSendError(null);
    try {
      // For reverification, trigger the email code via the user's primary email address.
      // Clerk's reverification sends via: user.prepareEmailAddressVerification is NOT
      // for reverification — reverification codes are sent by the parent action that
      // triggered this modal (e.g., a protected API route).
      // If you need to manually trigger: call your own API endpoint that wraps
      // clerk.users.createEmailAddressVerification() on the server side.
      //
      // For most reverification setups (SAF/step-up), the code is sent automatically
      // when the protected endpoint is hit. Just flip the UI:
      setOtpSent(true);
      setStrategy("email_otp");
    } catch (err) {
      const e = err as { message?: string };
      setSendError(e?.message ?? "Failed to send code.");
    } finally {
      setSending(false);
    }
  };

  // Resend for OTP form — same approach: call your server action or API route
  const handleResendOtp = async () => {
    // Implement by calling your backend reverification endpoint
    // e.g.: await fetch('/api/auth/reverify/send-code', { method: 'POST' })
  };

  const title =
    strategy === "password" ? "Verify it's you" : "Check your email";
  const subtitle =
    strategy === "password" ?
      "Enter your current password to continue."
    : "Enter the 6-digit verification code sent to your inbox.";

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 isolate">
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        onClick={onCancel}
        className="absolute inset-0 bg-black/50 backdrop-blur-md"
      />

      <motion.div
        initial={{ opacity: 0, scale: 0.96, y: 12 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        exit={{ opacity: 0, scale: 0.96, y: 12 }}
        transition={{ type: "spring", stiffness: 400, damping: 30 }}
        className="relative w-full max-w-sm rounded-3xl border border-zinc-200/80 bg-white dark:border-zinc-800/80 dark:bg-zinc-950 shadow-2xl overflow-hidden"
      >
        <div className="h-1 w-full bg-linear-to-r from-zinc-300 via-zinc-500 to-zinc-300 dark:from-zinc-700 dark:via-zinc-400 dark:to-zinc-700" />

        <button
          onClick={onCancel}
          className="absolute right-4 top-4 rounded-xl p-1.5 text-zinc-400 hover:bg-zinc-100 dark:hover:bg-zinc-900 transition-colors cursor-pointer z-10"
        >
          <X size={16} />
        </button>

        <AnimatePresence mode="wait">
          <motion.div
            key={strategy}
            initial={{ opacity: 0, x: strategy === "password" ? -10 : 10 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: strategy === "password" ? 10 : -10 }}
            className="p-7"
          >
            <div className="flex flex-col items-center text-center mb-6">
              <div className="mb-4 flex h-12 w-12 items-center justify-center rounded-2xl bg-zinc-100 dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800">
                {strategy === "password" ?
                  <ShieldCheck
                    size={22}
                    className="text-zinc-700 dark:text-zinc-300"
                  />
                : <Mail
                    size={22}
                    className="text-zinc-700 dark:text-zinc-300"
                  />
                }
              </div>
              <h3 className="text-base font-black tracking-tight text-zinc-950 dark:text-white">
                {title}
              </h3>
              <p className="text-[11px] text-zinc-400 dark:text-zinc-500 mt-1.5 leading-relaxed max-w-60">
                {subtitle}
              </p>
            </div>

            {strategy === "password" ?
              <>
                <PasswordForm
                  onSubmit={(password) =>
                    onComplete({ strategy: "password", password })
                  }
                  onSwitchToOtp={handleSwitchToOtp}
                />
                {sending && (
                  <p className="mt-2 text-center text-[11px] text-zinc-400 flex items-center justify-center gap-1">
                    <Loader2 size={11} className="animate-spin" /> Sending code…
                  </p>
                )}
                {sendError && (
                  <p className="mt-2 text-[11px] text-red-500 flex items-center gap-1.5">
                    <AlertCircle size={11} /> {sendError}
                  </p>
                )}
              </>
            : <OtpForm
                email={primaryEmail}
                onSubmit={(code) =>
                  onComplete({ strategy: "email_code", code })
                }
                onResend={handleResendOtp}
                onBack={hasPassword ? () => setStrategy("password") : undefined}
                hasPassword={hasPassword}
              />
            }
          </motion.div>
        </AnimatePresence>
      </motion.div>
    </div>
  );
}
