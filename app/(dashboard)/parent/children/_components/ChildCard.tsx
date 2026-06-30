"use client";

import Link from "next/link";
import {
  Settings,
  ShieldAlert,
  CreditCard,
  Calendar,
  User,
  ChevronRight,
  Clock,
  TrendingUp,
  CheckCircle2,
  AlertCircle,
  Utensils,
} from "lucide-react";
import { toggleStudentOrdering } from "@/db/actions/Students";
import { StudentQRCode } from "./StudentQRCode";
import type { ChildActivitySummary } from "@/db/queries/ChildActivity";
import { formatPKR } from "@/lib/currency";

const ALLERGEN_COLORS: Record<string, string> = {
  nuts: "bg-zinc-100 text-zinc-900 border-zinc-200 dark:bg-zinc-800 dark:text-zinc-100 dark:border-zinc-700",
  gluten: "bg-zinc-100 text-zinc-900 border-zinc-200 dark:bg-zinc-800 dark:text-zinc-100 dark:border-zinc-700",
  dairy: "bg-zinc-100 text-zinc-900 border-zinc-200 dark:bg-zinc-800 dark:text-zinc-100 dark:border-zinc-700",
  eggs: "bg-zinc-100 text-zinc-900 border-zinc-200 dark:bg-zinc-800 dark:text-zinc-100 dark:border-zinc-700",
  soy: "bg-zinc-100 text-zinc-900 border-zinc-200 dark:bg-zinc-800 dark:text-zinc-100 dark:border-zinc-700",
  shellfish: "bg-zinc-100 text-zinc-900 border-zinc-200 dark:bg-zinc-800 dark:text-zinc-100 dark:border-zinc-700",
  fish: "bg-zinc-100 text-zinc-900 border-zinc-200 dark:bg-zinc-800 dark:text-zinc-100 dark:border-zinc-700",
  sesame: "bg-zinc-100 text-zinc-900 border-zinc-200 dark:bg-zinc-800 dark:text-zinc-100 dark:border-zinc-700",
};

const STATUS_CONFIG: Record<string, { label: string; className: string; icon: React.ReactNode }> = {
  pending: {
    label: "Order pending",
    className: "bg-amber-500/10 text-amber-600 border-amber-500/20",
    icon: <Clock size={11} />,
  },
  ready: {
    label: "Ready to collect",
    className: "bg-blue-500/10 text-blue-600 border-blue-500/20",
    icon: <CheckCircle2 size={11} />,
  },
  delivered: {
    label: "Collected",
    className: "bg-green-500/10 text-green-600 border-green-500/20",
    icon: <CheckCircle2 size={11} />,
  },
};

function fmtDate(iso: string) {
  const d = new Date(iso + "T00:00:00");
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const yesterday = new Date(today);
  yesterday.setDate(today.getDate() - 1);

  if (d.getTime() === today.getTime()) return "Today";
  if (d.getTime() === yesterday.getTime()) return "Yesterday";
  return d.toLocaleDateString("en-US", { weekday: "short", month: "short", day: "numeric" });
}

interface ChildCardProps {
  link: any;
  activity?: ChildActivitySummary;
}

