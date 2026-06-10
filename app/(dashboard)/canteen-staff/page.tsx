import { currentUser } from "@clerk/nextjs/server";
import { redirect } from "next/navigation";
import {
  getStaffCanteen,
  getStaffOverviewStats,
  getTodayOrders,
  getTodayMenu,
} from "@/db/queries/Staff";
import { StaffStatCards } from "./_components/StaffStatCards";
import { LiveOrdersPreview } from "./_components/LiveOrdersPreview";
import { TodayMenuPreview } from "./_components/TodayMenuPreview";
import Link from "next/link";
import { QrCode, ClipboardList } from "lucide-react";
import { getUserFromDb } from "@/features/users/queries";

export default async function CanteenStaffPage() {
  const clerkUser = await currentUser();
  if (!clerkUser) redirect("/sign-in");
  const dbUser = await getUserFromDb(clerkUser.id);
  if (!dbUser) redirect("/sign-in");

  const canteen = await getStaffCanteen(dbUser.id);
  const today = new Date().toISOString().split("T")[0];

  if (!canteen) {
    return (
      <div className="max-w-6xl mx-auto mt-20 text-center">
        <div
          className="rounded-2xl border p-10 max-w-sm mx-auto"
          style={{
            background: "var(--bg-card)",
            borderColor: "var(--border-card)",
            boxShadow: "var(--shadow-card)",
          }}
        >
          <div
            className="w-12 h-12 rounded-2xl flex items-center justify-center mx-auto mb-4"
            style={{ background: "rgba(245,158,11,0.12)" }}
          >
            <ClipboardList size={22} style={{ color: "#f59e0b" }} />
          </div>
          <h2
            className="text-base font-semibold mb-2"
            style={{ color: "var(--text-primary)" }}
          >
            No Canteen Assigned
          </h2>
          <p className="text-sm leading-relaxed" style={{ color: "var(--text-secondary)" }}>
            You haven&apos;t been assigned to a canteen yet. Contact your school
            administrator to get set up.
          </p>
        </div>
      </div>
    );
  }

  const [stats, orders, todayMenu] = await Promise.all([
    getStaffOverviewStats(canteen.id),
    getTodayOrders(canteen.id, today),
    getTodayMenu(canteen.id),
  ]);

  const firstName = dbUser.name.split(" ")[0];

  return (
    <div className="max-w-6xl mx-auto space-y-7">
      {/* Header */}
      <div className="flex items-start justify-between gap-4">
        <div>
          <h1
            className="text-2xl font-bold tracking-tight"
            style={{ color: "var(--text-primary)" }}
          >
            Good {getGreeting()}, {firstName} 👋
          </h1>
          <p className="text-sm mt-1" style={{ color: "var(--text-secondary)" }}>
            {canteen.name} ·{" "}
            {new Date().toLocaleDateString("en-US", {
              weekday: "long",
              month: "long",
              day: "numeric",
            })}
          </p>
        </div>

        <Link
          href="/canteen-staff/qr-scan"
          className="flex items-center gap-2 px-5 py-2.5 rounded-xl text-sm font-semibold transition-all hover:scale-[1.02] hover:brightness-110 flex-shrink-0"
          style={{
            background: "#f59e0b",
            color: "#1a0f00",
            boxShadow: "0 2px 12px rgba(245,158,11,0.3)",
          }}
        >
          <QrCode size={15} />
          Scan QR
        </Link>
      </div>

      {/* Stat cards */}
      <StaffStatCards stats={stats} />

      {/* Main grid */}
      <div className="grid grid-cols-1 xl:grid-cols-[1fr_320px] gap-5">
        <LiveOrdersPreview orders={orders.slice(0, 6)} />
        <TodayMenuPreview menuItems={todayMenu} />
      </div>
    </div>
  );
}

function getGreeting() {
  const h = new Date().getHours();
  if (h < 12) return "morning";
  if (h < 17) return "afternoon";
  return "evening";
}