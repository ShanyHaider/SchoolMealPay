"use client";

import { AlertTriangle, Loader2 } from "lucide-react";
import { motion } from "framer-motion";

export function InlineConfirm({
  message,
  onConfirm,
  onCancel,
  loading,
}: {
  message: string;
  onConfirm: () => void;
  onCancel: () => void;
  loading: boolean;
}) {
  return (
    <motion.div
      initial={{ opacity: 0, height: 0 }}
      animate={{ opacity: 1, height: "auto" }}
      exit={{ opacity: 0, height: 0 }}
      className="flex items-center gap-2 mt-2 p-2.5 rounded-xl bg-red-500/5 border border-red-500/20"
    >
      <AlertTriangle size={12} className="text-red-500 shrink-0" />
      <p className="text-[11px] text-red-500 font-medium flex-1">{message}</p>
      <button
        onClick={onConfirm}
        disabled={loading}
        className="flex items-center gap-1 rounded-lg bg-red-600 px-2.5 py-1 text-[10px] font-bold text-white hover:bg-red-700 disabled:opacity-50 cursor-pointer"
      >
        {loading && <Loader2 size={10} className="animate-spin" />}
        Confirm
      </button>
      <button
        onClick={onCancel}
        disabled={loading}
        className="rounded-lg border border-zinc-200 dark:border-zinc-800 px-2.5 py-1 text-[10px] font-bold hover:bg-zinc-100 dark:hover:bg-zinc-900 cursor-pointer"
      >
        Cancel
      </button>
    </motion.div>
  );
}
