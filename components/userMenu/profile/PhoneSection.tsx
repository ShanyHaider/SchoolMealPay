"use client";

import React, { useState } from "react";
import { useUser } from "@clerk/nextjs";
import { Loader2, Plus, Trash2, X } from "lucide-react";
import { AnimatePresence } from "framer-motion";
import { InlineConfirm } from "../shared/InlineConfirm";
import { mapClerkError } from "../shared/clerkErrors";

interface PhoneSectionProps {
  isLastFactor: boolean;
  onStatus: (type: "success" | "error" | "warning", text: string) => void;
  onNeedsReverification: (
    action: () => Promise<void>,
    successMsg: string,
    verifyFactor?: any,
  ) => void;
}

export function PhoneSection({
  isLastFactor,
  onStatus,
  onNeedsReverification,
}: PhoneSectionProps) {
  const { user } = useUser();
  const [newPhone, setNewPhone] = useState("");
  const [loadingKey, setLoadingKey] = useState<string | null>(null);
  const [confirmingDelete, setConfirmingDelete] = useState<string | null>(null);

  if (!user) return null;

  const isPhoneDirty = newPhone.trim().length > 0;

  const handleAddPhone = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!isPhoneDirty) return;
    const phoneToAdd = newPhone.trim();
    setLoadingKey("add-phone");
    try {
      // 1. Create the alternate phone number first
      const res = await user.createPhoneNumber({ phoneNumber: phoneToAdd });
      // 2. Delegate the OTP verification code collection to ReverificationModal
      onNeedsReverification(
        async () => {
          await user.reload();
          setNewPhone("");
        },
        "Alternate phone number added and verified successfully.",
        {
          type: "phone",
          prepareVerification: () => res.prepareVerification(),
          attemptVerification: (code: string) => res.attemptVerification({ code }),
        }
      );
    } catch (err: any) {
      onStatus("error", mapClerkError(err));
    } finally {
      setLoadingKey(null);
    }
  };

  const handleDeletePhone = async (phoneId: string) => {
    const phoneObj = user.phoneNumbers.find((p) => p.id === phoneId);
    if (!phoneObj) return;
    setLoadingKey(`delete-${phoneId}`);
    onNeedsReverification(async () => {
      await phoneObj.destroy();
      setConfirmingDelete(null);
    }, "Phone number removed.");
    setLoadingKey(null);
  };

  const isDeleting = (id: string) => loadingKey === `delete-${id}`;

  return (
    <div className="space-y-3 border-b border-zinc-100 pb-6 dark:border-zinc-900">
      <h4 className="text-xs font-bold text-zinc-900 dark:text-white">
        Phone number
      </h4>

      <div className="space-y-1.5">
        {user.phoneNumbers.length === 0 ?
          <p className="text-[11px] text-zinc-400 dark:text-zinc-500 italic px-1">
            No phone numbers linked.
          </p>
        : user.phoneNumbers.map((phone) => {
            const isOnlyFactor = isLastFactor && user.phoneNumbers.length === 1;
            const deletingThis = isDeleting(phone.id);

            return (
              <div
                key={phone.id}
                className="rounded-xl bg-zinc-50 dark:bg-zinc-900/40 overflow-hidden"
              >
                <div className="flex items-center justify-between px-3.5 py-2.5">
                  <span className="text-xs font-medium text-zinc-600 dark:text-zinc-300 font-mono">
                    {phone.phoneNumber}
                  </span>
                  <button
                    onClick={() =>
                      isOnlyFactor ? null : (
                        setConfirmingDelete(
                          confirmingDelete === phone.id ? null : phone.id,
                        )
                      )
                    }
                    disabled={isOnlyFactor || deletingThis}
                    className="rounded-lg p-1.5 text-zinc-400 hover:text-red-500 hover:bg-red-500/10 disabled:opacity-30 disabled:cursor-not-allowed transition-colors cursor-pointer"
                  >
                    {deletingThis ?
                      <Loader2 size={12} className="animate-spin" />
                    : confirmingDelete === phone.id ?
                      <X size={12} />
                    : <Trash2 size={12} />}
                  </button>
                </div>
                <AnimatePresence>
                  {confirmingDelete === phone.id && (
                    <div className="px-3.5 pb-3">
                      <InlineConfirm
                        message="Remove this phone number?"
                        onConfirm={() => handleDeletePhone(phone.id)}
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

      <form onSubmit={handleAddPhone} className="flex gap-2 pt-1">
        <input
          type="tel"
          placeholder="+923001234567"
          value={newPhone}
          onChange={(e) => setNewPhone(e.target.value)}
          className="max-w-xs rounded-xl border border-zinc-200 bg-transparent px-3 py-2 text-xs font-medium text-zinc-900 focus:outline-none dark:border-zinc-800 dark:text-white"
        />
        <button
          type="submit"
          disabled={loadingKey === "add-phone" || !isPhoneDirty}
          className="flex h-9 items-center gap-1.5 rounded-xl border border-zinc-200 px-3 text-xs font-bold hover:bg-zinc-50 dark:border-zinc-800 dark:hover:bg-zinc-900 disabled:opacity-40 disabled:cursor-not-allowed cursor-pointer transition-opacity"
        >
          {loadingKey === "add-phone" ?
            <Loader2 size={12} className="animate-spin" />
          : <Plus size={14} />}
          Add phone
        </button>
      </form>
    </div>
  );
}
