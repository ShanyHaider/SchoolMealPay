import { currentUser } from "@clerk/nextjs/server";
import { redirect } from "next/navigation";
import { getUser } from "@/db/queries/Users";
import { getChildrenByParent } from "@/db/queries/Students";
import { getOrdersByParent } from "@/db/queries/Orders";
import {
  getUnreadNotifications,
  getPendingApprovals,
} from "@/db/queries/Notifications";
import { StatsRow } from "./_components/StatsRow";
import { ChildrenCards } from "./_components/ChildrenCards"; // ← plural, takes children[]
import { RecentOrders } from "./_components/RecentOrders";
import { PendingApprovals, QuickActions } from "./_components/QuickActions";

export default async function ParentDashboardPage() {
  const clerkUser = await currentUser();
  if (!clerkUser) redirect("/sign-in");

  const dbUser = await getUser(clerkUser.id);
  if (!dbUser) redirect("/sign-in");

  const [children, orders, notifications, approvals] = await Promise.all([
    getChildrenByParent(dbUser.id),
    getOrdersByParent(dbUser.id),
    getUnreadNotifications(dbUser.id),
    getPendingApprovals(dbUser.id),
  ]);

  const activeOrders = orders.filter(
    (o) => o.status === "pending" || o.status === "preparing",
  );

  const thisMonthSpend = orders
    .filter((o) => {
      const orderDate = new Date(o.orderDate);
      const now = new Date();
      return (
        orderDate.getMonth() === now.getMonth() &&
        orderDate.getFullYear() === now.getFullYear() &&
        o.status !== "cancelled"
      );
    })
    .reduce((sum, o) => sum + parseFloat(o.totalAmount), 0);

  return (
    <div className="w-full max-w-6xl mx-auto">
      <div className="flex flex-col w-full">
        {/* Header */}
        <header className="mb-10">
          <div className="flex items-center gap-2 mb-1">
            <h1 className="text-3xl font-bold tracking-tight text-[var(--text-primary)]">
              Good morning, {dbUser.name.split(" ")[0]}
            </h1>
            <span className="text-3xl">👋</span>
          </div>
          <p className="text-sm md:text-base text-[var(--text-secondary)] font-medium">
            Here's what's happening with your children today.
          </p>
        </header>

        {/* Stats */}
        <div className="mb-10">
          <StatsRow
            childCount={children.length}
            activeOrderCount={activeOrders.length}
            monthlySpend={thisMonthSpend}
            unreadCount={notifications.length}
          />
        </div>

        {/* Main grid */}
        <div className="grid grid-cols-1 xl:grid-cols-[1fr_380px] gap-8 items-start">
          {/* Left column */}
          <div className="flex flex-col gap-8">
            <ChildrenCards children={children} />
            <RecentOrders orders={orders.slice(0, 5)} />
          </div>

          {/* Right column */}
          <div className="flex flex-col gap-8">
            <QuickActions />
            {approvals.length > 0 && <PendingApprovals approvals={approvals} />}
          </div>
        </div>
      </div>
    </div>
  );
}
