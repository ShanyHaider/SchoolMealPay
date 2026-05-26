"use client";

import { CheckCircle2, AlertCircle, AlertTriangle } from "lucide-react";
import { motion } from "framer-motion";

export type StatusMessage = {
  type: "success" | "error" | "warning";
  text: string;
} | null;

export function StatusBanner({ status }: { status: StatusMessage }) {
  if (!status) return null;

  return (
    <motion.div
      initial={{ opacity: 0, height: 0, y: -10 }}
      animate={{ opacity: 1, height: "auto", y: 0 }}
      exit={{ opacity: 0, y: -10 }}
      className={`flex items-center gap-2.5 p-3.5 rounded-xl border text-xs font-semibold ${
        status.type === "success" ?
          "bg-emerald-500/10 border-emerald-500/20 text-emerald-600 dark:text-emerald-400"
        : status.type === "warning" ?
          "bg-amber-500/10 border-amber-500/20 text-amber-600 dark:text-amber-400"
        : "bg-red-500/10 border-red-500/20 text-red-600 dark:text-red-400"
      }`}
    >
      {status.type === "success" ?
        <CheckCircle2 size={14} />
      : status.type === "warning" ?
        <AlertTriangle size={14} />
      : <AlertCircle size={14} />}
      {status.text}
    </motion.div>
  );
}
