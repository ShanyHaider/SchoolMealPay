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
// This is already a Server Action because the file it comes from has "use server" at the top
import { toggleStudentOrdering } from "@/db/actions/Students";

// ... (ChildLink type stays the same)
type ChildLink = {
  id: string;
  status: string;
  student: {
    id: string;
    name: string;
    studentCode: string;
    orderingEnabled: boolean;
    imageUrl: string | null;
    classId: string | null;
    class?: { grade: string; section: string } | null;
    childProfile?: {
      dailySpendingLimit: string | null;
      weeklySpendingLimit: string | null;
      dietaryPreferences: string | null;
    } | null;
    allergens: { allergen: string }[];
  };
};

function ChildCard({ link }: { link: ChildLink }) {
  const { student } = link;

  const initials = student.name
    .split(" ")
    .map((n) => n[0])
    .join("")
    .toUpperCase()
    .slice(0, 2);

  // Helper to handle the click without the 'use server' syntax error
  const handleToggle = async () => {
    await toggleStudentOrdering(student.id, !student.orderingEnabled);
  };

  return (
    <div className="bg-white dark:bg-zinc-900 border border-gray-200 dark:border-zinc-800 rounded-2xl p-6 shadow-sm hover:border-black dark:hover:border-white transition-all group">
      <div className="flex flex-col md:flex-row md:items-center gap-6">
        {/* Avatar */}
        <div className="relative shrink-0 self-start md:self-center">
          <div className="w-16 h-16 rounded-2xl bg-gray-100 dark:bg-zinc-800 flex items-center justify-center text-xl font-bold text-black dark:text-white overflow-hidden border border-gray-200 dark:border-zinc-700">
            {student.imageUrl ?
              <img
                src={student.imageUrl}
                alt={student.name}
                className="w-full h-full object-cover"
              />
            : initials}
          </div>
          <div
            className={`absolute -bottom-1 -right-1 w-5 h-5 rounded-full border-4 border-white dark:border-zinc-900 ${
              student.orderingEnabled ?
                "bg-black dark:bg-white"
              : "bg-gray-300 dark:bg-zinc-600"
            }`}
          />
        </div>

        {/* Info */}
        <div className="flex-1 min-w-0">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-4">
            <div>
              <h3 className="text-xl font-bold text-black dark:text-white">
                {student.name}
              </h3>
              <div className="flex items-center gap-2 text-sm text-gray-500 font-medium mt-0.5">
                <User size={14} />
                {student.class ?
                  <span>
                    Grade {student.class.grade} • Section{" "}
                    {student.class.section}
                  </span>
                : <span>ID: {student.studentCode}</span>}
              </div>
            </div>

            <div className="flex items-center gap-2">
              {/* Corrected: Removed the form action 'use server' block */}
              <button
                onClick={handleToggle}
                className={`text-xs px-4 py-2 rounded-xl font-bold transition-all border ${
                  student.orderingEnabled ?
                    "bg-black text-white border-black dark:bg-white dark:text-black"
                  : "bg-white text-gray-400 border-gray-200 hover:text-black hover:border-black dark:bg-zinc-900 dark:border-zinc-700"
                }`}
              >
                {student.orderingEnabled ?
                  "Ordering Enabled"
                : "Ordering Paused"}
              </button>

              <Link
                href={`/parent/children/${student.id}`}
                className="flex items-center justify-center w-10 h-10 rounded-xl bg-gray-100 dark:bg-zinc-800 text-gray-600 dark:text-gray-400 hover:bg-black hover:text-white dark:hover:bg-white dark:hover:text-black transition-all"
              >
                <Settings size={18} />
              </Link>
            </div>
          </div>

          {/* Metadata */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 pt-4 border-t border-gray-100 dark:border-zinc-800">
            <div>
              <div className="flex items-center gap-1.5 text-[10px] font-bold text-gray-400 uppercase tracking-widest mb-2">
                <ShieldAlert size={12} /> Allergens
              </div>
              <div className="flex flex-wrap gap-1.5">
                {student.allergens.length > 0 ?
                  student.allergens.map((a) => (
                    <span
                      key={a.allergen}
                      className="text-[11px] px-2 py-0.5 rounded-lg font-bold bg-gray-100 dark:bg-zinc-800 text-black dark:text-white border border-gray-200 dark:border-zinc-700"
                    >
                      {a.allergen}
                    </span>
                  ))
                : <span className="text-xs text-gray-400 font-medium">
                    None
                  </span>
                }
              </div>
            </div>

            <div>
              <div className="flex items-center gap-1.5 text-[10px] font-bold text-gray-400 uppercase tracking-widest mb-2">
                <CreditCard size={12} /> Daily Limit
              </div>
              <p className="text-sm font-bold text-black dark:text-white">
                {student.childProfile?.dailySpendingLimit ?
                  `$${parseFloat(student.childProfile.dailySpendingLimit).toFixed(2)}`
                : "Unlimited"}
              </p>
            </div>

            <div>
              <div className="flex items-center gap-1.5 text-[10px] font-bold text-gray-400 uppercase tracking-widest mb-2">
                <Calendar size={12} /> Dietary Notes
              </div>
              <p className="text-sm font-bold text-black dark:text-white truncate">
                {student.childProfile?.dietaryPreferences || "Standard"}
              </p>
            </div>
          </div>
        </div>

        {/* Arrow */}
        <div className="hidden md:block">
          <ChevronRight
            size={20}
            className="text-gray-300 group-hover:text-black dark:group-hover:text-white transition-all"
          />
        </div>
      </div>
    </div>
  );
}

export function ChildrenCards({ children }: { children: ChildLink[] }) {
  if (children.length === 0) {
    return (
      <div className="flex flex-col items-center gap-4 py-16  bg-[var(--bg-card)] border border-[var(--border-card)]  rounded-2xl">
        <div className="w-14 h-14 rounded-2xl bg-gray-100 dark:bg-zinc-800 flex items-center justify-center">
          <User size={24} className="text-gray-400" />
        </div>
        <div className="text-center">
          <p className="font-bold text-black dark:text-white">
            No children linked
          </p>
          <p className="text-sm text-gray-500 mt-1">
            Link your child's profile to start ordering meals.
          </p>
        </div>
        <Link
          href="/parent/children/link"
          className="px-4 py-2 bg-black text-white dark:bg-white dark:text-black rounded-xl text-sm font-bold hover:opacity-80 transition-opacity"
        >
          Link a child
        </Link>
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-4">
      {children.map((link) => (
        <ChildCard key={link.id} link={link} />
      ))}
    </div>
  );
}
