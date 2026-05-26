import Link from "next/link";
import { ArrowRight } from "lucide-react";

const STATUS_META: Record<
  string,
  { label: string; bg: string; color: string }
> = {
  pending: { label: "Pending", bg: "rgba(245,158,11,0.12)", color: "#f59e0b" },
  preparing: {
    label: "Preparing",
    bg: "rgba(59,130,246,0.12)",
    color: "#3b82f6",
  },
  ready: { label: "Ready", bg: "rgba(139,92,246,0.12)", color: "#8b5cf6" },
  collected: {
    label: "Collected",
    bg: "rgba(34,197,94,0.12)",
    color: "#22c55e",
  },
  cancelled: {
    label: "Cancelled",
    bg: "rgba(239,68,68,0.12)",
    color: "#ef4444",
  },
};

export function LiveOrdersPreview({ orders }: { orders: any[] }) {
  return (
    <div
      className="rounded-xl border overflow-hidden"
      style={{
        background: "var(--bg-card)",
        borderColor: "var(--border-card)",
        boxShadow: "var(--shadow-card)",
      }}
    >
      <div
        className="px-5 py-4 border-b flex items-center justify-between"
        style={{ borderColor: "var(--border-primary)" }}
      >
        <h2
          className="text-sm font-semibold"
          style={{ color: "var(--text-primary)" }}
        >
          Recent Orders
        </h2>
        <Link
          href="/canteen-staff/orders"
          className="flex items-center gap-1 text-xs font-medium transition-colors"
          style={{ color: "var(--text-muted)" }}
        >
          View all <ArrowRight size={12} />
        </Link>
      </div>

      {orders.length === 0 ?
        <div className="py-12 text-center">
          <p className="text-sm" style={{ color: "var(--text-muted)" }}>
            No orders yet today.
          </p>
        </div>
      : <div
          className="divide-y"
          style={{ borderColor: "var(--border-primary)" }}
        >
          {orders.map((order) => {
            const meta = STATUS_META[order.status] ?? STATUS_META.pending;
            const itemNames = order.orderItems
              ?.map((oi: any) => oi.menuItem?.name)
              .filter(Boolean)
              .join(", ");
            const hasAllergens = order.student?.allergens?.length > 0;

            return (
              <div
                key={order.id}
                className="px-5 py-3.5 flex items-center gap-4"
              >
                {/* Student avatar */}
                <div
                  className="w-9 h-9 rounded-full flex items-center justify-center text-sm font-bold flex-shrink-0"
                  style={{
                    background: "var(--bg-tertiary)",
                    color: "var(--text-secondary)",
                  }}
                >
                  {order.student?.name?.[0]?.toUpperCase() ?? "?"}
                </div>

                {/* Order info */}
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2">
                    <p
                      className="text-sm font-medium truncate"
                      style={{ color: "var(--text-primary)" }}
                    >
                      {order.student?.name ?? "Unknown"}
                    </p>
                    {hasAllergens && (
                      <span
                        className="px-1.5 py-0.5 rounded text-xs font-medium flex-shrink-0"
                        style={{
                          background: "rgba(239,68,68,0.12)",
                          color: "#ef4444",
                        }}
                      >
                        ⚠ Allergens
                      </span>
                    )}
                  </div>
                  <p
                    className="text-xs truncate mt-0.5"
                    style={{ color: "var(--text-secondary)" }}
                  >
                    {itemNames || "No items"}
                  </p>
                </div>

                {/* Status */}
                <span
                  className="px-2.5 py-1 rounded-full text-xs font-medium flex-shrink-0"
                  style={{ background: meta.bg, color: meta.color }}
                >
                  {meta.label}
                </span>
              </div>
            );
          })}
        </div>
      }
    </div>
  );
}
