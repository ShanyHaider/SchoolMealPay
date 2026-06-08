// app/(dashboard)/school-admin/page.tsx

import {
  getAdminOverviewStats,
  getRecentOrdersAdmin,
  getPendingParentLinks,
  getSchoolProfile,
} from "@/db/queries/Admin";
import { StatCard } from "./_components/StatsCard";
import { RecentOrdersTable } from "./_components/RecentOrdersTable";
import { PendingLinksCard } from "./_components/PendingLinksCard";
import {
  Users,
  UtensilsCrossed,
  ShoppingBag,
  DollarSign,
  Clock,
  Building2,
} from "lucide-react";
import Link from "next/link";

export default async function AdminOverviewPage() {
  const [stats, recentOrders, pendingLinks, school] = await Promise.all([
    getAdminOverviewStats(),
    getRecentOrdersAdmin(8),
    getPendingParentLinks(),
    getSchoolProfile(),
  ]);

  return (
    <div className="max-w-6xl mx-auto space-y-8">

      {/* Header */}
      <div>
        <h1
          className="text-2xl font-bold tracking-tight"
          style={{ color: "var(--text-primary)" }}
        >
          {school?.name ?? "School"} Dashboard
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

      {/* Stats grid */}
      <div className="grid grid-cols-2 lg:grid-cols-3 xl:grid-cols-6 gap-4">
        <StatCard
          label="Total Students"
          value={stats.studentCount}
          icon={Users}
          href="/school-admin/students"
          color="blue"
        />
        <StatCard
          label="Staff Members"
          value={stats.staffCount}
          icon={UtensilsCrossed}
          href="/school-admin/staff"
          color="purple"
        />
        <StatCard
          label="Canteens"
          value={stats.canteenCount}
          icon={Building2}
          href="/school-admin/canteen"
          color="green"
        />
        <StatCard
          label="Today's Orders"
          value={stats.todayOrderCount}
          icon={ShoppingBag}
          href="/school-admin/reports"
          color="amber"
        />
        <StatCard
          label="Pending Links"
          value={stats.pendingLinks}
          icon={Clock}
          href="/school-admin/students"
          color={stats.pendingLinks > 0 ? "red" : "gray"}
        />
        <StatCard
          label="Month Revenue"
          value={`Rs. ${stats.monthRevenue.toLocaleString()}`}
          icon={DollarSign}
          href="/school-admin/reports"
          color="emerald"
          small
        />
      </div>

      {/* Main content */}
      <div className="grid grid-cols-1 xl:grid-cols-[1fr_360px] gap-6">
        <RecentOrdersTable orders={recentOrders} />
        <PendingLinksCard links={pendingLinks} />
      </div>

      {/* Quick actions */}
      <div
        className="rounded-xl border p-5"
        style={{
          background: "var(--bg-card)",
          borderColor: "var(--border-card)",
          boxShadow: "var(--shadow-card)",
        }}
      >
        <h2
          className="text-sm font-semibold mb-4"
          style={{ color: "var(--text-primary)" }}
        >
          Quick Actions
        </h2>
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
          {[
            { label: "Add Student", href: "/school-admin/students", emoji: "🎓" },
            { label: "Schedule Menu", href: "/school-admin/menu", emoji: "📅" },
            { label: "View Reports", href: "/school-admin/reports", emoji: "📊" },
            { label: "School Profile", href: "/school-admin/profile", emoji: "🏫" },
          ].map(({ label, href, emoji }) => (
            <Link
              key={href}
              href={href}
              className="flex flex-col items-center gap-2 p-4 rounded-lg border text-center transition-all hover:scale-[1.02]"
              style={{
                background: "var(--bg-secondary)",
                borderColor: "var(--border-card)",
              }}
            >
              <span className="text-2xl">{emoji}</span>
              <span className="text-xs font-medium" style={{ color: "var(--text-secondary)" }}>
                {label}
              </span>
            </Link>
          ))}
        </div>
      </div>
    </div>
  );
}