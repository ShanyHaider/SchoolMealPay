import Link from "next/link";

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

const STATUS_CONFIG: Record<string, { label: string; className: string }> = {
  pending: { label: "Pending", className: "badge--warning" },
  preparing: { label: "Preparing", className: "badge--blue" },
  ready: { label: "Ready", className: "badge--success" },
  delivered: { label: "Collected", className: "badge--muted" },
  cancelled: { label: "Cancelled", className: "badge--danger" },
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
    <Link href={`/parent/orders/${order.id}`} className="order-row">
      <div className="order-row__left">
        <div className="order-row__icon">
          <i className="ti ti-shopping-bag" aria-hidden="true" />
        </div>
        <div className="order-row__details">
          <span className="order-row__items">{itemNames}</span>
          <span className="order-row__date">{formattedDate}</span>
        </div>
      </div>
      <div className="order-row__right">
        <span className={`badge ${config.className}`}>{config.label}</span>
        <span className="order-row__amount">
          ${parseFloat(order.totalAmount).toFixed(2)}
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
    <section className="dashboard-section">
      <div className="dashboard-section__header">
        <h2 className="dashboard-section__title">Recent orders</h2>
        <Link href="/parent/orders" className="dashboard-section__link">
          View all <i className="ti ti-arrow-right" aria-hidden="true" />
        </Link>
      </div>

      {orders.length === 0 ?
        <div className="empty-state">
          <i className="ti ti-shopping-bag" aria-hidden="true" />
          <p>No orders yet.</p>
          <Link href="/parent/menu" className="btn btn--primary">
            Browse menu
          </Link>
        </div>
      : <div className="orders-list">
          {orders.map((order) => (
            <OrderRow key={order.id} order={order} />
          ))}
        </div>
      }
    </section>
  );
}
