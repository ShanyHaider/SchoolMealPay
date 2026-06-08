"use client";

import React from "react";
import Link from "next/link";
import { ShoppingBag, ArrowRight } from "lucide-react";

type Order = {
  id: string;
  status: string | null;
  totalAmount: string;
  orderDate: string;
  studentId: string;
  orderItems: {
    id: string;
    quantity: number;
    menuItem: { name: string } | null;
  }[];
};

const STATUS_CONFIG: Record<string, { label: string; style: string }> = {
  pending: {
    label: "Pending",
    style: "bg-amber-500/10 text-amber-600 border-amber-500/20",
  },
  preparing: {
    label: "Preparing",
    style: "bg-blue-500/10 text-blue-600 border-blue-500/20",
  },
  ready: {
    label: "Ready",
    style: "bg-green-500/10 text-green-600 border-green-500/20",
  },
  delivered: {
    label: "Collected",
    style:
      "bg-zinc-100 dark:bg-zinc-800 text-zinc-500 border-zinc-200 dark:border-zinc-700",
  },
  cancelled: {
    label: "Cancelled",
    style: "bg-red-500/10 text-red-600 border-red-500/20",
  },
};

function OrderRow({ order }: { order: Order }) {
  const status = order.status ?? "pending";
  const config = STATUS_CONFIG[status] ?? STATUS_CONFIG.pending;
  const itemNames = order.orderItems
    .map((i) => `${i.quantity}× ${i.menuItem?.name ?? "Item"}`)
    .join(", ");

  const formattedDate = new Date(order.orderDate).toLocaleDateString("en-US", {
    weekday: "short",
    month: "short",
    day: "numeric",
  });

  return (
    <Link
      href={`/parent/orders/${order.id}`}
      className="flex items-center justify-between p-3.5 rounded-xl hover:bg-[var(--bg-secondary)] transition-colors gap-4 group"
    >
      <div className="flex items-center gap-3.5 min-w-0 flex-1">
        <div className="w-10 h-10 rounded-xl bg-zinc-100 dark:bg-zinc-800/80 text-zinc-500 dark:text-zinc-400 flex items-center justify-center shrink-0 border border-zinc-200/40 dark:border-zinc-700/40">
          <ShoppingBag size={16} />
        </div>
        <div className="flex flex-col min-w-0 gap-0.5">
          <span className="text-sm font-semibold text-zinc-800 dark:text-zinc-200 truncate group-hover:text-zinc-950 dark:group-hover:text-zinc-50 transition-colors">
            {itemNames}
          </span>
          <span className="text-xs font-medium text-zinc-400 dark:text-zinc-500">
            {formattedDate}
          </span>
        </div>
      </div>
      <div className="flex items-center gap-3 shrink-0">
        <span
          className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-bold border ${config.style}`}
        >
          {config.label}
        </span>
        <span className="text-sm font-bold text-zinc-900 dark:text-zinc-50">
          PKR {Math.round(parseFloat(order.totalAmount))}
        </span>
      </div>
    </Link>
  );
}

interface RecentOrdersProps {
  orders: Order[];
}

export function RecentOrders({ orders }: RecentOrdersProps) {
  return (
    <section className="w-full bg-[var(--bg-card)] border border-[var(--border-card)] rounded-2xl p-6 shadow-sm">
      <div className="flex items-center justify-between mb-4">
        <h2 className="text-base font-bold text-zinc-900 dark:text-zinc-50">
          Recent orders
        </h2>
        <Link
          href="/parent/orders"
          className="text-xs font-bold text-zinc-400 hover:text-zinc-950 dark:hover:text-zinc-50 flex items-center gap-1 transition-colors"
        >
          View all <ArrowRight size={13} />
        </Link>
      </div>

      {orders.length === 0 ?
        <div className="flex flex-col items-center text-center gap-3 py-10">
          <div className="w-12 h-12 rounded-xl bg-zinc-100 dark:bg-zinc-800/60 text-zinc-400 flex items-center justify-center">
            <ShoppingBag size={20} />
          </div>
          <p className="text-sm font-medium text-zinc-400">No orders yet.</p>
          <Link
            href="/parent/menu"
            className="mt-1 px-4 py-2 bg-zinc-900 dark:bg-zinc-50 text-white dark:text-zinc-950 text-xs font-bold rounded-xl shadow-sm hover:opacity-90 transition-opacity"
          >
            Browse menu
          </Link>
        </div>
        : <div className="flex flex-col gap-0.5">
          {orders.map((order) => (
            <OrderRow key={order.id} order={order} />
          ))}
        </div>
      }
    </section>
  );
}