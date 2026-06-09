"use client";

import { useState, useTransition } from "react";
import {
    X, CalendarDays, Repeat, Sparkles, Loader2,
    ChevronDown, ChevronUp, Check,
} from "lucide-react";
import { pickDailyMeals } from "@/db/actions/Nutrition";
import { createRecurringOrders } from "@/db/actions/Orders";
import type { NutritionAverages } from "@/types/nutritionTypes";
import type { NutritionTargets } from "@/db/actions/Nutrition";

type MenuItem = { id: string; name: string; price: string };
type Student = { id: string; name: string };

interface DayPlan {
    date: string;           // YYYY-MM-DD
    label: string;          // "Mon Jun 9"
    menuItems: MenuItem[];
    selectedItemId: string | null;
}

interface Props {
    students: Student[];
    parentId: string;
    canteenId: string;
    // Per-date menu: key = YYYY-MM-DD, value = available items
    menuByDate: Record<string, MenuItem[]>;
    nutritionByChild: Record<string, { avg: NutritionAverages; targets: NutritionTargets }>;
    onClose: () => void;
    onSuccess: () => void;
}

type Pattern = "daily" | "weekly";

function getWeekDates(from: Date): string[] {
    const dates: string[] = [];
    const d = new Date(from);
    for (let i = 0; i < 7; i++) {
        if (d.getDay() !== 0 && d.getDay() !== 6) { // skip weekends
            dates.push(d.toISOString().split("T")[0]);
        }
        d.setDate(d.getDate() + 1);
    }
    return dates;
}

function getWeeklyDates(weekday: number, weeks: number, from: Date): string[] {
    const dates: string[] = [];
    const d = new Date(from);
    while (d.getDay() !== weekday) d.setDate(d.getDate() + 1);
    for (let i = 0; i < weeks; i++) {
        dates.push(d.toISOString().split("T")[0]);
        d.setDate(d.getDate() + 7);
    }
    return dates;
}

function fmtDate(iso: string) {
    return new Date(iso + "T00:00:00").toLocaleDateString("en-US", {
        weekday: "short", month: "short", day: "numeric",
    });
}

