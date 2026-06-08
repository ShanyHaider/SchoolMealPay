"use client";

import { useState, useTransition, useEffect } from "react";
import { updateOrderStatus } from "@/db/actions/Orders";
import {
  Clock,
  ChefHat,
  PackageCheck,
  CheckCircle2,
  RefreshCw,
  AlertTriangle,
  Filter,
} from "lucide-react";
import { useRouter } from "next/navigation";

type Status = "pending" | "preparing" | "ready" | "delivered" | "cancelled";

const COLUMNS: {
  status: Status;
  label: string;
  icon: any;
  bg: string;
  color: string;
}[] = [
    {
      status: "pending",
      label: "Pending",
      icon: Clock,
      bg: "rgba(245,158,11,0.08)",
      color: "#f59e0b",
    },
    {
      status: "preparing",
      label: "Preparing",
      icon: ChefHat,
      bg: "rgba(59,130,246,0.08)",
      color: "#3b82f6",
    },
    {
      status: "ready",
      label: "Ready",
      icon: PackageCheck,
      bg: "rgba(139,92,246,0.08)",
      color: "#8b5cf6",
    },
    {
      status: "delivered",
      label: "delivered",
      icon: CheckCircle2,
      bg: "rgba(34,197,94,0.08)",
      color: "#22c55e",
    },
  ];

const NEXT_STATUS: Partial<Record<Status, Status>> = {
  pending: "preparing",
  preparing: "ready",
  ready: "delivered",
};

const NEXT_LABEL: Partial<Record<Status, string>> = {
  pending: "Start Preparing",
  preparing: "Mark Ready",
  ready: "Mark Collected",
};

const ALLERGEN_COLORS: Record<string, string> = {
  nuts: "#f59e0b",
  gluten: "#f97316",
  dairy: "#3b82f6",
  eggs: "#eab308",
  soy: "#84cc16",
  shellfish: "#06b6d4",
  fish: "#6366f1",
};