export function ChildCard({ link, activity }: ChildCardProps) {
  const { student } = link;
  const initials = student.name
    .split(" ")
    .map((n: any) => n[0])
    .join("")
    .toUpperCase()
    .slice(0, 2);

  const weeklyLimit = student.childProfile?.weeklySpendingLimit
    ? parseFloat(student.childProfile.weeklySpendingLimit)
    : null;
  const weeklySpend = activity?.weeklySpend ?? 0;
  const weeklyPct = weeklyLimit ? Math.min((weeklySpend / weeklyLimit) * 100, 100) : null;

  const todayStatus = activity?.todayOrder
    ? (STATUS_CONFIG[activity.todayOrder.status] ?? null)
    : null;

  return (
    <div className="bg-(--bg-card) border border-(--border-card) rounded-2xl shadow-sm hover:shadow-md transition-all group overflow-hidden">
      <div className="p-6">
        <div className="flex flex-col md:flex-row md:items-center gap-6">

          {/* ── Avatar ───────────────────────────────────────────────────── */}
          <div className="relative shrink-0 self-start md:self-center">
            <div className="w-16 h-16 rounded-2xl bg-blue-500/10 flex items-center justify-center text-xl font-bold text-blue-600 overflow-hidden border border-blue-500/20">
              {student.imageUrl ? (
                <img src={student.imageUrl} alt={student.name} className="w-full h-full object-cover" />
              ) : initials}
            </div>
            <div
              className={`absolute -bottom-1 -right-1 w-5 h-5 rounded-full border-4 border-(--bg-card) ${student.orderingEnabled ? "bg-green-500" : "bg-gray-400"}`}
            />
          </div>

          {/* ── Name + controls ───────────────────────────────────────────── */}
          <div className="flex-1 min-w-0">
            <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-4 mb-4">
              <div>
                <div className="flex items-center gap-2.5 flex-wrap">
                  <h3 className="text-xl font-bold text-(--text-primary) group-hover:text-blue-600 transition-colors">
                    {student.name}
                  </h3>
                  {/* Today's order status badge */}
                  {todayStatus ? (
                    <span className={`inline-flex items-center gap-1 text-[10px] font-bold px-2 py-0.5 rounded-lg border ${todayStatus.className}`}>
                      {todayStatus.icon}
                      {todayStatus.label}
                    </span>
                  ) : (
                    <span className="inline-flex items-center gap-1 text-[10px] font-bold px-2 py-0.5 rounded-lg border border-zinc-200 dark:border-zinc-700 bg-zinc-100 dark:bg-zinc-800 text-zinc-500 dark:text-zinc-400">
                      <AlertCircle size={11} />
                      No order today
                    </span>
                  )}
                </div>
                <div className="flex items-center gap-2 text-sm text-(--text-secondary) font-medium mt-1">
                  <User size={14} className="text-(--text-muted)" />
                  {student.class ? (
                    <span>Grade {student.class.grade} • Section {student.class.section}</span>
                  ) : (
                    <span>ID: {student.studentCode}</span>
                  )}
                </div>
              </div>

              <div className="flex items-center gap-2 shrink-0">
                <form action={async () => { await toggleStudentOrdering(student.id, !student.orderingEnabled); }}>
                  <button
                    type="submit"
                    className={`text-xs px-4 py-2 rounded-xl font-bold transition-all active:scale-95 ${student.orderingEnabled
                      ? "bg-green-500/10 text-green-600 hover:bg-green-500/20"
                      : "bg-(--bg-secondary) text-(--text-muted) hover:bg-(--bg-tertiary)"
                      }`}
                  >
                    {student.orderingEnabled ? "Ordering Active" : "Ordering Paused"}
                  </button>
                </form>
                <StudentQRCode
                  studentId={student.id}
                  studentName={student.name}
                  className={student.class ? `Grade ${student.class.grade} · Section ${student.class.section}` : student.studentCode}
                  photoUrl={student.imageUrl}
                />
                <Link
                  href={`/parent/children/${student.id}`}
                  className="flex items-center justify-center w-10 h-10 rounded-xl bg-(--bg-secondary) text-(--text-secondary) hover:bg-blue-600 hover:text-white transition-all"
                >
                  <Settings size={18} />
                </Link>
              </div>
            </div>

            {/* ── Stats row ─────────────────────────────────────────────── */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 pt-4 border-t border-(--border-card)">

              {/* Allergens */}
              <div className="col-span-2 sm:col-span-1">
                <div className="flex items-center gap-1.5 text-[10px] font-bold text-(--text-muted) uppercase tracking-wider mb-2">
                  <ShieldAlert size={12} />
                  Allergens
                </div>
                <div className="flex flex-wrap gap-1.5">
                  {student.allergens.length > 0 ? (
                    student.allergens.map((a: any) => (
                      <span
                        key={a.allergen}
                        className={`text-[11px] px-2 py-0.5 rounded-lg font-bold border ${ALLERGEN_COLORS[a.allergen] ?? "bg-(--bg-secondary) text-(--text-muted)"}`}
                      >
                        {a.allergen}
                      </span>
                    ))
                  ) : (
                    <span className="text-xs text-(--text-muted) font-medium">None reported</span>
                  )}
                </div>
              </div>

              {/* Weekly spend */}
              <div>
                <div className="flex items-center gap-1.5 text-[10px] font-bold text-(--text-muted) uppercase tracking-wider mb-2">
                  <TrendingUp size={12} />
                  This week
                </div>
                <p className="text-sm font-bold text-(--text-primary)">
                  {formatPKR(weeklySpend)}
                </p>
                {weeklyLimit && (
                  <p className="text-[10px] text-(--text-muted) font-medium mt-0.5">
                    of {formatPKR(weeklyLimit)} limit
                  </p>
                )}
              </div>

              {/* Daily limit */}
              <div>
                <div className="flex items-center gap-1.5 text-[10px] font-bold text-(--text-muted) uppercase tracking-wider mb-2">
                  <CreditCard size={12} />
                  Daily limit
                </div>
                <p className="text-sm font-bold text-(--text-primary)">
                  {student.childProfile?.dailySpendingLimit
                    ? `${formatPKR(student.childProfile.dailySpendingLimit)}`
                    : "Unlimited"}
                </p>
              </div>

              {/* Last meal */}
              <div>
                <div className="flex items-center gap-1.5 text-[10px] font-bold text-(--text-muted) uppercase tracking-wider mb-2">
                  <Utensils size={12} />
                  Last meal
                </div>
                {activity?.lastMeal ? (
                  <>
                    <p className="text-sm font-bold text-(--text-primary) truncate" title={activity.lastMeal.name}>
                      {activity.lastMeal.name}
                    </p>
                    <p className="text-[10px] text-(--text-muted) font-medium mt-0.5">
                      {fmtDate(activity.lastMeal.date)}
                    </p>
                  </>
                ) : (
                  <p className="text-xs text-(--text-muted) font-medium">No history yet</p>
                )}
              </div>
            </div>
          </div>

          {/* Desktop arrow */}
          <div className="hidden md:block">
            <ChevronRight
              size={20}
              className="text-(--text-muted) group-hover:text-blue-600 group-hover:translate-x-1 transition-all"
            />
          </div>
        </div>
      </div>

      {/* ── Weekly spend progress bar (only when limit is set) ────────────── */}
      {weeklyPct !== null && (
        <div className="px-6 pb-4">
          <div className="h-1 w-full bg-(--bg-secondary) rounded-full overflow-hidden">
            <div
              className={`h-full rounded-full transition-all ${weeklyPct >= 90
                ? "bg-red-500"
                : weeklyPct >= 70
                  ? "bg-amber-500"
                  : "bg-green-500"
                }`}
              style={{ width: `${weeklyPct}%` }}
            />
          </div>
          <p className="text-[9px] text-(--text-muted) font-medium mt-1 text-right">
            {Math.round(weeklyPct)}% of weekly budget used
          </p>
        </div>
      )}
    </div>
  );
}