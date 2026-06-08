"use client";

import React, { useState } from "react";
import { useUser } from "@clerk/nextjs";
import { Loader2, Plus, Trash2, X } from "lucide-react";
import { AnimatePresence } from "framer-motion";
import { InlineConfirm } from "../shared/InlineConfirm";

interface ConnectedAccountsProps {
  isLastFactor: boolean;
  onStatus: (type: "success" | "error" | "warning", text: string) => void;
  onNeedsReverification: (
    action: () => Promise<void>,
    successMsg: string,
  ) => void;
}

export function ConnectedAccounts({
  isLastFactor,
  onStatus,
  onNeedsReverification,
}: ConnectedAccountsProps) {
  const { user } = useUser();
  const [loadingKey, setLoadingKey] = useState<string | null>(null);
  const [confirmingDelete, setConfirmingDelete] = useState<string | null>(null);

  if (!user) return null;

  const handleConnectGoogle = async () => {
    setLoadingKey("connect-google");
    try {
      const res = await user.createExternalAccount({
        strategy: "oauth_google",
        redirectUrl: window.location.href,
      });
      const redirectUrl = (
        res as unknown as {
          verification?: { externalVerificationRedirectURL?: string };
        }
      )?.verification?.externalVerificationRedirectURL;

      if (redirectUrl) {
        window.location.href = redirectUrl;
      } else {
        onStatus(
          "error",
          "Could not initiate Google sign-in. Please try again.",
        );
        setLoadingKey(null);
      }
    } catch (err) {
      const e = err as { errors?: { message?: string }[]; message?: string };
      onStatus(
        "error",
        e?.errors?.[0]?.message ?? e?.message ?? "Failed to connect Google.",
      );
      setLoadingKey(null);
    }
    // Don't reset loadingKey on success — we're navigating away
  };

  const handleDisconnect = (accountId: string) => {
    const account = user.externalAccounts.find((a) => a.id === accountId);
    if (!account) return;
    setLoadingKey(`delete-${accountId}`);
    onNeedsReverification(async () => {
      await account.destroy();
      setConfirmingDelete(null);
    }, "Account disconnected.");
    setLoadingKey(null);
  };

  const isDeleting = (id: string) => loadingKey === `delete-${id}`;

  const providerIcon: Record<string, string> = {
    google: "G",
    github: "GH",
    facebook: "FB",
    microsoft: "MS",
  };

  return (
    <div className="space-y-3">
      <h4 className="text-xs font-bold text-zinc-900 dark:text-white">
        Connected accounts
      </h4>

      <div className="space-y-1.5">
        {user.externalAccounts.length === 0 ?
          <p className="text-[11px] text-zinc-400 dark:text-zinc-500 italic px-1">
            No connected accounts.
          </p>
        : user.externalAccounts.map((account) => {
            const isOnlyFactor =
              isLastFactor && user.externalAccounts.length === 1;
            const deletingThis = isDeleting(account.id);
            const initials =
              providerIcon[account.provider.toLowerCase()] ??
              account.provider[0].toUpperCase();

            return (
              <div
                key={account.id}
                className="rounded-xl bg-zinc-50 dark:bg-zinc-900/40 overflow-hidden"
              >
                <div className="flex items-center justify-between px-3.5 py-2.5">
                  <div className="flex items-center gap-2.5">
                    {/* Provider badge */}
                    <div className="h-6 w-6 rounded-md bg-zinc-200 dark:bg-zinc-800 flex items-center justify-center shrink-0">
                      <span className="text-[9px] font-black text-zinc-600 dark:text-zinc-300">
                        {initials}
                      </span>
                    </div>
                    <div>
                      <span className="capitalize font-bold text-xs text-zinc-800 dark:text-zinc-200">
                        {account.provider}
                      </span>
                      <p className="text-zinc-400 dark:text-zinc-500 font-mono text-[10px] truncate max-w-48">
                        {account.username ?? account.emailAddress}
                      </p>
                    </div>
                  </div>
                  <button
                    onClick={() =>
                      isOnlyFactor ? null : (
                        setConfirmingDelete(
                          confirmingDelete === account.id ? null : account.id,
                        )
                      )
                    }
                    disabled={isOnlyFactor || deletingThis}
                    className="rounded-lg p-1.5 text-zinc-400 hover:text-red-500 hover:bg-red-500/10 disabled:opacity-30 disabled:cursor-not-allowed transition-colors cursor-pointer"
                    title={
                      isOnlyFactor ?
                        "Add another login method first"
                      : "Disconnect"
                    }
                  >
                    {deletingThis ?
                      <Loader2 size={12} className="animate-spin" />
                    : confirmingDelete === account.id ?
                      <X size={12} />
                    : <Trash2 size={12} />}
                  </button>
                </div>
                <AnimatePresence>
                  {confirmingDelete === account.id && (
                    <div className="px-3.5 pb-3">
                      <InlineConfirm
                        message="Disconnect this account?"
                        onConfirm={() => handleDisconnect(account.id)}
                        onCancel={() => setConfirmingDelete(null)}
                        loading={deletingThis}
                      />
                    </div>
                  )}
                </AnimatePresence>
              </div>
            );
          })
        }
      </div>

      <button
        type="button"
        disabled={loadingKey === "connect-google"}
        onClick={handleConnectGoogle}
        className="flex h-9 items-center gap-1.5 rounded-xl border border-zinc-200 px-3 text-xs font-bold hover:bg-zinc-50 dark:border-zinc-800 dark:hover:bg-zinc-900 disabled:opacity-40 disabled:cursor-not-allowed cursor-pointer transition-opacity"
      >
        {loadingKey === "connect-google" ?
          <Loader2 size={14} className="animate-spin" />
        : <Plus size={14} />}
        Connect Google account
      </button>
    </div>
  );
}
