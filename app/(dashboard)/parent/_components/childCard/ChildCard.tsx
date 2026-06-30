// app/(dashboard)/parent/_components/children/ChildCard.tsx
"use client";

import { useTransition } from "react";
import Link from "next/link";
import { toast } from "sonner";
import {
  Settings,
  ShieldAlert,
  Calendar,
  User,
  ShoppingCart,
} from "lucide-react";
import { toggleStudentOrdering } from "@/db/actions/Students";
import { ChildLink } from "@/types/parentDashboardTypes";
import { useSpendingLimit } from "@/hooks/useSpendingLimit";
import { SpendingLimitSlider } from "./SpendingLimitSlider";

interface ChildCardProps {
  link: ChildLink;
  onQuickOrder: () => void;
}

export function ChildCard({ link, onQuickOrder }: ChildCardProps) {
  const { student } = link;
  const [isPending, startTransition] = useTransition();
  const limit = useSpendingLimit(student);

  const initials = student.name
    .split(" ")
    .map((n) => n[0])
    .join("")
    .toUpperCase()
    .slice(0, 2);

  const handleToggle = () => {
    startTransition(async () => {
      try {
        await toggleStudentOrdering(student.id, !student.orderingEnabled);
        toast.success(
          student.orderingEnabled ? "Ordering paused." : "Ordering enabled.",
        );
      } catch {
        toast.error("Failed to update ordering status.");
      }
    });
  };

  return (
    <div
      className="rounded-2xl border p-5 transition-all hover:shadow-md"
      style={{
        background: "var(--bg-card)",
        borderColor: "var(--border-card)",
        boxShadow: "var(--shadow-card)",
      }}
    >
      <div className="flex flex-col md:flex-row md:items-start gap-5">
        {/* ── Avatar ── */}
        <div className="relative shrink-0 self-start">
          <div
            className="w-14 h-14 rounded-2xl flex items-center justify-center text-lg font-bold overflow-hidden border"
            style={{
              background: "var(--bg-secondary)",
              borderColor: "var(--border-primary)",
              color: "var(--text-primary)",
            }}
          >
            {student.imageUrl ?
              <img
                src={student.imageUrl}
                alt={student.name}
                className="w-full h-full object-cover"
              />
            : initials}
          </div>
          {/* Status dot */}
          <div
            className={`absolute -bottom-1 -right-1 w-4 h-4 rounded-full border-[3px] border-(--bg-card) ${
              student.orderingEnabled ? "bg-green-500" : (
                "bg-zinc-300 dark:bg-zinc-600"
              )
            }`}
          />
        </div>

        {/* ── Main content ── */}
        <div className="flex-1 min-w-0 space-y-4">
          {/* Name + actions row */}
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div>
              <h3
                className="text-base font-bold"
                style={{ color: "var(--text-primary)" }}
              >
                {student.name}
              </h3>
              <div
                className="flex items-center gap-1.5 text-xs font-medium mt-0.5"
                style={{ color: "var(--text-secondary)" }}
              >
                <User size={12} />
                {student.class ?
                  <span>
                    Grade {student.class.grade} · Section{" "}
                    {student.class.section}
                  </span>
                : <span>ID: {student.studentCode}</span>}
              </div>
            </div>

            {/* Action buttons */}
            <div className="flex items-center gap-2 flex-wrap">
              <button
                onClick={handleToggle}
                disabled={isPending}
                className={`text-xs px-3 py-2 rounded-xl font-bold transition-all border ${
                  student.orderingEnabled ?
                    "bg-zinc-900 text-white border-zinc-900 dark:bg-white dark:text-zinc-900 dark:border-white"
                  : "bg-transparent text-zinc-400 border-zinc-200 hover:text-zinc-900 hover:border-zinc-400 dark:border-zinc-700"
                }`}
              >
                {student.orderingEnabled ? "Ordering On" : "Paused"}
              </button>

              <Link
                href={`/parent/children/${student.id}`}
                className="flex items-center justify-center w-9 h-9 rounded-xl border transition-all hover:bg-(--bg-tertiary)"
                style={{
                  background: "var(--bg-secondary)",
                  borderColor: "var(--border-card)",
                  color: "var(--text-secondary)",
                }}
                aria-label="Child settings"
              >
                <Settings size={15} />
              </Link>
            </div>
          </div>

          {/* Spending limit */}
          <SpendingLimitSlider
            sliderLimit={limit.sliderLimit}
            hasChanges={limit.hasChanges}
            isPending={limit.isPending}
            onChange={limit.onChange}
            onSave={limit.save}
          />

          {/* Allergens + Dietary */}
          <div
            className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-4 border-t"
            style={{ borderColor: "var(--border-primary)" }}
          >
            <AllergenList allergens={student.allergens} />
            <DietaryNotes notes={student.childProfile?.dietaryPreferences} />
          </div>
        </div>
      </div>
    </div>
  );
}

// ─── Allergen List ────────────────────────────────────────────────────────────

function AllergenList({ allergens }: { allergens: { allergen: string }[] }) {
  return (
    <div>
      <div
        className="flex items-center gap-1.5 text-[10px] font-bold uppercase tracking-widest mb-2"
        style={{ color: "var(--text-muted)" }}
      >
        <ShieldAlert size={11} /> Allergens
      </div>
      <div className="flex flex-wrap gap-1.5">
        {allergens.length > 0 ?
          allergens.map((a) => (
            <span
              key={a.allergen}
              className="text-[10px] px-2 py-0.5 rounded-lg font-bold border"
              style={{
                background: "var(--bg-secondary)",
                borderColor: "var(--border-card)",
                color: "var(--text-primary)",
              }}
            >
              {a.allergen}
            </span>
          ))
        : <span
            className="text-xs font-medium"
            style={{ color: "var(--text-muted)" }}
          >
            None
          </span>
        }
      </div>
    </div>
  );
}

// ─── Dietary Notes ────────────────────────────────────────────────────────────

function DietaryNotes({ notes }: { notes?: string | null }) {
  return (
    <div>
      <div
        className="flex items-center gap-1.5 text-[10px] font-bold uppercase tracking-widest mb-2"
        style={{ color: "var(--text-muted)" }}
      >
        <Calendar size={11} /> Dietary Notes
      </div>
      <p
        className="text-xs font-bold truncate"
        style={{ color: "var(--text-primary)" }}
      >
        {notes || "Standard Plan"}
      </p>
    </div>
  );
}
