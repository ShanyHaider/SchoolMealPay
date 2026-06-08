// app/(dashboard)/parent/page.tsx

import { auth } from "@clerk/nextjs/server";
import { redirect } from "next/navigation";
import { getChildrenByParent } from "@/db/queries/Students";
import { getOrdersByParent } from "@/db/queries/Orders";
import { getAllCanteens } from "@/db/queries/Canteen";
import { getUnreadNotifications, getPendingApprovals } from "@/db/queries/Notifications";
import { getParentProSubscription } from "@/db/queries/Subscription";

import { StatsRow } from "./_components/StatsRow";
import { ChildrenCards } from "./_components/ChildrenCards";
import { RecentOrders } from "./_components/RecentOrders";
import { QuickActions, PendingApprovals } from "./_components/QuickActions";
import { getUserFromDb } from "@/features/users/queries";

export default async function ParentDashboardPage() {
  const { userId } = await auth();
  if (!userId) redirect("/sign-in");

  const dbUser = await getUserFromDb(userId);
  if (!dbUser) redirect("/sign-in");

  const [children, orders, notifications, approvals, canteens, sub] =
    await Promise.all([
      getChildrenByParent(dbUser.id),
      getOrdersByParent(dbUser.id),
      getUnreadNotifications(dbUser.id),
      getPendingApprovals(dbUser.id),
      getAllCanteens(),
      getParentProSubscription(dbUser.id),
    ]);

  const subscriptionStatus = sub?.status ?? null;

  const activeOrders = orders.filter(
    (o) => o.status === "pending" || o.status === "preparing",
  );

  const thisMonthSpend = orders
    .filter((o) => {
      const d = new Date(o.orderDate);
      const now = new Date();
      return (
        d.getMonth() === now.getMonth() &&
        d.getFullYear() === now.getFullYear() &&
        o.status !== "cancelled"
      );
    })
    .reduce((sum, o) => sum + parseFloat(o.totalAmount), 0);

  return (
    <div className="max-w-6xl mx-auto space-y-8">
      {/* Header */}
      <div>
        <h1
          className="text-2xl font-bold tracking-tight"
          style={{ color: "var(--text-primary)" }}
        >
          Good morning, {dbUser.name.split(" ")[0]} 👋
        </h1>
        <p className="text-sm mt-1" style={{ color: "var(--text-secondary)" }}>
          {new Date().toLocaleDateString("en-US", {
            weekday: "long",
            year: "numeric",
            month: "long",
            day: "numeric",
          })}
        </p>
      </div>

      {/* Stats — subscription-aware */}
      <StatsRow
        childCount={children.length}
        activeOrderCount={activeOrders.length}
        monthlySpend={thisMonthSpend}
        unreadCount={notifications.length}
        subscriptionStatus={subscriptionStatus}
      />

      {/* Main grid */}
      <div className="grid grid-cols-1 xl:grid-cols-[1fr_380px] gap-6 items-start">
        <div className="flex flex-col gap-6">
          <ChildrenCards
            children={children}
            canteens={canteens}
            parentId={dbUser.id}
          />
          <RecentOrders orders={orders.slice(0, 5)} />
        </div>

        <div className="flex flex-col gap-6">
          <QuickActions />
          {approvals.length > 0 && <PendingApprovals approvals={approvals} />}
        </div>
      </div>
    </div>
  );
}