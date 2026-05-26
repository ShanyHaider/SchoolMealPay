"use client";

import Link from "next/link";
import {
  Settings,
  ShieldAlert,
  CreditCard,
  Calendar,
  User,
  ChevronRight,
} from "lucide-react";
import { toggleStudentOrdering } from "@/db/actions/Students";

const ALLERGEN_COLORS: Record<string, string> = {
  nuts: "bg-zinc-100 text-zinc-900 border-zinc-200 dark:bg-zinc-800 dark:text-zinc-100 dark:border-zinc-700",
  gluten:
    "bg-zinc-100 text-zinc-900 border-zinc-200 dark:bg-zinc-800 dark:text-zinc-100 dark:border-zinc-700",
  dairy:
    "bg-zinc-100 text-zinc-900 border-zinc-200 dark:bg-zinc-800 dark:text-zinc-100 dark:border-zinc-700",
  eggs: "bg-zinc-100 text-zinc-900 border-zinc-200 dark:bg-zinc-800 dark:text-zinc-100 dark:border-zinc-700",
  soy: "bg-zinc-100 text-zinc-900 border-zinc-200 dark:bg-zinc-800 dark:text-zinc-100 dark:border-zinc-700",
  shellfish:
    "bg-zinc-100 text-zinc-900 border-zinc-200 dark:bg-zinc-800 dark:text-zinc-100 dark:border-zinc-700",
  fish: "bg-zinc-100 text-zinc-900 border-zinc-200 dark:bg-zinc-800 dark:text-zinc-100 dark:border-zinc-700",
  sesame:
    "bg-zinc-100 text-zinc-900 border-zinc-200 dark:bg-zinc-800 dark:text-zinc-100 dark:border-zinc-700",
};

export function ChildCard({ link }: { link: any }) {
  const { student } = link;
  const initials = student.name
    .split(" ")
    .map((n: any) => n[0])
    .join("")
    .toUpperCase()
    .slice(0, 2);

  return (
    <div className="bg-(--bg-card) border border-(--border-card) rounded-2xl p-6 shadow-sm hover:shadow-md transition-all group">
      <div className="flex flex-col md:flex-row md:items-center gap-6">
        {/* Avatar Section */}
        <div className="relative shrink-0 self-start md:self-center">
          <div className="w-16 h-16 rounded-2xl bg-blue-500/10 flex items-center justify-center text-xl font-bold text-blue-600 overflow-hidden border border-blue-500/20">
            {student.imageUrl ?
              <img
                src={student.imageUrl}
                alt={student.name}
                className="w-full h-full object-cover"
              />
            : initials}
          </div>
          <div
            className={`absolute -bottom-1 -right-1 w-5 h-5 rounded-full border-4 border-(--bg-card) ${student.orderingEnabled ? "bg-green-500" : "bg-gray-400"}`}
          />
        </div>

        {/* Info Section */}
        <div className="flex-1 min-w-0">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-4">
            <div>
              <h3 className="text-xl font-bold text-(--text-primary) group-hover:text-blue-600 transition-colors">
                {student.name}
              </h3>
              <div className="flex items-center gap-2 text-sm text-(--text-secondary) font-medium mt-0.5">
                <User size={14} className="text-(--text-muted)" />
                {student.class ?
                  <span>
                    Grade {student.class.grade} • Section{" "}
                    {student.class.section}
                  </span>
                : <span>ID: {student.studentCode}</span>}
              </div>
            </div>

            <div className="flex items-center gap-2">
              <form
                action={async () => {
                  await toggleStudentOrdering(
                    student.id,
                    !student.orderingEnabled,
                  );
                }}
              >
                <button
                  type="submit"
                  className={`text-xs px-4 py-2 rounded-xl font-bold transition-all active:scale-95 ${
                    student.orderingEnabled ?
                      "bg-green-500/10 text-green-600 hover:bg-green-500/20"
                    : "bg-(--bg-secondary) text-(--text-muted) hover:bg-(--bg-tertiary)"
                  }`}
                >
                  {student.orderingEnabled ?
                    "Ordering Active"
                  : "Ordering Paused"}
                </button>
              </form>
              <Link
                href={`/parent/children/${student.id}`}
                className="flex items-center justify-center w-10 h-10 rounded-xl bg-(--bg-secondary) text-(--text-secondary) hover:bg-blue-600 hover:text-white transition-all"
              >
                <Settings size={18} />
              </Link>
            </div>
          </div>

          {/* Metadata Grid */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 pt-4 border-t border-(--border-card)">
            {/* Allergens */}
            <div className="sm:col-span-1">
              <div className="flex items-center gap-1.5 text-[10px] font-bold text-(--text-muted) uppercase tracking-wider mb-2">
                <ShieldAlert size={12} />
                Allergens
              </div>
              <div className="flex flex-wrap gap-1.5">
                {student.allergens.length > 0 ?
                  student.allergens.map((a: any) => (
                    <span
                      key={a.allergen}
                      className={`text-[11px] px-2 py-0.5 rounded-lg font-bold ${ALLERGEN_COLORS[a.allergen] ?? "bg-(--bg-secondary) text-(--text-muted)"}`}
                    >
                      {a.allergen}
                    </span>
                  ))
                : <span className="text-xs text-(--text-muted) font-medium">
                    None reported
                  </span>
                }
              </div>
            </div>

            {/* Spending */}
            <div className="sm:col-span-1">
              <div className="flex items-center gap-1.5 text-[10px] font-bold text-(--text-muted) uppercase tracking-wider mb-2">
                <CreditCard size={12} />
                Daily Limit
              </div>
              <p className="text-sm font-bold text-(--text-primary)">
                {student.childProfile?.dailySpendingLimit ?
                  `$${parseFloat(student.childProfile.dailySpendingLimit).toFixed(2)}`
                : "Unlimited"}
              </p>
            </div>

            {/* Dietary */}
            <div className="sm:col-span-1">
              <div className="flex items-center gap-1.5 text-[10px] font-bold text-(--text-muted) uppercase tracking-wider mb-2">
                <Calendar size={12} />
                Dietary Notes
              </div>
              <p className="text-sm font-bold text-(--text-primary) truncate">
                {student.childProfile?.dietaryPreferences || "Standard Menu"}
              </p>
            </div>
          </div>
        </div>

        {/* Desktop Arrow */}
        <div className="hidden md:block">
          <ChevronRight
            size={20}
            className="text-(--text-muted) group-hover:text-blue-600 group-hover:translate-x-1 transition-all"
          />
        </div>
      </div>
    </div>
  );
}
