"use client";

import React, { useState } from "react";
import { useUser, useClerk, useReverification } from "@clerk/nextjs";
import { isReverificationCancelledError } from "@clerk/nextjs/errors";
import {
  Trash2,
  KeyRound,
  Loader2,
  Eye,
  EyeOff,
  Monitor,
  Lock,
} from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { StatusBanner, type StatusMessage } from "../shared/StatusBanner";
import { ReverificationModal } from "../shared/ReverificationModal";

interface ClerkCustomUiParams {
  complete: (payload?: any) => void;
  cancel: () => void;
}

export function SecurityTab() {
  const { user } = useUser();
  const { signOut } = useClerk();

  const [showPasswordForm, setShowPasswordForm] = useState(false);
  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [signOutOtherSessions, setSignOutOtherSessions] = useState(false);
  const [showCurrent, setShowCurrent] = useState(false);
  const [showNew, setShowNew] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);

  const [confirmDelete, setConfirmDelete] = useState(false);
  const [loading, setLoading] = useState<"password" | "delete" | null>(null);
  const [status, setStatus] = useState<StatusMessage>(null);
  const [modalControls, setModalControls] =
    useState<ClerkCustomUiParams | null>(null);

  const showStatus = (type: "success" | "error", text: string) => {
    setStatus({ type, text });
    setTimeout(() => setStatus(null), 5000);
  };

  const securePasswordUpdate = useReverification(
    async () => {
      await user?.updatePassword({
        ...(user?.passwordEnabled ? { currentPassword } : {}),
        newPassword,
        signOutOfOtherSessions: signOutOtherSessions,
      });
      showStatus("success", "Password updated successfully.");
      setCurrentPassword("");
      setNewPassword("");
      setConfirmPassword("");
      setShowPasswordForm(false);
      setSignOutOtherSessions(false);
    },
    {
      onNeedsReverification: ({ complete, cancel }) => {
        setModalControls({ complete, cancel });
      },
    },
  );

  const secureDeleteAccount = useReverification(
    async () => {
      const res = await fetch("/api/user/delete", { method: "DELETE" });
      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error ?? "Deletion failed");
      }
      await signOut({ redirectUrl: "/" });
    },
    {
      onNeedsReverification: ({ complete, cancel }) => {
        setModalControls({ complete, cancel });
      },
    },
  );

  if (!user) return null;
  const hasExistingPassword = user.passwordEnabled;
  const isPasswordFormDirty =
    newPassword.length > 0 &&
    confirmPassword.length > 0 &&
    (!hasExistingPassword || currentPassword.length > 0);

  const handlePasswordUpdate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (newPassword !== confirmPassword) {
      showStatus("error", "New passwords do not match.");
      return;
    }
    if (newPassword.length < 8) {
      showStatus("error", "Password must be at least 8 characters.");
      return;
    }
    setLoading("password");
    try {
      await securePasswordUpdate();
    } catch (err) {
      if (!isReverificationCancelledError(err)) {
        const errorMsg =
          (err as Error)?.message ?? "Failed to update password.";
        showStatus("error", errorMsg);
      }
    } finally {
      setLoading(null);
    }
  };

  const handleDeleteAccount = async () => {
    if (!confirmDelete) {
      setConfirmDelete(true);
      return;
    }
    setLoading("delete");
    try {
      await secureDeleteAccount();
    } catch (err) {
      if (!isReverificationCancelledError(err)) {
        const errorMsg = (err as Error)?.message ?? "Failed to delete account.";
        showStatus("error", errorMsg);
      }
      setConfirmDelete(false);
    } finally {
      setLoading(null);
    }
  };

  const inputClass =
    "w-full rounded-xl border border-zinc-200 bg-zinc-50/50 px-3.5 py-2.5 text-xs font-semibold text-zinc-900 focus:outline-none dark:border-zinc-800 dark:bg-zinc-900 dark:text-white";

  return (
    <motion.div
      initial={{ opacity: 0, y: 4 }}
      animate={{ opacity: 1, y: 0 }}
      className="space-y-6"
    >
      <div>
        <h3 className="text-lg font-black tracking-tight text-zinc-950 dark:text-white">
          Security &amp; Access
        </h3>
        <p className="text-xs text-zinc-400 dark:text-zinc-500 mt-0.5">
          Manage your password and account data.
        </p>
      </div>

      <AnimatePresence>
        {status && <StatusBanner status={status} />}
      </AnimatePresence>

      <div className="rounded-2xl border border-zinc-100 dark:border-zinc-900 overflow-hidden">
        <div className="flex items-center justify-between p-4">
          <div className="flex items-start gap-3">
            <KeyRound size={16} className="mt-0.5 text-zinc-400 shrink-0" />
            <div>
              <h4 className="text-xs font-bold text-zinc-900 dark:text-white">
                {hasExistingPassword ? "Change Password" : "Set a Password"}
              </h4>
              <p className="text-[11px] text-zinc-400 dark:text-zinc-500 mt-0.5">
                {hasExistingPassword ?
                  "Update your account password."
                : "Add a password alongside your social login."}
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={() => {
              setShowPasswordForm((v) => !v);
              setCurrentPassword("");
              setNewPassword("");
              setConfirmPassword("");
            }}
            className="flex items-center gap-1.5 rounded-xl border border-zinc-200 px-3.5 py-2 text-xs font-bold dark:border-zinc-800 dark:text-zinc-200 hover:bg-zinc-50 dark:hover:bg-zinc-900 cursor-pointer shrink-0"
          >
            {showPasswordForm ?
              "Cancel"
            : hasExistingPassword ?
              "Change"
            : "Set password"}
          </button>
        </div>

        <AnimatePresence>
          {showPasswordForm && (
            <motion.div
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: "auto" }}
              exit={{ opacity: 0, height: 0 }}
            >
              <form
                onSubmit={handlePasswordUpdate}
                className="px-4 pb-4 space-y-3 border-t border-zinc-100 dark:border-zinc-900 pt-4"
              >
                {hasExistingPassword && (
                  <div className="space-y-1">
                    <label className="text-[11px] font-bold text-zinc-500 dark:text-zinc-400">
                      Current password
                    </label>
                    <div className="relative">
                      <input
                        type={showCurrent ? "text" : "password"}
                        value={currentPassword}
                        onChange={(e) => setCurrentPassword(e.target.value)}
                        className={`${inputClass} pr-10`}
                        autoComplete="current-password"
                      />
                      <button
                        type="button"
                        onClick={() => setShowCurrent((v) => !v)}
                        className="absolute right-3 top-1/2 -translate-y-1/2 text-zinc-400 hover:text-zinc-600"
                      >
                        {showCurrent ?
                          <EyeOff size={13} />
                        : <Eye size={13} />}
                      </button>
                    </div>
                  </div>
                )}

                <div className="space-y-1">
                  <label className="text-[11px] font-bold text-zinc-500 dark:text-zinc-400">
                    New password
                  </label>
                  <div className="relative">
                    <input
                      type={showNew ? "text" : "password"}
                      value={newPassword}
                      onChange={(e) => setNewPassword(e.target.value)}
                      className={`${inputClass} pr-10`}
                      autoComplete="new-password"
                    />
                    <button
                      type="button"
                      onClick={() => setShowNew((v) => !v)}
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-zinc-400 hover:text-zinc-600"
                    >
                      {showNew ?
                        <EyeOff size={13} />
                      : <Eye size={13} />}
                    </button>
                  </div>
                </div>

                <div className="space-y-1">
                  <label className="text-[11px] font-bold text-zinc-500 dark:text-zinc-400">
                    Confirm new password
                  </label>
                  <div className="relative">
                    <input
                      type={showConfirm ? "text" : "password"}
                      value={confirmPassword}
                      onChange={(e) => setConfirmPassword(e.target.value)}
                      className={`${inputClass} pr-10`}
                      autoComplete="new-password"
                    />
                    <button
                      type="button"
                      onClick={() => setShowConfirm((v) => !v)}
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-zinc-400 hover:text-zinc-600"
                    >
                      {showConfirm ?
                        <EyeOff size={13} />
                      : <Eye size={13} />}
                    </button>
                  </div>
                  {confirmPassword.length > 0 &&
                    newPassword !== confirmPassword && (
                      <p className="text-[10px] text-red-500 mt-1">
                        Passwords do not match.
                      </p>
                    )}
                </div>

                <button
                  type="button"
                  onClick={() => setSignOutOtherSessions((v) => !v)}
                  className="flex items-center gap-2.5 cursor-pointer pt-1 w-full text-left"
                >
                  <div
                    className={`relative h-4 w-7 rounded-full transition-colors shrink-0 ${signOutOtherSessions ? "bg-zinc-950 dark:bg-white" : "bg-zinc-200 dark:bg-zinc-700"}`}
                  >
                    <div
                      className={`absolute top-0.5 h-3 w-3 rounded-full bg-white dark:bg-zinc-950 transition-transform ${signOutOtherSessions ? "translate-x-3" : "translate-x-0.5"}`}
                    />
                  </div>
                  <Monitor size={12} className="text-zinc-400 shrink-0" />
                  <span className="text-[11px] font-medium text-zinc-500 dark:text-zinc-400">
                    Sign out of all other active sessions
                  </span>
                </button>

                <div className="flex justify-end pt-1">
                  <button
                    type="submit"
                    disabled={loading === "password" || !isPasswordFormDirty}
                    className="flex h-9 items-center gap-2 rounded-xl bg-zinc-950 px-4 text-xs font-bold text-white hover:bg-zinc-900 dark:bg-white dark:text-zinc-950 dark:hover:bg-zinc-100 disabled:opacity-40 disabled:cursor-not-allowed cursor-pointer"
                  >
                    {loading === "password" ?
                      <Loader2 size={12} className="animate-spin" />
                    : <Lock size={12} />}
                    {hasExistingPassword ? "Update password" : "Set password"}
                  </button>
                </div>
              </form>
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      <div className="rounded-2xl border border-red-500/20 bg-red-500/5 p-4 dark:border-red-500/10">
        <div className="flex items-center justify-between gap-4">
          <div>
            <h4 className="text-xs font-bold text-red-600 dark:text-red-400">
              Danger Zone
            </h4>
            <p className="text-[11px] text-zinc-400 dark:text-zinc-500 mt-0.5">
              Permanently delete your account and all associated data.
            </p>
          </div>
          <button
            type="button"
            onClick={handleDeleteAccount}
            disabled={loading === "delete"}
            className="flex items-center gap-1.5 rounded-xl bg-red-600 px-3.5 py-2 text-xs font-bold text-white hover:bg-red-700 disabled:opacity-50 cursor-pointer shrink-0"
          >
            {loading === "delete" ?
              <Loader2 size={13} className="animate-spin" />
            : <Trash2 size={13} />}
            {confirmDelete ? "Confirm delete" : "Delete account"}
          </button>
        </div>

        <AnimatePresence>
          {confirmDelete && (
            <motion.p
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: "auto" }}
              exit={{ opacity: 0, height: 0 }}
              className="mt-3 text-[11px] text-red-500 dark:text-red-400 font-medium"
            >
              Click &ldquo;Confirm delete&rdquo; again to permanently delete
              your account. This cannot be undone.
            </motion.p>
          )}
        </AnimatePresence>
      </div>

      <AnimatePresence>
        {modalControls && (
          <ReverificationModal
            onComplete={(payload) => {
              modalControls.complete(payload);
              setModalControls(null);
            }}
            onCancel={() => {
              modalControls.cancel();
              setModalControls(null);
            }}
          />
        )}
      </AnimatePresence>
    </motion.div>
  );
}
