import Link from "next/link";
import { resolveSpendingApproval } from "@/db/actions/Notifications";

// ─── Quick Actions ─────────────────────────────────────────────

const ACTIONS = [
  {
    label: "Order a meal",
    href: "/parent/menu",
    icon: "ti-tools-kitchen-2",
    color: "blue",
  },
  {
    label: "View nutrition",
    href: "/parent/nutrition",
    icon: "ti-salad",
    color: "green",
  },
  {
    label: "Spending limits",
    href: "/parent/spending",
    icon: "ti-wallet",
    color: "amber",
  },
  {
    label: "Link a child",
    href: "/parent/children/link",
    icon: "ti-user-plus",
    color: "purple",
  },
] as const;

export function QuickActions() {
  return (
    <section className="dashboard-section">
      <div className="dashboard-section__header">
        <h2 className="dashboard-section__title">Quick actions</h2>
      </div>
      <div className="quick-actions">
        {ACTIONS.map((action) => (
          <Link key={action.href} href={action.href} className="quick-action">
            <div
              className={`quick-action__icon quick-action__icon--${action.color}`}
            >
              <i className={`ti ${action.icon}`} aria-hidden="true" />
            </div>
            <span className="quick-action__label">{action.label}</span>
            <i
              className="ti ti-chevron-right quick-action__arrow"
              aria-hidden="true"
            />
          </Link>
        ))}
      </div>
    </section>
  );
}

// ─── Pending Approvals ─────────────────────────────────────────

type Approval = {
  id: string;
  orderAmount: string;
  status: string;
  parentId: string; // required for resolveSpendingApproval
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
  const itemNames = approval.order?.orderItems
    .map((i) => `${i.quantity}x ${i.menuItem?.name ?? "Item"}`)
    .join(", ");

  async function handleApprove() {
    "use server";
    await resolveSpendingApproval(approval.id, approval.parentId, "approved");
  }

  async function handleReject() {
    "use server";
    await resolveSpendingApproval(
      approval.id,
      approval.parentId,
      "rejected",
      "Declined by parent",
    );
  }

  return (
    <div className="approval-card">
      <div className="approval-card__header">
        <div className="approval-card__icon">
          <i className="ti ti-alert-triangle" aria-hidden="true" />
        </div>
        <div>
          <p className="approval-card__name">{approval.student?.name}</p>
          <p className="approval-card__amount">
            ${parseFloat(approval.orderAmount).toFixed(2)} — exceeds limit
          </p>
        </div>
      </div>

      {itemNames && <p className="approval-card__items">{itemNames}</p>}

      <div className="approval-card__actions">
        <form action={handleApprove}>
          <button type="submit" className="btn btn--success btn--sm">
            Approve
          </button>
        </form>
        <form action={handleReject}>
          <button type="submit" className="btn btn--danger btn--sm">
            Decline
          </button>
        </form>
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
    <section className="dashboard-section">
      <div className="dashboard-section__header">
        <h2 className="dashboard-section__title">
          Needs approval
          <span className="badge badge--warning" style={{ marginLeft: 8 }}>
            {approvals.length}
          </span>
        </h2>
      </div>
      <div className="approvals-list">
        {approvals.map((a) => (
          <ApprovalCard key={a.id} approval={a} />
        ))}
      </div>
    </section>
  );
}