function OrderCard({
  order,
  onStatusChange,
  isUpdating,
}: {
  order: any;
  onStatusChange: (id: string, status: Status, order: any) => void;
  isUpdating: boolean;
}) {
  const nextStatus = NEXT_STATUS[order.status as Status];
  const allergens = order.student?.allergens ?? [];
  const itemCount =
    order.orderItems?.reduce((s: number, i: any) => s + (i.quantity ?? 1), 0) ??
    0;

  return (
    <div
      className="rounded-xl border p-4 transition-all hover:shadow-md"
      style={{
        background: "var(--bg-card)",
        borderColor: "var(--border-card)",
        boxShadow: "var(--shadow-card)",
      }}
    >
      {/* Header */}
      <div className="flex items-start justify-between gap-2 mb-3">
        <div>
          <div className="flex items-center gap-2">
            <div
              className="w-7 h-7 rounded-full flex items-center justify-center text-xs font-bold flex-shrink-0"
              style={{
                background: "var(--bg-tertiary)",
                color: "var(--text-secondary)",
              }}
            >
              {order.student?.name?.[0]?.toUpperCase() ?? "?"}
            </div>
            <span
              className="text-sm font-semibold"
              style={{ color: "var(--text-primary)" }}
            >
              {order.student?.name ?? "Unknown"}
            </span>
          </div>
          <p
            className="text-xs mt-0.5 ml-9 font-mono"
            style={{ color: "var(--text-muted)" }}
          >
            #{order.student?.studentCode}
          </p>
        </div>
        <span
          className="text-xs font-semibold flex-shrink-0"
          style={{ color: "var(--text-muted)" }}
        >
          {itemCount} item{itemCount !== 1 ? "s" : ""}
        </span>
      </div>

      {/* Allergen warning */}
      {allergens.length > 0 && (
        <div
          className="flex items-center gap-2 px-3 py-2 rounded-lg mb-3"
          style={{
            background: "rgba(239,68,68,0.08)",
            border: "1px solid rgba(239,68,68,0.15)",
          }}
        >
          <AlertTriangle
            size={12}
            style={{ color: "#ef4444", flexShrink: 0 }}
          />
          <div className="flex flex-wrap gap-1">
            {allergens.map((a: any) => (
              <span
                key={a.allergen}
                className="text-xs font-medium capitalize"
                style={{ color: ALLERGEN_COLORS[a.allergen] ?? "#ef4444" }}
              >
                {a.allergen}
              </span>
            ))}
          </div>
        </div>
      )}

      {/* Items */}
      <div className="space-y-1.5 mb-4">
        {order.orderItems?.map((oi: any) => (
          <div key={oi.id} className="flex items-center justify-between gap-2">
            <div className="flex items-center gap-2 min-w-0">
              <span
                className="w-5 h-5 rounded flex items-center justify-center text-xs font-bold flex-shrink-0"
                style={{
                  background: "var(--bg-tertiary)",
                  color: "var(--text-secondary)",
                }}
              >
                {oi.quantity}
              </span>
              <span
                className="text-sm truncate"
                style={{ color: "var(--text-secondary)" }}
              >
                {oi.menuItem?.name ?? "Item"}
              </span>
            </div>
            <span
              className="text-xs flex-shrink-0"
              style={{ color: "var(--text-muted)" }}
            >
              Rs.{" "}
              {(parseFloat(oi.unitPrice ?? "0") * (oi.quantity ?? 1)).toFixed(
                0,
              )}
            </span>
          </div>
        ))}
      </div>

      {/* Footer: time + action */}
      <div
        className="flex items-center justify-between pt-3"
        style={{ borderTop: "1px solid var(--border-primary)" }}
      >
        <span className="text-xs" style={{ color: "var(--text-muted)" }}>
          {new Date(order.createdAt).toLocaleTimeString("en-US", {
            hour: "2-digit",
            minute: "2-digit",
          })}
        </span>
        {nextStatus && (
          <button
            onClick={() => onStatusChange(order.id, nextStatus, order)}
            disabled={isUpdating}
            className="px-3 py-1.5 rounded-lg text-xs font-semibold transition-all disabled:opacity-50 hover:scale-[1.02]"
            style={{ background: "var(--accent)", color: "var(--accent-text)" }}
          >
            {NEXT_LABEL[order.status as Status]}
          </button>
        )}
      </div>
    </div>
  );
}

