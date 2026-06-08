"use client";

import React, { useState } from "react";

import {
  X,
  Mail,
  ShieldCheck,
  Loader2,
  AlertCircle,
  CheckCircle2,
  RefreshCw,
} from "lucide-react";

import {
  motion,
  AnimatePresence,
} from "framer-motion";

interface ReverificationModalProps {
  onComplete: (payload: {
    code: string;
  }) => Promise<boolean>;

  onCancel: () => void;
}

function mapError(err: unknown): string {
  const e = err as {
    errors?: { message?: string }[];
    message?: string;
  };

  return (
    e?.errors?.[0]?.message ||
    e?.message ||
    "Verification failed."
  );
}

export function ReverificationModal({
  onComplete,
  onCancel,
}: ReverificationModalProps) {
  const [code, setCode] = useState("");

  const [loading, setLoading] =
    useState(false);

  const [success, setSuccess] =
    useState(false);

  const [error, setError] = useState<
    string | null
  >(null);

  const [cooldown, setCooldown] =
    useState(0);

  const [resending, setResending] =
    useState(false);

  const handleSubmit = async (
    e: React.FormEvent
  ) => {
    e.preventDefault();

    if (
      code.length < 6 ||
      loading ||
      success
    ) {
      return;
    }

    setLoading(true);
    setError(null);

    try {
      const verified =
        await onComplete({
          code,
        });

      if (verified) {
        setSuccess(true);
      } else {
        setError(
          "Verification failed."
        );
      }
    } catch (err) {
      setError(mapError(err));
    } finally {
      setLoading(false);
    }
  };

  const handleResend = async () => {
    if (cooldown > 0 || resending) {
      return;
    }

    setResending(true);

    try {
      setCooldown(60);

      const interval = setInterval(() => {
        setCooldown((prev) => {
          if (prev <= 1) {
            clearInterval(interval);
            return 0;
          }

          return prev - 1;
        });
      }, 1000);
    } finally {
      setResending(false);
    }
  };

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
        initial={{
          opacity: 0,
          scale: 0.96,
          y: 12,
        }}
        animate={{
          opacity: 1,
          scale: 1,
          y: 0,
        }}
        exit={{
          opacity: 0,
          scale: 0.96,
          y: 12,
        }}
        transition={{
          type: "spring",
          stiffness: 400,
          damping: 30,
        }}
        className="relative w-full max-w-sm rounded-3xl border border-zinc-200/80 bg-white dark:border-zinc-800/80 dark:bg-zinc-950 shadow-2xl overflow-hidden"
      >
        <div className="h-1 w-full bg-linear-to-r from-zinc-300 via-zinc-500 to-zinc-300 dark:from-zinc-700 dark:via-zinc-400 dark:to-zinc-700" />

        <button
          onClick={onCancel}
          className="absolute right-4 top-4 rounded-xl p-1.5 text-zinc-400 hover:bg-zinc-100 dark:hover:bg-zinc-900 transition-colors"
        >
          <X size={16} />
        </button>

        <AnimatePresence mode="wait">
          <motion.div
            initial={{
              opacity: 0,
              y: 8,
            }}
            animate={{
              opacity: 1,
              y: 0,
            }}
            exit={{
              opacity: 0,
              y: 8,
            }}
            className="p-7"
          >
            <div className="flex flex-col items-center text-center mb-6">
              <div className="mb-4 flex h-12 w-12 items-center justify-center rounded-2xl bg-zinc-100 dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800">
                <Mail
                  size={22}
                  className="text-zinc-700 dark:text-zinc-300"
                />
              </div>

              <h3 className="text-base font-black tracking-tight text-zinc-950 dark:text-white">
                Check your inbox
              </h3>

              <p className="text-[11px] text-zinc-400 dark:text-zinc-500 mt-1.5 leading-relaxed max-w-60">
                Enter the 6-digit
                verification code sent to
                your email.
              </p>
            </div>

            <form
              onSubmit={handleSubmit}
              className="space-y-4"
            >
              <div className="space-y-1.5">
                <label className="text-[11px] font-bold text-zinc-500 dark:text-zinc-400">
                  Verification code
                </label>

                <input
                  type="text"
                  inputMode="numeric"
                  pattern="[0-9]*"
                  maxLength={6}
                  autoFocus
                  disabled={
                    loading || success
                  }
                  value={code}
                  onChange={(e) => {
                    setCode(
                      e.target.value.replace(
                        /\D/g,
                        ""
                      )
                    );

                    setError(null);
                  }}
                  placeholder="000000"
                  className="w-full rounded-xl border border-zinc-200 bg-zinc-50/50 px-3.5 py-2.5 text-sm font-black tracking-[0.3em] text-zinc-900 focus:outline-none focus:ring-2 focus:ring-zinc-300 dark:focus:ring-zinc-700 dark:border-zinc-800 dark:bg-zinc-900 dark:text-white text-center"
                />

                <AnimatePresence>
                  {error && (
                    <motion.p
                      initial={{
                        opacity: 0,
                        height: 0,
                      }}
                      animate={{
                        opacity: 1,
                        height: "auto",
                      }}
                      exit={{
                        opacity: 0,
                        height: 0,
                      }}
                      className="text-[11px] text-red-500 font-medium flex items-center gap-1.5 pt-0.5"
                    >
                      <AlertCircle
                        size={11}
                      />
                      {error}
                    </motion.p>
                  )}
                </AnimatePresence>
              </div>

              {success ? (
                <div className="flex items-center justify-center gap-2 h-10 rounded-xl bg-emerald-500/10 border border-emerald-500/20 text-xs font-bold text-emerald-600 dark:text-emerald-400">
                  <CheckCircle2
                    size={13}
                  />
                  Verified!
                </div>
              ) : (
                <button
                  type="submit"
                  disabled={
                    loading ||
                    code.length < 6
                  }
                  className="w-full flex h-10 items-center justify-center gap-2 rounded-xl bg-zinc-950 text-xs font-bold text-white hover:bg-zinc-900 dark:bg-white dark:text-zinc-950 disabled:opacity-40"
                >
                  {loading ? (
                    <Loader2
                      size={13}
                      className="animate-spin"
                    />
                  ) : (
                    <ShieldCheck
                      size={13}
                    />
                  )}

                  {loading
                    ? "Verifying…"
                    : "Verify code"}
                </button>
              )}
            </form>

            <div className="flex justify-end mt-4">
              <button
                type="button"
                onClick={handleResend}
                disabled={
                  cooldown > 0 ||
                  resending
                }
                className="flex items-center gap-1 text-[11px] text-zinc-400 hover:text-zinc-600 dark:hover:text-zinc-300 transition-colors disabled:opacity-40"
              >
                {resending ? (
                  <Loader2
                    size={11}
                    className="animate-spin"
                  />
                ) : (
                  <RefreshCw size={11} />
                )}

                {cooldown > 0
                  ? `Resend in ${cooldown}s`
                  : "Resend code"}
              </button>
            </div>
          </motion.div>
        </AnimatePresence>
      </motion.div>
    </div>
  );
}