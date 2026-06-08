"use client";

import React, { useState, useEffect } from "react";
import { useUser } from "@clerk/nextjs";
import { Loader2, Upload } from "lucide-react";

interface AvatarNameFormProps {
  onStatus: (type: "success" | "error" | "warning", text: string) => void;
}

export function AvatarNameForm({ onStatus }: AvatarNameFormProps) {
  const { user } = useUser();
  const [firstName, setFirstName] = useState(user?.firstName ?? "");
  const [lastName, setLastName] = useState(user?.lastName ?? "");
  const [loadingName, setLoadingName] = useState(false);
  const [loadingAvatar, setLoadingAvatar] = useState(false);

  useEffect(() => {
    if (user) {
      setFirstName(user.firstName ?? "");
      setLastName(user.lastName ?? "");
    }
  }, [user]);

  if (!user) return null;

  const isNameDirty =
    firstName !== (user.firstName ?? "") || lastName !== (user.lastName ?? "");

  const handleUpdateProfile = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!isNameDirty) return;
    setLoadingName(true);
    try {
      await user.update({ firstName, lastName });
      onStatus("success", "Profile updated successfully.");
    } catch (err) {
      const e = err as { errors?: { message?: string }[]; message?: string };
      onStatus(
        "error",
        e?.errors?.[0]?.message ?? e?.message ?? "Update failed.",
      );
    } finally {
      setLoadingName(false);
    }
  };

  const handleAvatarChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setLoadingAvatar(true);
    try {
      await user.setProfileImage({ file });
      onStatus("success", "Avatar updated successfully.");
    } catch (err) {
      const e = err as { errors?: { message?: string }[]; message?: string };
      onStatus(
        "error",
        e?.errors?.[0]?.message ?? e?.message ?? "Avatar update failed.",
      );
    } finally {
      setLoadingAvatar(false);
    }
  };

  return (
    <form
      onSubmit={handleUpdateProfile}
      className="space-y-5 border-b border-zinc-100 pb-6 dark:border-zinc-900"
    >
      {/* Avatar row */}
      <div className="flex items-center gap-5 rounded-2xl border border-zinc-100 bg-zinc-50/50 p-4 dark:border-zinc-900 dark:bg-zinc-900/20">
        <div className="relative h-14 w-14 overflow-hidden rounded-full border border-zinc-200 bg-zinc-100 dark:border-zinc-800 dark:bg-zinc-900 group shrink-0 shadow-xs">
          <img
            src={user.imageUrl}
            alt="Profile"
            className="h-full w-full object-cover"
          />
          <label className="absolute inset-0 flex cursor-pointer items-center justify-center bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity">
            {loadingAvatar ?
              <Loader2 size={14} className="text-white animate-spin" />
            : <Upload size={14} className="text-white" />}
            <input
              type="file"
              accept="image/*"
              onChange={handleAvatarChange}
              className="hidden"
              disabled={loadingAvatar}
            />
          </label>
        </div>
        <div>
          <h4 className="text-xs font-bold text-zinc-900 dark:text-white">
            {user.fullName || "User"}
          </h4>
          <p className="text-[11px] text-zinc-400 dark:text-zinc-500 mt-0.5">
            Hover your avatar to update your photo.
          </p>
        </div>
      </div>

      {/* Name fields */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
        <div className="space-y-1">
          <label className="text-[11px] font-bold text-zinc-500 dark:text-zinc-400">
            First name
          </label>
          <input
            type="text"
            value={firstName}
            onChange={(e) => setFirstName(e.target.value)}
            className="w-full rounded-xl border border-zinc-200 bg-zinc-50/50 px-3.5 py-2.5 text-xs font-semibold text-zinc-900 focus:outline-none dark:border-zinc-800 dark:bg-zinc-900 dark:text-white"
          />
        </div>
        <div className="space-y-1">
          <label className="text-[11px] font-bold text-zinc-500 dark:text-zinc-400">
            Last name
          </label>
          <input
            type="text"
            value={lastName}
            onChange={(e) => setLastName(e.target.value)}
            className="w-full rounded-xl border border-zinc-200 bg-zinc-50/50 px-3.5 py-2.5 text-xs font-semibold text-zinc-900 focus:outline-none dark:border-zinc-800 dark:bg-zinc-900 dark:text-white"
          />
        </div>
      </div>

      <div className="flex justify-end">
        <button
          type="submit"
          disabled={loadingName || !isNameDirty}
          className="flex h-9 items-center justify-center gap-2 rounded-xl bg-zinc-950 px-4 text-xs font-bold text-white hover:bg-zinc-900 dark:bg-white dark:text-zinc-950 dark:hover:bg-zinc-100 disabled:opacity-40 disabled:cursor-not-allowed cursor-pointer transition-opacity"
        >
          {loadingName && <Loader2 size={12} className="animate-spin" />}
          Update profile
        </button>
      </div>
    </form>
  );
}
