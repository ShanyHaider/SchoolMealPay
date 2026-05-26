"use client";

import React, { useState } from "react";
import { useUser } from "@clerk/nextjs";
import { Loader2, Plus, Trash2, X } from "lucide-react";
import { AnimatePresence } from "framer-motion";
import { InlineConfirm } from "../shared/InlineConfirm";
import { mapClerkError } from "../shared/clerkErrors";

interface EmailSectionProps {
  isLastFactor: boolean;
  onStatus: (type: "success" | "error" | "warning", text: string) => void;
  onNeedsReverification: (
    action: () => Promise<void>,
    successMsg: string,
  ) => void;
}

export function EmailSection({
  isLastFactor,
  onStatus,
  onNeedsReverification,
}: EmailSectionProps) {
  const { user } = useUser();
  const [newEmail, setNewEmail] = useState("");
  const [loadingKey, setLoadingKey] = useState<string | null>(null);
  const [confirmingDelete, setConfirmingDelete] = useState<string | null>(null);

  if (!user) return null;

  const isEmailDirty = newEmail.trim().length > 0;

  const handleAddEmail = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!isEmailDirty) return;
    const emailToAdd = newEmail.trim();
    setLoadingKey("add-email");
    try {
      onNeedsReverification(async () => {
        const res = await user.createEmailAddress({ email: emailToAdd });
        await res.prepareVerification({ strategy: "email_code" });
        setNewEmail("");
      }, `Verification code sent to ${emailToAdd}.`);
    } finally {
      setLoadingKey(null);
    }
  };

  const handleDeleteEmail = async (emailId: string) => {
    const emailObj = user.emailAddresses.find((e) => e.id === emailId);
    if (!emailObj) return;
    setLoadingKey(`delete-${emailId}`);
    onNeedsReverification(async () => {
      await emailObj.destroy();
      setConfirmingDelete(null);
    }, "Email address removed.");
    setLoadingKey(null);
  };

  const isDeleting = (id: string) => loadingKey === `delete-${id}`;

  return (
    <div className="space-y-3 border-b border-zinc-100 pb-6 dark:border-zinc-900">
      <h4 className="text-xs font-bold text-zinc-900 dark:text-white">
        Email addresses
      </h4>

      {isLastFactor && (
        <p className="text-[11px] text-amber-600 dark:text-amber-400 bg-amber-500/10 border border-amber-500/20 rounded-xl px-3 py-2">
          You must add another login method before removing your last identity
          factor.
        </p>
      )}

      <div className="space-y-1.5">
        {user.emailAddresses.map((email) => {
          const isPrimary = email.id === user.primaryEmailAddressId;
          const isOnlyFactor = isLastFactor && user.emailAddresses.length === 1;
          const deletingThis = isDeleting(email.id);

          return (
            <div
              key={email.id}
              className="rounded-xl bg-zinc-50 dark:bg-zinc-900/40 overflow-hidden"
            >
              <div className="flex items-center justify-between px-3.5 py-2.5">
                <span className="text-xs font-medium text-zinc-600 dark:text-zinc-300 font-mono">
                  {email.emailAddress}
                </span>
                <div className="flex items-center gap-2">
                  {isPrimary && (
                    <span className="text-[10px] border border-zinc-200 dark:border-zinc-800 text-zinc-500 dark:text-zinc-400 px-2 py-0.5 rounded-md font-bold bg-white dark:bg-zinc-950">
                      Primary
                    </span>
                  )}
                  {!isPrimary && (
                    <button
                      onClick={() =>
                        isOnlyFactor ? null : (
                          setConfirmingDelete(
                            confirmingDelete === email.id ? null : email.id,
                          )
                        )
                      }
                      disabled={isOnlyFactor || deletingThis}
                      className="rounded-lg p-1.5 text-zinc-400 hover:text-red-500 hover:bg-red-500/10 disabled:opacity-30 disabled:cursor-not-allowed transition-colors cursor-pointer"
                    >
                      {deletingThis ?
                        <Loader2 size={12} className="animate-spin" />
                      : confirmingDelete === email.id ?
                        <X size={12} />
                      : <Trash2 size={12} />}
                    </button>
                  )}
                </div>
              </div>
              <AnimatePresence>
                {confirmingDelete === email.id && (
                  <div className="px-3.5 pb-3">
                    <InlineConfirm
                      message="Remove this email address?"
                      onConfirm={() => handleDeleteEmail(email.id)}
                      onCancel={() => setConfirmingDelete(null)}
                      loading={deletingThis}
                    />
                  </div>
                )}
              </AnimatePresence>
            </div>
          );
        })}
      </div>

      <form onSubmit={handleAddEmail} className="flex gap-2 pt-1">
        <input
          type="email"
          placeholder="add-alternate@email.com"
          value={newEmail}
          onChange={(e) => setNewEmail(e.target.value)}
          className="max-w-xs rounded-xl border border-zinc-200 bg-transparent px-3 py-2 text-xs font-medium text-zinc-900 focus:outline-none dark:border-zinc-800 dark:text-white"
        />
        <button
          type="submit"
          disabled={loadingKey === "add-email" || !isEmailDirty}
          className="flex h-9 items-center gap-1.5 rounded-xl border border-zinc-200 px-3 text-xs font-bold hover:bg-zinc-50 dark:border-zinc-800 dark:hover:bg-zinc-900 disabled:opacity-40 disabled:cursor-not-allowed cursor-pointer transition-opacity"
        >
          {loadingKey === "add-email" ?
            <Loader2 size={12} className="animate-spin" />
          : <Plus size={14} />}
          Add email
        </button>
      </form>
    </div>
  );
}