export function RecurringOrderModal({
    students, parentId, canteenId, menuByDate, nutritionByChild, onClose, onSuccess,
}: Props) {
    const [pattern, setPattern] = useState<Pattern>("daily");
    const [weeklyWeeks, setWeeklyWeeks] = useState(4);
    const [weeklyDay, setWeeklyDay] = useState(1); // 1 = Monday
    const [selectedStudent, setSelectedStudent] = useState(students[0]?.id ?? "");
    const [days, setDays] = useState<DayPlan[]>([]);
    const [step, setStep] = useState<"config" | "review">("config");
    const [isPicking, startPicking] = useTransition();
    const [isPlacing, startPlacing] = useTransition();
    const [error, setError] = useState<string | null>(null);
    const [expandedDay, setExpandedDay] = useState<string | null>(null);

    const today = new Date();
    today.setHours(0, 0, 0, 0);

    async function handleBuildPlan() {
        setError(null);
        const student = students.find((s) => s.id === selectedStudent);
        if (!student) return;

        const targetDates =
            pattern === "daily"
                ? getWeekDates(today)
                : getWeeklyDates(weeklyDay, weeklyWeeks, today);

        const datesWithMenu = targetDates
            .map((date) => ({ date, menuItems: menuByDate[date] ?? [] }))
            .filter((d) => d.menuItems.length > 0);

        if (datesWithMenu.length === 0) {
            setError("No menu available for the selected dates. Try a different week.");
            return;
        }

        const nutrition = nutritionByChild[student.name];

        startPicking(async () => {
            let picks: Record<string, string> | null = null;
            if (nutrition) {
                picks = await pickDailyMeals(
                    student.name,
                    nutrition.avg,
                    nutrition.targets,
                    datesWithMenu.map((d) => ({
                        date: d.date,
                        menuItems: d.menuItems.map((m) => ({ id: m.id, name: m.name })),
                    })),
                );
            }

            const plan: DayPlan[] = datesWithMenu.map(({ date, menuItems }) => {
                const aiPickName = picks?.[date];
                const aiItem = aiPickName
                    ? menuItems.find((m) => m.name.toLowerCase() === aiPickName.toLowerCase())
                    : null;
                return {
                    date,
                    label: fmtDate(date),
                    menuItems,
                    selectedItemId: aiItem?.id ?? menuItems[0]?.id ?? null,
                };
            });

            setDays(plan);
            setStep("review");
        });
    }

    async function handleConfirm() {
        setError(null);
        const validDays = days.filter((d) => d.selectedItemId);
        if (validDays.length === 0) { setError("Please select at least one meal."); return; }

        startPlacing(async () => {
            try {
                await createRecurringOrders({
                    parentId,
                    studentId: selectedStudent,
                    canteenId,
                    days: validDays.map((d) => {
                        const item = d.menuItems.find((m) => m.id === d.selectedItemId)!;
                        return {
                            date: d.date,
                            menuItemId: item.id,
                            unitPrice: item.price,
                        };
                    }),
                });
                onSuccess();
            } catch (e: any) {
                setError(e?.message ?? "Failed to place orders.");
            }
        });
    }

    const DAYS = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];

    return (
        <div
            className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm p-4"
            onClick={onClose}
        >
            <div
                className="bg-(--bg-card) border border-(--border-card) rounded-2xl shadow-xl w-full max-w-lg max-h-[90vh] flex flex-col"
                onClick={(e) => e.stopPropagation()}
            >
                {/* Header */}
                <div className="flex items-center justify-between p-5 border-b border-(--border-card)">
                    <div className="flex items-center gap-2">
                        <Repeat size={16} className="text-(--accent)" />
                        <p className="font-semibold text-(--text-primary)">Schedule Recurring Orders</p>
                    </div>
                    <button onClick={onClose} className="text-(--text-muted) hover:text-(--text-primary) transition-colors">
                        <X size={18} />
                    </button>
                </div>

                <div className="overflow-y-auto flex-1 p-5 space-y-5">
                    {step === "config" && (
                        <>
                            {/* Student */}
                            <div className="space-y-2">
                                <p className="text-xs font-semibold text-(--text-muted) uppercase tracking-wider">Ordering for</p>
                                <div className="flex gap-2 flex-wrap">
                                    {students.map((s) => (
                                        <button
                                            key={s.id}
                                            onClick={() => setSelectedStudent(s.id)}
                                            className={`px-3 py-1.5 rounded-lg text-sm font-medium transition-colors ${selectedStudent === s.id ? "bg-(--accent) text-(--accent-text)" : "bg-(--bg-tertiary) text-(--text-secondary) hover:text-(--text-primary)"}`}
                                        >
                                            {s.name}
                                        </button>
                                    ))}
                                </div>
                            </div>

                            {/* Pattern */}
                            <div className="space-y-2">
                                <p className="text-xs font-semibold text-(--text-muted) uppercase tracking-wider">Repeat pattern</p>
                                <div className="grid grid-cols-2 gap-2">
                                    {(["daily", "weekly"] as Pattern[]).map((p) => (
                                        <button
                                            key={p}
                                            onClick={() => setPattern(p)}
                                            className={`flex items-center gap-2 px-4 py-3 rounded-xl border text-sm font-medium transition-colors ${pattern === p ? "border-(--accent) bg-(--accent)/10 text-(--accent)" : "border-(--border-card) text-(--text-secondary) hover:border-(--border-primary)"}`}
                                        >
                                            <CalendarDays size={15} />
                                            {p === "daily" ? "Daily (Mon–Fri)" : "Weekly (same day)"}
                                        </button>
                                    ))}
                                </div>
                            </div>

                            {/* Weekly options */}
                            {pattern === "weekly" && (
                                <div className="space-y-3">
                                    <div className="space-y-2">
                                        <p className="text-xs font-semibold text-(--text-muted) uppercase tracking-wider">Day of week</p>
                                        <div className="flex gap-1.5 flex-wrap">
                                            {[1, 2, 3, 4, 5].map((d) => (
                                                <button
                                                    key={d}
                                                    onClick={() => setWeeklyDay(d)}
                                                    className={`px-3 py-1.5 rounded-lg text-sm font-medium transition-colors ${weeklyDay === d ? "bg-(--accent) text-(--accent-text)" : "bg-(--bg-tertiary) text-(--text-secondary)"}`}
                                                >
                                                    {DAYS[d]}
                                                </button>
                                            ))}
                                        </div>
                                    </div>
                                    <div className="space-y-2">
                                        <p className="text-xs font-semibold text-(--text-muted) uppercase tracking-wider">For how many weeks?</p>
                                        <div className="flex gap-2">
                                            {[2, 4, 6, 8].map((w) => (
                                                <button
                                                    key={w}
                                                    onClick={() => setWeeklyWeeks(w)}
                                                    className={`px-3 py-1.5 rounded-lg text-sm font-medium transition-colors ${weeklyWeeks === w ? "bg-(--accent) text-(--accent-text)" : "bg-(--bg-tertiary) text-(--text-secondary)"}`}
                                                >
                                                    {w}w
                                                </button>
                                            ))}
                                        </div>
                                    </div>
                                </div>
                            )}

                            {/* AI note */}
                            {nutritionByChild[students.find((s) => s.id === selectedStudent)?.name ?? ""] && (
                                <div className="flex items-start gap-2 p-3 bg-violet-50 dark:bg-violet-900/20 border border-violet-200 dark:border-violet-800/50 rounded-xl">
                                    <Sparkles size={13} className="text-violet-500 mt-0.5 shrink-0" />
                                    <p className="text-xs text-violet-700 dark:text-violet-300">
                                        AI will pre-select the best meal per day based on nutrition analysis. You can change any pick before confirming.
                                    </p>
                                </div>
                            )}

                            {error && (
                                <p className="text-xs text-red-600 dark:text-red-400 bg-red-50 dark:bg-red-900/20 px-3 py-2 rounded-lg">{error}</p>
                            )}
                        </>
                    )}

                    {step === "review" && (
                        <>
                            <p className="text-xs text-(--text-muted)">
                                AI has pre-selected meals based on {students.find((s) => s.id === selectedStudent)?.name}'s nutrition. Tap any day to change the selection.
                            </p>
                            <div className="space-y-2">
                                {days.map((day) => {
                                    const selected = day.menuItems.find((m) => m.id === day.selectedItemId);
                                    const isOpen = expandedDay === day.date;
                                    return (
                                        <div key={day.date} className="border border-(--border-card) rounded-xl overflow-hidden">
                                            <button
                                                onClick={() => setExpandedDay(isOpen ? null : day.date)}
                                                className="w-full flex items-center justify-between p-3 bg-(--bg-tertiary) hover:bg-(--bg-secondary) transition-colors text-left"
                                            >
                                                <div>
                                                    <p className="text-sm font-semibold text-(--text-primary)">{day.label}</p>
                                                    <p className="text-xs text-(--text-secondary) mt-0.5 flex items-center gap-1">
                                                        {selected ? (
                                                            <><Check size={10} className="text-emerald-500" /> {selected.name} — PKR {Math.round(parseFloat(selected.price))}</>
                                                        ) : "No meal selected"}
                                                    </p>
                                                </div>
                                                {isOpen ? <ChevronUp size={15} className="text-(--text-muted)" /> : <ChevronDown size={15} className="text-(--text-muted)" />}
                                            </button>
                                            {isOpen && (
                                                <div className="p-3 space-y-1.5 border-t border-(--border-card)">
                                                    {day.menuItems.map((item) => (
                                                        <button
                                                            key={item.id}
                                                            onClick={() => {
                                                                setDays((prev) =>
                                                                    prev.map((d) =>
                                                                        d.date === day.date ? { ...d, selectedItemId: item.id } : d,
                                                                    ),
                                                                );
                                                                setExpandedDay(null);
                                                            }}
                                                            className={`w-full flex items-center justify-between px-3 py-2 rounded-lg text-sm transition-colors ${day.selectedItemId === item.id ? "bg-(--accent) text-(--accent-text)" : "hover:bg-(--bg-tertiary) text-(--text-primary)"}`}
                                                        >
                                                            <span>{item.name}</span>
                                                            <span className="text-xs opacity-70">PKR {Math.round(parseFloat(item.price))}</span>
                                                        </button>
                                                    ))}
                                                </div>
                                            )}
                                        </div>
                                    );
                                })}
                            </div>

                            {error && (
                                <p className="text-xs text-red-600 dark:text-red-400 bg-red-50 dark:bg-red-900/20 px-3 py-2 rounded-lg">{error}</p>
                            )}
                        </>
                    )}
                </div>

                {/* Footer */}
                <div className="p-5 border-t border-(--border-card) flex gap-3">
                    {step === "review" && (
                        <button
                            onClick={() => setStep("config")}
                            disabled={isPlacing}
                            className="flex-1 px-4 py-2 bg-(--bg-tertiary) text-(--text-secondary) rounded-lg text-sm font-medium hover:text-(--text-primary) transition-colors disabled:opacity-40"
                        >
                            Back
                        </button>
                    )}
                    {step === "config" && (
                        <button
                            onClick={onClose}
                            className="flex-1 px-4 py-2 bg-(--bg-tertiary) text-(--text-secondary) rounded-lg text-sm font-medium hover:text-(--text-primary) transition-colors"
                        >
                            Cancel
                        </button>
                    )}
                    <button
                        onClick={step === "config" ? handleBuildPlan : handleConfirm}
                        disabled={isPicking || isPlacing}
                        className="flex-1 flex items-center justify-center gap-2 px-4 py-2 bg-(--accent) text-(--accent-text) rounded-lg text-sm font-medium hover:bg-(--accent-hover) transition-colors disabled:opacity-50"
                    >
                        {(isPicking || isPlacing) && <Loader2 size={14} className="animate-spin" />}
                        {isPicking ? "AI is picking meals…" : isPlacing ? "Placing orders…" : step === "config" ? "Build plan →" : `Confirm ${days.length} orders`}
                    </button>
                </div>
            </div>
        </div>
    );
}