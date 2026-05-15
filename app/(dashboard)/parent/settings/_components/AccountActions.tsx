"use client";

import { useState } from "react";
import { useClerk } from "@clerk/nextjs";
import { useRouter } from "next/navigation";
import { LogOut, Trash2, ExternalLink, AlertTriangle } from "lucide-react";

export function AccountActions({
  userId,
  clerkId,
}: {
  userId: string;
  clerkId: string;
}) {
  const { signOut, openUserProfile } = useClerk();
  const router = useRouter();
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);

  async function handleSignOut() {
    await signOut();
    router.push("/");
  }

  return (
    <div className="bg-white dark:bg-zinc-900 border border-gray-200 dark:border-zinc-800 rounded-2xl p-6">
      <h2 className="text-base font-bold text-black dark:text-white mb-5">
        Account
      </h2>

      <div className="flex flex-col gap-3">
        {/* Manage Clerk profile */}
        <button
          onClick={() => openUserProfile()}
          className="flex items-center justify-between w-full px-4 py-3.5 rounded-xl border border-gray-200 dark:border-zinc-700 hover:border-black dark:hover:border-white transition-colors group"
        >
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-lg bg-gray-100 dark:bg-zinc-800 flex items-center justify-center">
              <ExternalLink size={15} className="text-gray-500" />
            </div>
            <div className="text-left">
              <p className="text-sm font-bold text-black dark:text-white">
                Manage account
              </p>
              <p className="text-xs text-gray-500">
                Change password, 2FA, connected accounts
              </p>
            </div>
          </div>
          <ExternalLink
            size={15}
            className="text-gray-300 group-hover:text-black dark:group-hover:text-white transition-colors"
          />
        </button>

        {/* Sign out */}
        <button
          onClick={handleSignOut}
          className="flex items-center gap-3 w-full px-4 py-3.5 rounded-xl border border-gray-200 dark:border-zinc-700 hover:border-black dark:hover:border-white transition-colors group"
        >
          <div className="w-8 h-8 rounded-lg bg-gray-100 dark:bg-zinc-800 flex items-center justify-center">
            <LogOut size={15} className="text-gray-500" />
          </div>
          <p className="text-sm font-bold text-black dark:text-white">
            Sign out
          </p>
        </button>

        {/* Delete account */}
        {!showDeleteConfirm ?
          <button
            onClick={() => setShowDeleteConfirm(true)}
            className="flex items-center gap-3 w-full px-4 py-3.5 rounded-xl border border-gray-200 dark:border-zinc-700 hover:border-red-300 dark:hover:border-red-800 transition-colors group"
          >
            <div className="w-8 h-8 rounded-lg bg-red-50 dark:bg-red-900/20 flex items-center justify-center">
              <Trash2 size={15} className="text-red-500" />
            </div>
            <div className="text-left">
              <p className="text-sm font-bold text-red-600 dark:text-red-400">
                Delete account
              </p>
              <p className="text-xs text-gray-500">
                Permanently remove your account and data
              </p>
            </div>
          </button>
        : <div className="flex flex-col gap-3 p-4 rounded-xl border border-red-200 dark:border-red-800 bg-red-50 dark:bg-red-900/20">
            <div className="flex items-center gap-2">
              <AlertTriangle size={16} className="text-red-500 flex-shrink-0" />
              <p className="text-sm font-bold text-red-600 dark:text-red-400">
                Are you sure?
              </p>
            </div>
            <p className="text-xs text-red-500">
              This will permanently delete your account. All children links,
              orders, and payment history will be removed. This cannot be
              undone.
            </p>
            <div className="flex gap-2">
              <button
                onClick={() => setShowDeleteConfirm(false)}
                className="flex-1 py-2 text-sm font-bold rounded-xl bg-white dark:bg-zinc-900 border border-gray-200 dark:border-zinc-700 text-black dark:text-white hover:border-black transition-colors"
              >
                Cancel
              </button>
              <button
                className="flex-1 py-2 text-sm font-bold rounded-xl bg-red-600 text-white hover:bg-red-700 transition-colors"
                onClick={async () => {
                  await signOut();
                  router.push("/");
                }}
              >
                Delete
              </button>
            </div>
          </div>
        }
      </div>
    </div>
  );
}
