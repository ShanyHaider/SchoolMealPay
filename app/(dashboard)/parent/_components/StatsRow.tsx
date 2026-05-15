interface StatsRowProps {
  childCount: number;
  activeOrderCount: number;
  monthlySpend: number;
  unreadCount: number;
}

interface StatCardProps {
  label: string;
  value: string | number;
  icon: string;
  iconColor: string;
  sub?: string;
}

function StatCard({ label, value, icon, iconColor, sub }: StatCardProps) {
  return (
    <div className="stat-card">
      <div className="stat-card__top">
        <span className="stat-card__label">{label}</span>
        <div className={`stat-card__icon stat-card__icon--${iconColor}`}>
          <i className={`ti ${icon}`} aria-hidden="true" />
        </div>
      </div>
      <div className="stat-card__value">{value}</div>
      {sub && <div className="stat-card__sub">{sub}</div>}
    </div>
  );
}

export function StatsRow({
  childCount,
  activeOrderCount,
  monthlySpend,
  unreadCount,
}: StatsRowProps) {
  return (
    <div className="stats-row">
      <StatCard
        label="Children"
        value={childCount}
        icon="ti-users"
        iconColor="blue"
        sub={
          childCount === 1 ? "1 linked profile" : (
            `${childCount} linked profiles`
          )
        }
      />
      <StatCard
        label="Active Orders"
        value={activeOrderCount}
        icon="ti-shopping-bag"
        iconColor="amber"
        sub={activeOrderCount === 0 ? "No pending orders" : "In progress"}
      />
      <StatCard
        label="Monthly Spend"
        value={`$${monthlySpend.toFixed(2)}`}
        icon="ti-wallet"
        iconColor="green"
        sub="This month"
      />
      <StatCard
        label="Notifications"
        value={unreadCount}
        icon="ti-bell"
        iconColor="purple"
        sub={unreadCount === 0 ? "All caught up" : "Unread"}
      />
    </div>
  );
}
