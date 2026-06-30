"use client";

import { ClipboardList, ShoppingBag } from "lucide-react";
import Link from "next/link";
import { Section } from "./ui";
import { ORDER_STATUS_CONFIG } from "./constants";
import { formatPKR } from "@/lib/currency";
import { RecentOrder } from "@/types/childProfileTypes";

function fmtDate(iso: string) {
  const d = new Date(iso + "T00:00:00");
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const yesterday = new Date(today);
  yesterday.setDate(today.getDate() - 1);

  if (d.getTime() === today.getTime()) return "Today";
  if (d.getTime() === yesterday.getTime()) return "Yesterday";
  return d.toLocaleDateString("en-US", {
    weekday: "short",
    month: "short",
    day: "numeric",
  });
}

export function RecentOrdersSection({
  orders,
  studentId,
}: {
  orders: RecentOrder[];
  studentId: string;
}) {
  return (
    <Section
      icon={<ClipboardList size={15} />}
      title="Recent orders"
      subtitle="Last 7 orders placed for this child."
    >
      {orders.length === 0 ?
        <div className="flex flex-col items-center justify-center py-8 gap-2">
          <ShoppingBag size={28} className="text-(--text-muted) opacity-20" />
          <p className="text-sm text-(--text-muted) font-medium">
            No orders yet
          </p>
        </div>
      : <div className="flex flex-col gap-2">
          {orders.map((order) => {
            const statusCfg =
              ORDER_STATUS_CONFIG[order.status] ?? ORDER_STATUS_CONFIG.pending;
            const itemSummary = order.items
              .map((i) =>
                i.quantity > 1 ? `${i.name} ×${i.quantity}` : i.name,
              )
              .join(", ");

            return (
              <div
                key={order.id}
                className="flex items-center justify-between gap-3 px-3.5 py-3 rounded-xl bg-(--bg-secondary) border border-(--border-card)"
              >
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-0.5">
                    <p className="text-xs font-bold text-(--text-muted) uppercase tracking-wider">
                      {fmtDate(order.orderDate)}
                    </p>
                    <span
                      className={`text-[10px] font-bold px-1.5 py-0.5 rounded-md border ${statusCfg.className}`}
                    >
                      {statusCfg.label}
                    </span>
                  </div>
                  <p className="text-sm font-medium text-(--text-primary) truncate">
                    {itemSummary || "—"}
                  </p>
                </div>
                <span className="text-sm font-bold text-(--text-primary) shrink-0">
                  {formatPKR(order.totalAmount)}
                </span>
              </div>
            );
          })}
        </div>
      }

      <div className="pt-1">
        <Link
          href={`/parent/orders?student=${studentId}`}
          className="text-xs font-semibold text-blue-500 hover:text-blue-400 transition-colors"
        >
          View all orders →
        </Link>
      </div>
    </Section>
  );
}
