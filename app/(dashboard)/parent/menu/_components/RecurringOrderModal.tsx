"use client";

import { useState, useTransition } from "react";
import {
  X,
  Repeat,
  Sparkles,
  Loader2,
  Check,
  ChevronDown,
  CalendarDays,
  Info,
  AlertCircle,
} from "lucide-react";
import { pickDailyMeals } from "@/db/actions/Nutrition";
import { createRecurringOrders } from "@/db/actions/Orders";
import type { NutritionAverages } from "@/types/nutritionTypes";
import type { NutritionTargets } from "@/db/actions/Nutrition";
import { formatPKR } from "@/lib/currency";

type MenuItem = { id: string; name: string; price: number };
type Student = { id: string; name: string };

interface DayPlan {
  date: string; // YYYY-MM-DD
  label: string; // "Mon, Jun 9"
  shortLabel: string; // "Mon"
  menuItems: MenuItem[];
  selectedItemId: string | null;
  checked: boolean;
  menuOpen: boolean;
}

interface Props {
  students: Student[];
  parentId: string;
  canteenId: string;
  menuByDate: Record<string, MenuItem[]>;
  nutritionByChild: Record<
    string,
    { avg: NutritionAverages; targets: NutritionTargets }
  >;
  onClose: () => void;
  onSuccess: () => void;
}

function fmtDate(iso: string) {
  return new Date(iso + "T00:00:00").toLocaleDateString("en-US", {
    weekday: "short",
    month: "short",
    day: "numeric",
  });
}

function fmtShort(iso: string) {
  return new Date(iso + "T00:00:00").toLocaleDateString("en-US", {
    weekday: "short",
  });
}

/** Returns the next 7 calendar days (Mon–Fri only, starting tomorrow). */
function getUpcomingSchoolDays(): string[] {
  const dates: string[] = [];
  const d = new Date();
  d.setHours(0, 0, 0, 0);
  d.setDate(d.getDate() + 1); // start from tomorrow
  while (dates.length < 7) {
    const day = d.getDay();
    if (day !== 0 && day !== 6) {
      dates.push(d.toISOString().split("T")[0]);
    }
    d.setDate(d.getDate() + 1);
  }
  return dates;
}

