"use client";

import React, { useTransition } from "react";
import Link from "next/link";
import {
  UtensilsCrossed,
  Salad,
  Wallet,
  UserPlus,
  ChevronRight,
  AlertTriangle,
  Check,
  X,
} from "lucide-react";
import { resolveSpendingApproval } from "@/db/actions/Notifications";

// ─── Quick Actions ─────────────────────────────────────────────

const ACTIONS = [
  {
    label: "Order a meal",
    href: "/parent/menu",
    icon: UtensilsCrossed,
    color: "text-blue-500 bg-blue-500/10 border-blue-500/20",
  },
  {
    label: "View nutrition",
    href: "/parent/nutrition",
    icon: Salad,
    color: "text-green-500 bg-green-500/10 border-green-500/20",
  },
  {
    label: "Spending limits",
    href: "/parent/spending",
    icon: Wallet,
    color: "text-amber-500 bg-amber-500/10 border-amber-500/20",
  },
  {
    label: "Link a child",
    href: "/parent/children/link",
    icon: UserPlus,
    color: "text-purple-500 bg-purple-500/10 border-purple-500/20",
  },
] as const;

export function QuickActions() {
  return (
    <section className="w-full bg-[var(--bg-card)] border border-[var(--border-card)] rounded-2xl p-6 shadow-sm">
      <div className="flex items-center justify-between mb-4">
        <h2 className="text-base font-bold text-zinc-900 dark:text-zinc-50">
          Quick actions
        </h2>
      </div>
      <div className="flex flex-col gap-1.5">
        {ACTIONS.map((action) => {
          const Icon = action.icon;
          return (
            <Link
              key={action.href}
              href={action.href}
              className="flex items-center gap-3.5 p-3 rounded-xl hover:bg-[var(--bg-secondary)] transition-all group"
            >
              <div
                className={`w-9 h-9 rounded-xl border flex items-center justify-center shrink-0 ${action.color}`}
              >
                <Icon size={16} />
              </div>
              <span className="flex-1 text-sm font-semibold text-zinc-700 dark:text-zinc-300 group-hover:text-zinc-950 dark:group-hover:text-zinc-50 transition-colors">
                {action.label}
              </span>
              <ChevronRight
                size={15}
                className="text-zinc-400 group-hover:text-zinc-900 dark:group-hover:text-zinc-100 transition-all transform group-hover:translate-x-0.5"
              />
            </Link>
          );
        })}
      </div>
    </section>
  );
}

// ─── Pending Approvals ─────────────────────────────────────────

type Approval = {
  id: string;
  orderAmount: string;
  status: string;
  parentId: string;
  student: { name: string } | null;
  order: {
    id: string;
    orderItems: {
      id: string;
      quantity: number;
      menuItem: { name: string } | null;
    }[];
  } | null;
};

function ApprovalCard({ approval }: { approval: Approval }) {
  const [isPending, startTransition] = useTransition();

  const itemNames = approval.order?.orderItems
    .map((i) => `${i.quantity}x ${i.menuItem?.name ?? "Item"}`)
    .join(", ");

  const handleAction = (status: "approved" | "rejected", reason?: string) => {
    startTransition(async () => {
      await resolveSpendingApproval(
        approval.id,
        approval.parentId,
        status,
        reason,
      );
    });
  };

  return (
    <div
      className={`p-4 rounded-xl bg-amber-500/5 border border-amber-500/20 flex flex-col gap-3 transition-opacity ${isPending ? "opacity-50 pointer-events-none" : ""}`}
    >
      <div className="flex items-start gap-3">
        <div className="w-8 h-8 rounded-lg bg-amber-500/10 text-amber-500 flex items-center justify-center shrink-0 border border-amber-500/20">
          <AlertTriangle size={15} />
        </div>
        <div className="min-w-0 flex-1">
          <p className="text-xs font-bold text-zinc-900 dark:text-zinc-50 truncate">
            {approval.student?.name}
          </p>
          <p className="text-[11px] font-semibold text-amber-600 dark:text-amber-400 mt-0.5">
            ${parseFloat(approval.orderAmount).toFixed(2)} — exceeds limit
          </p>
        </div>
      </div>

      {itemNames && (
        <p className="text-xs text-zinc-500 dark:text-zinc-400 pl-11 line-clamp-2 leading-relaxed">
          {itemNames}
        </p>
      )}

      <div className="flex items-center gap-2 pl-11">
        <button
          onClick={() => handleAction("approved")}
          disabled={isPending}
          className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold bg-green-600 hover:bg-green-500 text-white shadow-sm transition-colors cursor-pointer"
        >
          <Check size={12} /> Approve
        </button>
        <button
          onClick={() => handleAction("rejected", "Declined by parent")}
          disabled={isPending}
          className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold bg-zinc-100 hover:bg-zinc-200 dark:bg-zinc-800 dark:hover:bg-zinc-700 text-zinc-700 dark:text-zinc-300 border border-zinc-200 dark:border-zinc-700/60 transition-colors cursor-pointer"
        >
          <X size={12} /> Decline
        </button>
      </div>
    </div>
  );
}

interface PendingApprovalsProps {
  approvals: Approval[];
}

export function PendingApprovals({ approvals }: PendingApprovalsProps) {
  if (approvals.length === 0) return null;

  return (
    <section className="w-full bg-[var(--bg-card)] border border-[var(--border-card)] rounded-2xl p-6 shadow-sm">
      <div className="flex items-center justify-between mb-4">
        <h2 className="text-base font-bold text-zinc-900 dark:text-zinc-50 flex items-center gap-2">
          Needs approval
          <span className="inline-flex items-center justify-center px-2 py-0.5 rounded-full text-xs font-bold bg-amber-500/10 text-amber-600 border border-amber-500/20">
            {approvals.length}
          </span>
        </h2>
      </div>
      <div className="flex flex-col gap-3">
        {approvals.map((a) => (
          <ApprovalCard key={a.id} approval={a} />
        ))}
      </div>
    </section>
  );
}
