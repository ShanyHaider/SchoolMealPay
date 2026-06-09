import { currentUser } from "@clerk/nextjs/server";
import { redirect } from "next/navigation";
import { getOrdersByParent } from "@/db/queries/Orders";
import Link from "next/link";
import { OrderDetailsPage } from "./_components/OrderDetailsPage";
import { Plus, ShoppingBag, ChevronRight } from "lucide-react";
import { getUserFromDb } from "@/features/users/queries";
import { InferSelectModel } from "drizzle-orm";
import { ordersTable } from "@/drizzle/schema";

const STATUS_CONFIG = {
  pending: {
    label: "Pending",
    bg: "bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400",
  },
  preparing: {
    label: "Preparing",
    bg: "bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400",
  },
  ready: {
    label: "Ready",
    bg: "bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400",
  },
  delivered: {
    label: "Collected",
    bg: "bg-(--bg-tertiary) text-(--text-muted)",
  },
  cancelled: {
    label: "Cancelled",
    bg: "bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400",
  },
} as const;

export default async function OrdersPage({
  searchParams,
}: {
  searchParams: Promise<{ status?: string }>
}) {
  const clerkUser = await currentUser();
  if (!clerkUser) redirect("/sign-in");
  const dbUser = await getUserFromDb(clerkUser.id);
  if (!dbUser) redirect("/sign-in");

  const { status } = await searchParams; // 
  const allOrders = await getOrdersByParent(dbUser.id);
  const activeFilter = status ?? "all";

  const filtered =
    activeFilter === "all"
      ? allOrders
      : allOrders.filter((o) => o.status === activeFilter);

  type Order = InferSelectModel<typeof ordersTable> & {
    orderItems: { quantity: number; menuItem: { name: string } | null }[];
  };

  const tabs = [
    { key: "all", label: "All", count: allOrders.length },
    {
      key: "pending",
      label: "Pending",
      count: allOrders.filter((o) => o.status === "pending").length,
    },
    {
      key: "preparing",
      label: "Preparing",
      count: allOrders.filter((o) => o.status === "preparing").length,
    },
    {
      key: "ready",
      label: "Ready",
      count: allOrders.filter((o) => o.status === "ready").length,
    },
    {
      key: "delivered",
      label: "Collected",
      count: allOrders.filter((o) => o.status === "delivered").length,
    },
    {
      key: "cancelled",
      label: "Cancelled",
      count: allOrders.filter((o) => o.status === "cancelled").length,
    },
  ];

  return (
    <div className="flex flex-col gap-6 max-w-6xl mx-auto">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-semibold text-(--text-primary) tracking-tight">
            Orders
          </h1>
          <p className="text-sm text-(--text-secondary) mt-1">
            Track all meal orders for your children.
          </p>
        </div>
        <Link
          href="/parent/menu"
          className="flex items-center gap-2 px-4 py-2 bg-(--accent) text-(--accent-text) rounded-lg text-sm font-medium hover:bg-(--accent-hover) transition-colors"
        >
          <Plus size={18} />
          New order
        </Link>
      </div>

      <OrderDetailsPage tabs={tabs} />

      {/* Orders list */}
      {filtered.length === 0 ?
        <div className="flex flex-col items-center gap-3 py-20 bg-(--bg-card) border border-(--border-card) rounded-xl">
          <ShoppingBag
            size={48}
            className="text-(--text-muted)"
            strokeWidth={1}
          />
          <p className="text-(--text-secondary)">No orders found.</p>
        </div>
        : <div className="flex flex-col gap-3">
          {filtered.map((order) => {
            const status = (order.status ??
              "pending") as keyof typeof STATUS_CONFIG;
            const config = STATUS_CONFIG[status] ?? STATUS_CONFIG.pending;

            const itemNames = order.orderItems
              .map((i) => `${i.quantity}× ${i.menuItem?.name ?? "Item"}`)
              .join(", ");

            const formattedDate = new Date(order.orderDate).toLocaleDateString(
              "en-US",
              {
                weekday: "short",
                month: "short",
                day: "numeric",
              },
            );

            return (
              <Link
                key={order.id}
                href={`/parent/orders/${order.id}`}
                className="flex items-center gap-4 p-4 bg-(--bg-card) border border-(--border-card) rounded-xl hover:border-(--border-primary) transition-colors shadow-(--shadow-card)"
              >
                <div className="w-10 h-10 rounded-lg bg-(--bg-tertiary) flex items-center justify-center shrink-0 text-(--text-secondary)">
                  <ShoppingBag size={20} />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-(--text-primary) truncate leading-tight">
                    {itemNames}
                  </p>
                  <p className="text-xs text-(--text-muted) mt-1 font-medium">
                    {formattedDate}
                  </p>
                </div>
                <div className="flex items-center gap-3 shrink-0">
                  <span
                    className={`text-[10px] px-2.5 py-1 rounded-full font-bold uppercase tracking-wider ${config.bg}`}
                  >
                    {config.label}
                  </span>
                  <span className="text-sm font-semibold text-(--text-primary)">
                    ${parseFloat(order.totalAmount).toFixed(2)}
                  </span>
                  <ChevronRight size={18} className="text-(--text-muted)" />
                </div>
              </Link>
            );
          })}
        </div>
      }
    </div>
  );
}