export function OrdersBoard({
  orders: initialOrders,
  canteenId,
}: {
  orders: any[];
  canteenId: string;
}) {
  const [orders, setOrders] = useState(initialOrders);
  const [isPending, startTransition] = useTransition();
  const [updatingId, setUpdatingId] = useState<string | null>(null);
  const [filterStatus, setFilterStatus] = useState<Status | "all">("all");
  const router = useRouter();

  // Auto-refresh every 20 seconds
  useEffect(() => {
    const id = setInterval(() => router.refresh(), 20_000);
    return () => clearInterval(id);
  }, [router]);

  // Keep local orders in sync with server refreshes
  useEffect(() => {
    setOrders(initialOrders);
  }, [initialOrders]);

  // In handleStatusChange — pass full order context
  const handleStatusChange = (orderId: string, newStatus: Status, order: any) => {
    setOrders((prev) =>
      prev.map((o) => (o.id === orderId ? { ...o, status: newStatus } : o)),
    );
    setUpdatingId(orderId);
    startTransition(async () => {
      await updateOrderStatus(
        orderId,
        newStatus,
        order.parentId,
        order.studentId,
        canteenId,
      );
      setUpdatingId(null);
      router.refresh();
    });
  };

  const activeStatuses: Status[] = [
    "pending",
    "preparing",
    "ready",
    "delivered",
  ];
  const countByStatus = (s: Status) =>
    orders.filter((o) => o.status === s).length;

  return (
    <div className="space-y-4">
      {/* Controls */}
      <div className="flex items-center gap-3 flex-wrap">
        <div
          className="flex rounded-lg p-1 gap-0.5"
          style={{ background: "var(--bg-pill)" }}
        >
          <button
            onClick={() => setFilterStatus("all")}
            className="px-3 py-1.5 rounded-md text-xs font-medium transition-all"
            style={{
              background:
                filterStatus === "all" ?
                  "var(--bg-pill-active)"
                  : "transparent",
              color:
                filterStatus === "all" ?
                  "var(--text-primary)"
                  : "var(--text-secondary)",
              boxShadow:
                filterStatus === "all" ? "var(--shadow-pill)" : undefined,
            }}
          >
            All ({orders.filter((o) => o.status !== "cancelled").length})
          </button>
          {activeStatuses.map((s) => (
            <button
              key={s}
              onClick={() => setFilterStatus(s)}
              className="px-3 py-1.5 rounded-md text-xs font-medium capitalize transition-all"
              style={{
                background:
                  filterStatus === s ? "var(--bg-pill-active)" : "transparent",
                color:
                  filterStatus === s ?
                    "var(--text-primary)"
                    : "var(--text-secondary)",
                boxShadow:
                  filterStatus === s ? "var(--shadow-pill)" : undefined,
              }}
            >
              {s} ({countByStatus(s)})
            </button>
          ))}
        </div>

        <button
          onClick={() => router.refresh()}
          className="ml-auto flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium"
          style={{
            background: "var(--bg-secondary)",
            border: "1px solid var(--border-input)",
            color: "var(--text-secondary)",
          }}
        >
          <RefreshCw size={12} />
          Refresh
        </button>
      </div>

      {/* Kanban board */}
      {
        filterStatus === "all" ?
          <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-4">
            {COLUMNS.map(({ status, label, icon: Icon, bg, color }) => {
              const colOrders = orders.filter((o) => o.status === status);
              return (
                <div key={status}>
                  {/* Column header */}
                  <div
                    className="flex items-center gap-2 px-3 py-2 rounded-lg mb-3"
                    style={{ background: bg }}
                  >
                    <Icon size={14} style={{ color }} />
                    <span className="text-xs font-semibold" style={{ color }}>
                      {label}
                    </span>
                    <span
                      className="ml-auto text-xs font-bold tabular-nums"
                      style={{ color }}
                    >
                      {colOrders.length}
                    </span>
                  </div>

                  {/* Cards */}
                  <div className="space-y-3">
                    {colOrders.length === 0 ?
                      <div
                        className="rounded-xl border py-8 text-center"
                        style={{
                          borderColor: "var(--border-card)",
                          borderStyle: "dashed",
                        }}
                      >
                        <p
                          className="text-xs"
                          style={{ color: "var(--text-muted)" }}
                        >
                          Empty
                        </p>
                      </div>
                      : colOrders.map((order) => (
                        <OrderCard
                          key={order.id}
                          order={order}
                          onStatusChange={handleStatusChange}
                          isUpdating={isPending && updatingId === order.id}
                        />
                      ))
                    }
                  </div>
                </div>
              );
            })}
          </div>
          // Filtered single-status view
          : <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {orders
              .filter((o) => o.status === filterStatus)
              .map((order) => (
                <OrderCard
                  key={order.id}
                  order={order}
                  onStatusChange={handleStatusChange}
                  isUpdating={isPending && updatingId === order.id}
                />
              ))}
            {orders.filter((o) => o.status === filterStatus).length === 0 && (
              <div
                className="col-span-full rounded-xl border py-16 text-center"
                style={{
                  borderColor: "var(--border-card)",
                  borderStyle: "dashed",
                }}
              >
                <p className="text-sm" style={{ color: "var(--text-muted)" }}>
                  No {filterStatus} orders.
                </p>
              </div>
            )}
          </div>

      }
    </div>
  );
}