export function RecurringOrderModal({
  students,
  parentId,
  canteenId,
  menuByDate,
  nutritionByChild,
  onClose,
  onSuccess,
}: Props) {
  const [selectedStudent, setSelectedStudent] = useState(students[0]?.id ?? "");
  const [days, setDays] = useState<DayPlan[]>(() =>
    getUpcomingSchoolDays().map((date) => ({
      date,
      label: fmtDate(date),
      shortLabel: fmtShort(date),
      menuItems: menuByDate[date] ?? [],
      selectedItemId: menuByDate[date]?.[0]?.id ?? null,
      checked: !!menuByDate[date]?.length,
      menuOpen: false,
    })),
  );
  const [isPicking, startPicking] = useTransition();
  const [isPlacing, startPlacing] = useTransition();
  const [error, setError] = useState<string | null>(null);
  const [aiApplied, setAiApplied] = useState(false);

  const student = students.find((s) => s.id === selectedStudent);
  const nutrition = student ? nutritionByChild[student.name] : undefined;
  const checkedDays = days.filter(
    (d) => d.checked && d.selectedItemId && d.menuItems.length > 0,
  );
  const total = checkedDays.reduce((sum, d) => {
    const item = d.menuItems.find((m) => m.id === d.selectedItemId);
    return sum + Number(item?.price ?? 0);
  }, 0);
  const hasAnyMenu = days.some((d) => d.menuItems.length > 0);

  // ── Toggle a day on/off ──────────────────────────────────────────────────

  function toggleDay(date: string) {
    setDays((prev) =>
      prev.map((d) =>
        d.date === date && d.menuItems.length > 0 ?
          { ...d, checked: !d.checked }
        : d,
      ),
    );
  }

  // ── Change the meal for a day ────────────────────────────────────────────

  function selectMeal(date: string, itemId: string) {
    setDays((prev) =>
      prev.map((d) =>
        d.date === date ? { ...d, selectedItemId: itemId, menuOpen: false } : d,
      ),
    );
  }

  function toggleMenu(date: string) {
    setDays((prev) =>
      prev.map((d) =>
        d.date === date ?
          { ...d, menuOpen: !d.menuOpen }
        : { ...d, menuOpen: false },
      ),
    );
  }

  // ── AI suggestions ───────────────────────────────────────────────────────

  function handleAiPick() {
    if (!student || !nutrition) return;
    const datesWithMenu = days
      .filter((d) => d.menuItems.length > 0)
      .map((d) => ({
        date: d.date,
        menuItems: d.menuItems.map((m) => ({ id: m.id, name: m.name })),
      }));

    startPicking(async () => {
      const picks = await pickDailyMeals(
        student.name,
        nutrition.avg,
        nutrition.targets,
        datesWithMenu,
      );
      if (picks) {
        setDays((prev) =>
          prev.map((d) => {
            const pickedName = picks[d.date];
            if (!pickedName) return d;
            const item = d.menuItems.find(
              (m) => m.name.toLowerCase() === pickedName.toLowerCase(),
            );
            return item ? { ...d, selectedItemId: item.id } : d;
          }),
        );
        setAiApplied(true);
      }
    });
  }

  // ── Place orders ─────────────────────────────────────────────────────────

  function handleConfirm() {
    setError(null);
    if (checkedDays.length === 0) {
      setError("Select at least one day with a meal to continue.");
      return;
    }

    startPlacing(async () => {
      try {
        const result = await createRecurringOrders({
          parentId,
          studentId: selectedStudent,
          canteenId,
          days: checkedDays.map((d) => {
            const item = d.menuItems.find((m) => m.id === d.selectedItemId)!;
            return {
              date: d.date,
              menuItemId: item.id,
              unitPrice: String(item.price),
            };
          }),
        });
        if (!result.success) {
          setError(result.error);
        } else {
          onSuccess();
        }
      } catch (e: any) {
        setError(e?.message ?? "Failed to place orders.");
      }
    });
  }

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm p-4"
      onClick={onClose}
    >
      <div
        className="bg-(--bg-card) border border-(--border-card) rounded-2xl shadow-xl w-full max-w-md flex flex-col max-h-[92vh]"
        onClick={(e) => e.stopPropagation()}
      >
        {/* ── Header ─────────────────────────────────────────────── */}
        <div className="flex items-center justify-between px-5 py-4 border-b border-(--border-card) shrink-0">
          <div className="flex items-center gap-2.5">
            <div className="w-7 h-7 rounded-lg bg-(--accent)/10 flex items-center justify-center">
              <Repeat size={14} className="text-(--accent)" />
            </div>
            <div>
              <p className="font-semibold text-sm text-(--text-primary)">
                Schedule meals
              </p>
              <p className="text-[10px] text-(--text-muted) font-medium uppercase tracking-wider">
                Next 7 school days
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="w-7 h-7 flex items-center justify-center rounded-lg hover:bg-(--bg-secondary) text-(--text-muted) hover:text-(--text-primary) transition-colors"
          >
            <X size={15} />
          </button>
        </div>

        <div className="overflow-y-auto flex-1 px-5 py-4 space-y-5">
          {/* ── Student picker ──────────────────────────────────── */}
          {students.length > 1 && (
            <div className="space-y-2">
              <p className="text-[10px] font-bold text-(--text-muted) uppercase tracking-widest">
                Ordering for
              </p>
              <div className="flex gap-2 flex-wrap">
                {students.map((s) => (
                  <button
                    key={s.id}
                    onClick={() => {
                      setSelectedStudent(s.id);
                      setAiApplied(false);
                    }}
                    className={`px-3 py-1.5 rounded-lg text-sm font-medium transition-colors border ${
                      selectedStudent === s.id ?
                        "bg-(--accent) text-(--accent-text) border-(--accent)"
                      : "border-(--border-card) text-(--text-secondary) hover:text-(--text-primary)"
                    }`}
                  >
                    {s.name}
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* ── How this works callout ──────────────────────────── */}
          <div className="flex gap-2.5 px-3 py-2.5 bg-(--bg-secondary) border border-(--border-card) rounded-xl">
            <Info size={13} className="text-(--text-muted) shrink-0 mt-0.5" />
            <p className="text-xs text-(--text-secondary) leading-relaxed">
              Tick the days you want to order, pick a meal for each, then
              confirm. Orders are placed for all ticked days in one go — payment
              is deducted from your wallet.
            </p>
          </div>

          {/* ── AI suggest strip ────────────────────────────────── */}
          {nutrition && (
            <div className="flex items-center justify-between gap-3 px-3 py-2.5 bg-violet-50 dark:bg-violet-900/20 border border-violet-200 dark:border-violet-800/50 rounded-xl">
              <div className="flex items-start gap-2">
                <Sparkles
                  size={13}
                  className="text-violet-500 shrink-0 mt-0.5"
                />
                <p className="text-xs text-violet-700 dark:text-violet-300">
                  {aiApplied ?
                    `AI meals applied for ${student?.name}. You can still change any day below.`
                  : `AI can pre-select the best meal each day for ${student?.name} based on nutrition.`
                  }
                </p>
              </div>
              {!aiApplied && (
                <button
                  onClick={handleAiPick}
                  disabled={isPicking}
                  className="shrink-0 flex items-center gap-1.5 px-2.5 py-1.5 bg-violet-100 dark:bg-violet-800/40 text-violet-700 dark:text-violet-300 rounded-lg text-xs font-semibold hover:bg-violet-200 dark:hover:bg-violet-700/40 transition-colors disabled:opacity-50"
                >
                  {isPicking ?
                    <Loader2 size={11} className="animate-spin" />
                  : <Sparkles size={11} />}
                  {isPicking ? "Picking…" : "Suggest"}
                </button>
              )}
            </div>
          )}

          {/* ── Day list ────────────────────────────────────────── */}
          {!hasAnyMenu ?
            <div className="flex items-center gap-2 px-3 py-3 bg-amber-50 dark:bg-amber-900/20 border border-amber-200 dark:border-amber-800/50 rounded-xl">
              <AlertCircle size={14} className="text-amber-500 shrink-0" />
              <p className="text-xs text-amber-700 dark:text-amber-400">
                No menu is available for the next 7 school days. Check back
                closer to the date.
              </p>
            </div>
          : <div className="space-y-2">
              <p className="text-[10px] font-bold text-(--text-muted) uppercase tracking-widest">
                Pick your days
              </p>
              {days.map((day) => {
                const hasMenu = day.menuItems.length > 0;
                const selectedItem = day.menuItems.find(
                  (m) => m.id === day.selectedItemId,
                );

                return (
                  <div
                    key={day.date}
                    className={`rounded-xl border transition-all ${
                      day.checked && hasMenu ?
                        "border-(--accent)/40 bg-(--accent)/5"
                      : "border-(--border-card) bg-(--bg-card)"
                    } ${!hasMenu ? "opacity-40" : ""}`}
                  >
                    {/* Day row */}
                    <div className="flex items-center gap-3 px-3 py-3">
                      {/* Checkbox */}
                      <button
                        onClick={() => toggleDay(day.date)}
                        disabled={!hasMenu}
                        className={`w-5 h-5 rounded-md border-2 flex items-center justify-center shrink-0 transition-all ${
                          day.checked && hasMenu ?
                            "bg-(--accent) border-(--accent)"
                          : "border-(--border-card) hover:border-(--accent)/50"
                        } disabled:cursor-not-allowed`}
                      >
                        {day.checked && hasMenu && (
                          <Check size={11} className="text-(--accent-text)" />
                        )}
                      </button>

                      {/* Date label */}
                      <div
                        className="flex-1 min-w-0 cursor-pointer"
                        onClick={() => hasMenu && toggleDay(day.date)}
                      >
                        <p
                          className={`text-sm font-semibold ${day.checked && hasMenu ? "text-(--text-primary)" : "text-(--text-secondary)"}`}
                        >
                          {day.label}
                        </p>
                        {!hasMenu && (
                          <p className="text-[10px] text-(--text-muted) font-medium">
                            No menu yet
                          </p>
                        )}
                      </div>

                      {/* Meal selector — only shown when day is checked and has menu */}
                      {hasMenu && day.checked && (
                        <div className="relative shrink-0">
                          <button
                            onClick={() => toggleMenu(day.date)}
                            className="flex items-center gap-1.5 px-2.5 py-1.5 bg-(--bg-secondary) border border-(--border-card) rounded-lg text-xs font-medium text-(--text-primary) hover:border-(--border-primary) transition-colors max-w-40"
                          >
                            <span className="truncate">
                              {selectedItem ? selectedItem.name : "Pick meal"}
                            </span>
                            <ChevronDown
                              size={11}
                              className={`shrink-0 text-(--text-muted) transition-transform ${day.menuOpen ? "rotate-180" : ""}`}
                            />
                          </button>

                          {day.menuOpen && (
                            <div className="absolute right-0 top-full mt-1 z-50 bg-(--bg-card) border border-(--border-card) rounded-xl shadow-lg overflow-hidden min-w-50 max-w-60">
                              {day.menuItems.map((item) => (
                                <button
                                  key={item.id}
                                  onClick={() => selectMeal(day.date, item.id)}
                                  className={`w-full flex items-center justify-between px-3 py-2.5 text-xs text-left transition-colors gap-3 ${
                                    day.selectedItemId === item.id ?
                                      "bg-(--accent)/10 text-(--accent) font-semibold"
                                    : "text-(--text-primary) hover:bg-(--bg-secondary)"
                                  }`}
                                >
                                  <span className="truncate">{item.name}</span>
                                  <span className="shrink-0 text-(--text-muted)">
                                    {formatPKR(item.price)}
                                  </span>
                                </button>
                              ))}
                            </div>
                          )}
                        </div>
                      )}

                      {/* Price badge — shown when checked, no dropdown open */}
                      {hasMenu &&
                        day.checked &&
                        selectedItem &&
                        !day.menuOpen && (
                          <span className="text-[10px] font-bold text-(--text-muted) shrink-0 w-16 text-right">
                            {formatPKR(selectedItem.price)}
                          </span>
                        )}
                    </div>
                  </div>
                );
              })}
            </div>
          }

          {error && (
            <div className="flex items-start gap-2 px-3 py-2.5 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800/50 rounded-xl">
              <AlertCircle size={13} className="text-red-500 shrink-0 mt-0.5" />
              <p className="text-xs text-red-700 dark:text-red-400">{error}</p>
            </div>
          )}
        </div>

        {/* ── Footer ─────────────────────────────────────────────── */}
        <div className="px-5 py-4 border-t border-(--border-card) shrink-0 space-y-3">
          {/* Order summary */}
          {checkedDays.length > 0 && (
            <div className="flex items-center justify-between px-1">
              <div className="flex items-center gap-1.5">
                <CalendarDays size={13} className="text-(--text-muted)" />
                <span className="text-xs text-(--text-secondary) font-medium">
                  {checkedDays.length}{" "}
                  {checkedDays.length === 1 ? "day" : "days"} selected
                </span>
              </div>
              <span className="text-sm font-bold text-(--text-primary)">
                {formatPKR(total)}
              </span>
            </div>
          )}

          <div className="flex gap-2.5">
            <button
              onClick={onClose}
              disabled={isPlacing}
              className="flex-1 px-4 py-2.5 bg-(--bg-secondary) border border-(--border-card) text-(--text-secondary) rounded-xl text-sm font-medium hover:text-(--text-primary) transition-colors disabled:opacity-40"
            >
              Cancel
            </button>
            <button
              onClick={handleConfirm}
              disabled={isPlacing || checkedDays.length === 0 || !hasAnyMenu}
              className="flex-2 grow flex items-center justify-center gap-2 px-4 py-2.5 bg-green-500/10 text-green-600 border border-green-500/20 rounded-xl text-sm font-semibold hover:bg-green-500/20 transition-colors disabled:opacity-40 disabled:cursor-not-allowed"
            >
              {isPlacing && <Loader2 size={14} className="animate-spin" />}
              {isPlacing ?
                "Placing orders…"
              : checkedDays.length > 0 ?
                `Confirm ${checkedDays.length} ${checkedDays.length === 1 ? "order" : "orders"}`
              : "Select days to continue"}
            </button>
          </div>
          <p className="text-[9px] text-(--text-muted) text-center font-medium">
            Spending limits don't apply to pre-scheduled meals — the full week
            is planned in advance.
          </p>
        </div>
      </div>
    </div>
  );
}
