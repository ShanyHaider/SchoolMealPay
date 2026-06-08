// app/(dashboard)/school-admin/_components/RecentOrdersTable.tsx

import type { getRecentOrdersAdmin } from "@/db/queries/Admin";

type Order = Awaited<ReturnType<typeof getRecentOrdersAdmin>>[number];

const STATUS_STYLES: Record<string, { bg: string; color: string; label: string }> = {
  pending: { bg: "rgba(245,158,11,0.12)", color: "#f59e0b", label: "Pending" },
  preparing: { bg: "rgba(59,130,246,0.12)", color: "#3b82f6", label: "Preparing" },
  ready: { bg: "rgba(139,92,246,0.12)", color: "#8b5cf6", label: "Ready" },
  delivered: { bg: "rgba(34,197,94,0.12)", color: "#22c55e", label: "Delivered" },
  cancelled: { bg: "rgba(239,68,68,0.12)", color: "#ef4444", label: "Cancelled" },
};

export function RecentOrdersTable({ orders }: { orders: Order[] }) {
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
        <h2 className="text-sm font-semibold" style={{ color: "var(--text-primary)" }}>
          Recent Orders
        </h2>
        <span className="text-xs" style={{ color: "var(--text-muted)" }}>
          {orders.length} orders
        </span>
      </div>

      {orders.length === 0 ? (
        <div className="py-12 text-center">
          <p className="text-sm" style={{ color: "var(--text-muted)" }}>
            No orders yet
          </p>
        </div>
      ) : (
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr style={{ borderBottom: "1px solid var(--border-primary)" }}>
                {["Student", "Items", "Total", "Date", "Status"].map((h) => (
                  <th
                    key={h}
                    className="px-4 py-3 text-left text-xs font-medium"
                    style={{ color: "var(--text-muted)" }}
                  >
                    {h}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {orders.map((order, i) => {
                const style = STATUS_STYLES[order.status] ?? STATUS_STYLES.pending;

                // Build item summary from the typed relation
                const itemNames = order.orderItems
                  ?.slice(0, 2)
                  .map((oi) => oi.menuItem?.name ?? "Item")
                  .join(", ");
                const extraCount = (order.orderItems?.length ?? 0) - 2;

                return (
                  <tr
                    key={order.id}
                    className="transition-colors hover:bg-[var(--bg-secondary)]"
                    style={{
                      borderBottom:
                        i < orders.length - 1
                          ? "1px solid var(--border-primary)"
                          : undefined,
                    }}
                  >
                    <td className="px-4 py-3" style={{ color: "var(--text-primary)" }}>
                      <div className="font-medium">{order.student?.name ?? "—"}</div>
                      <div className="text-xs" style={{ color: "var(--text-muted)" }}>
                        {order.student?.studentCode}
                      </div>
                    </td>

                    <td
                      className="px-4 py-3 max-w-[160px] truncate"
                      style={{ color: "var(--text-secondary)" }}
                    >
                      {itemNames || "—"}
                      {extraCount > 0 && (
                        <span style={{ color: "var(--text-muted)" }}>
                          {" "}+{extraCount}
                        </span>
                      )}
                    </td>

                    <td className="px-4 py-3" style={{ color: "var(--text-primary)" }}>
                      Rs. {parseFloat(order.totalAmount ?? "0").toFixed(0)}
                    </td>

                    <td className="px-4 py-3" style={{ color: "var(--text-secondary)" }}>
                      {new Date(order.orderDate).toLocaleDateString("en-US", {
                        month: "short",
                        day: "numeric",
                      })}
                    </td>

                    <td className="px-4 py-3">
                      <span
                        className="px-2 py-0.5 rounded-full text-xs font-medium"
                        style={{ background: style.bg, color: style.color }}
                      >
                        {style.label}
                      </span>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}