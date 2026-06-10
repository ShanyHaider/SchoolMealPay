import Link from "next/link";
import { ArrowRight } from "lucide-react";

const STATUS_META: Record<string, { label: string; bg: string; color: string }> = {
  pending: { label: "Pending", bg: "rgba(245,158,11,0.15)", color: "#f59e0b" },
  preparing: { label: "Preparing", bg: "rgba(59,130,246,0.15)", color: "#3b82f6" },
  ready: { label: "Ready", bg: "rgba(139,92,246,0.15)", color: "#8b5cf6" },
  collected: { label: "Collected", bg: "rgba(34,197,94,0.15)", color: "#22c55e" },
  cancelled: { label: "Cancelled", bg: "rgba(239,68,68,0.15)", color: "#ef4444" },
};

const AVATAR_COLORS = [
  { bg: "rgba(59,130,246,0.15)", color: "#3b82f6" },
  { bg: "rgba(139,92,246,0.15)", color: "#8b5cf6" },
  { bg: "rgba(245,158,11,0.15)", color: "#f59e0b" },
  { bg: "rgba(34,197,94,0.15)", color: "#22c55e" },
  { bg: "rgba(236,72,153,0.15)", color: "#ec4899" },
  { bg: "rgba(20,184,166,0.15)", color: "#14b8a6" },
];

function formatTime(date: string | Date | null | undefined): string {
  if (!date) return "";
  return new Date(date).toLocaleTimeString("en-US", {
    hour: "numeric",
    minute: "2-digit",
  });
}

export function LiveOrdersPreview({ orders }: { orders: any[] }) {
  return (
    <div
      className="rounded-2xl border overflow-hidden"
      style={{
        background: "var(--bg-card)",
        borderColor: "var(--border-card)",
        boxShadow: "var(--shadow-card)",
      }}
    >
      {/* Header */}
      <div
        className="px-5 py-4 border-b flex items-center justify-between"
        style={{ borderColor: "var(--border-primary)" }}
      >
        <h2
          className="text-sm font-semibold flex items-center gap-2.5"
          style={{ color: "var(--text-primary)" }}
        >
          {/* Live pulse dot */}
          <span className="relative flex h-2 w-2">
            <span
              className="animate-ping absolute inline-flex h-full w-full rounded-full opacity-75"
              style={{ background: "#22c55e" }}
            />
            <span
              className="relative inline-flex rounded-full h-2 w-2"
              style={{ background: "#22c55e" }}
            />
          </span>
          Recent Orders
        </h2>
        <Link
          href="/canteen-staff/orders"
          className="flex items-center gap-1 text-xs font-medium transition-colors hover:text-[var(--text-primary)]"
          style={{ color: "var(--text-muted)" }}
        >
          View all <ArrowRight size={12} />
        </Link>
      </div>

      {orders.length === 0 ? (
        <div className="py-14 text-center">
          <p className="text-sm" style={{ color: "var(--text-muted)" }}>
            No orders yet today
          </p>
          <p className="text-xs mt-1" style={{ color: "var(--text-muted)", opacity: 0.6 }}>
            Orders will appear here as they come in
          </p>
        </div>
      ) : (
        <div className="divide-y" style={{ borderColor: "var(--border-primary)" }}>
          {orders.map((order, i) => {
            const meta = STATUS_META[order.status] ?? STATUS_META.pending;
            const avatarColor = AVATAR_COLORS[i % AVATAR_COLORS.length];
            const itemNames = order.orderItems
              ?.map((oi: any) => oi.menuItem?.name)
              .filter(Boolean)
              .join(", ");
            const hasAllergens = order.student?.allergens?.length > 0;
            const initial = order.student?.name?.[0]?.toUpperCase() ?? "?";

            return (
              <div
                key={order.id}
                className="px-5 py-3 flex items-center gap-3 transition-colors duration-150 cursor-default"
                style={{ ["--hover-bg" as string]: "var(--bg-tertiary)" }}
                onMouseEnter={(e) =>
                  (e.currentTarget.style.background = "var(--bg-tertiary)")
                }
                onMouseLeave={(e) =>
                  (e.currentTarget.style.background = "transparent")
                }
              >
                {/* Avatar */}
                <div
                  className="w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold flex-shrink-0"
                  style={{ background: avatarColor.bg, color: avatarColor.color }}
                >
                  {initial}
                </div>

                {/* Info */}
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-1.5 flex-wrap">
                    <p
                      className="text-[13px] font-medium"
                      style={{ color: "var(--text-primary)" }}
                    >
                      {order.student?.name ?? "Unknown"}
                    </p>
                    {hasAllergens && (
                      <span
                        className="px-1.5 py-0.5 rounded text-[10px] font-semibold flex-shrink-0"
                        style={{ background: "rgba(239,68,68,0.12)", color: "#ef4444" }}
                      >
                        ⚠ Allergens
                      </span>
                    )}
                  </div>
                  <p
                    className="text-[11px] truncate mt-0.5"
                    style={{ color: "var(--text-muted)" }}
                  >
                    {itemNames || "No items"}
                  </p>
                </div>

                {/* Right: status + time */}
                <div className="flex flex-col items-end gap-1 flex-shrink-0">
                  <span
                    className="px-2.5 py-1 rounded-full text-[11px] font-semibold"
                    style={{ background: meta.bg, color: meta.color }}
                  >
                    {meta.label}
                  </span>
                  {order.createdAt && (
                    <span
                      className="text-[10px]"
                      style={{ color: "var(--text-muted)", opacity: 0.6 }}
                    >
                      {formatTime(order.createdAt)}
                    </span>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}