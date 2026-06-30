"use client";

import { useState } from "react";
import { Loader2, Coffee, Cookie } from "lucide-react";
import { UtensilsCrossed as ForkKnife } from "lucide-react";
import { scheduleDailyMenu, removeDailyMenu } from "@/db/actions/admin/Canteen";
import { scheduleDailyMenuSchema } from "@/lib/validations/validators";
import { CustomSelect, type DropdownOption } from "./CustomSelect";
import { DesktopDayCell, MobileDayCell } from "./DayCell";
import {
  MEAL_SLOTS,
  DAYS,
  TODAY,
  getDayDates,
  buildScheduleMap,
  type MealSlot,
  type MenuItem,
  type DailyMenu,
  type Canteen,
} from "../../../../../types/menuTypes";
import { CATEGORY_ICONS_JSX } from "./MenuItemModal";
import { getWeeklyMenuAction } from "@/db/actions/admin/getWeeklyMenuAction";
import { formatPKR } from "@/lib/currency";

// ─── Slot icons ───────────────────────────────────────────────────────────────

const SLOT_ICONS: Record<MealSlot, React.ReactNode> = {
  breakfast: <Coffee size={11} />,
  lunch: <ForkKnife size={11} />,
  snack: <Cookie size={11} />,
};

// ─── Props ────────────────────────────────────────────────────────────────────

interface ScheduleTabProps {
  menuItems: MenuItem[];
  dailyMenus: DailyMenu[];
  canteens: Canteen[];
  selectedCanteen: string;
  weekStart: string;
  weekEnd: string;
  isFetchingMenus: boolean;
  onCanteenChange: (id: string) => void;
  onDailyMenusChange: (updater: (prev: DailyMenu[]) => DailyMenu[]) => void;
  onError: (message: string) => void;
}

// ─── Component ────────────────────────────────────────────────────────────────

export function ScheduleTab({
  menuItems,
  dailyMenus,
  canteens,
  selectedCanteen,
  weekStart,
  weekEnd,
  isFetchingMenus,
  onCanteenChange,
  onDailyMenusChange,
  onError,
}: ScheduleTabProps) {
  const [selectedSlot, setSelectedSlot] = useState<MealSlot>("lunch");
  const [schedulingDay, setSchedulingDay] = useState<string | null>(null);
  const [removingId, setRemovingId] = useState<string | null>(null); // ← add

  const [schedulePickValue, setSchedulePickValue] = useState("");
  const [openPickerDay, setOpenPickerDay] = useState<string | null>(null);
  const [mobileDay, setMobileDay] = useState(0);

  // const [isScheduling, startScheduleTransition] = useTransition();
  // const [isRemoving, startRemoveTransition] = useTransition();

  const dayDates = getDayDates(weekStart);
  const scheduleMap = buildScheduleMap(dailyMenus);

  const canteenOptions: DropdownOption[] = canteens.map((c) => ({
    value: c.id,
    label: c.name,
  }));

  const menuItemOptions: DropdownOption[] = menuItems.map((mi) => ({
    value: mi.id,
    label: `${mi.name} ${formatPKR(mi.price)}`,
    icon:
      CATEGORY_ICONS_JSX[mi.category as keyof typeof CATEGORY_ICONS_JSX] ??
      null,
  }));

  // ── Schedule an item ───────────────────────────────────────────────────────

  const handleSchedule = (menuItemId: string, date: string) => {
    if (!selectedCanteen || !menuItemId) return;

    const payload = {
      canteenId: selectedCanteen,
      menuItemId,
      menuDate: date,
      mealSlot: selectedSlot,
    };

    const result = scheduleDailyMenuSchema.safeParse(payload);
    if (!result.success) {
      onError(
        result.error.issues[0]?.message ?? "Scheduling validation failed.",
      );
      return;
    }

    setSchedulingDay(date);
    (async () => {
      try {
        await scheduleDailyMenu(result.data as any);
        setSchedulePickValue("");
        // Optimistic add
        const fresh = await getWeeklyMenuAction(
          selectedCanteen,
          weekStart,
          weekEnd,
        );
        onDailyMenusChange(() => fresh);
      } catch {
        onError("Failed to schedule item.");
      } finally {
        setSchedulingDay(null); // ← add this
      }
    })();
  };

  // ── Remove a scheduled item ────────────────────────────────────────────────

  const handleRemove = (
    menuItemId: string,
    date: string,
    slot: string,
    dmId: string,
  ) => {
    setRemovingId(dmId);
    (async () => {
      try {
        await removeDailyMenu(selectedCanteen, menuItemId, date, slot);
        const fresh = await getWeeklyMenuAction(
          selectedCanteen,
          weekStart,
          weekEnd,
        );
        onDailyMenusChange(() => fresh);
      } catch {
        onError("Failed to remove scheduled item.");
      } finally {
        setRemovingId(null);
      }
    })();
  };

  const cancelScheduling = () => {
    setOpenPickerDay(null);
    setSchedulePickValue("");
  };

  // ── Shared cell props factory ──────────────────────────────────────────────

  const cellProps = (date: string) => ({
    date,
    slot: selectedSlot,
    items: scheduleMap[date]?.[selectedSlot] ?? [],
    isScheduling: schedulingDay === date,
    isRemoving: false,
    removingId,
    schedulingDay: openPickerDay,
    schedulePickValue,
    menuItemOptions,
    onStartSchedule: () => setOpenPickerDay(date),
    onCancelSchedule: cancelScheduling,
    onPickItem: (id: string) => setSchedulePickValue(id),
    onConfirmSchedule: (id: string) => {
      setOpenPickerDay(null);
      handleSchedule(id, date);
    },
    onRemove: (dm: DailyMenu) =>
      handleRemove(dm.menuItemId, date, selectedSlot, dm.id),
  });

  if (!selectedCanteen) {
    return (
      <div
        className="rounded-xl border py-12 text-center"
        style={{
          background: "var(--bg-card)",
          borderColor: "var(--border-card)",
        }}
      >
        <p className="text-sm" style={{ color: "var(--text-muted)" }}>
          Add a canteen first to schedule menus.
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {/* Controls row */}
      <div className="flex flex-wrap items-center gap-2">
        {/* Slot pills */}
        <span
          className="text-xs font-medium"
          style={{ color: "var(--text-secondary)" }}
        >
          Meal slot:
        </span>
        <div
          className="flex rounded-lg p-1 gap-1"
          style={{ background: "var(--bg-pill)" }}
        >
          {MEAL_SLOTS.map((slot) => (
            <button
              key={slot}
              onClick={() => setSelectedSlot(slot)}
              className="flex items-center gap-1.5 px-3 py-1 rounded-md text-xs font-medium capitalize transition-all"
              style={{
                background:
                  selectedSlot === slot ?
                    "var(--bg-pill-active)"
                  : "transparent",
                color:
                  selectedSlot === slot ?
                    "var(--text-primary)"
                  : "var(--text-secondary)",
                boxShadow:
                  selectedSlot === slot ? "var(--shadow-pill)" : undefined,
              }}
            >
              {SLOT_ICONS[slot]}
              {slot}
            </button>
          ))}
        </div>

        {/* Canteen selector (only shown when >1 canteen) */}
        {canteens.length > 1 && (
          <div className="w-44 ml-auto">
            <CustomSelect
              options={canteenOptions}
              value={selectedCanteen}
              onChange={onCanteenChange}
              disabled={isFetchingMenus}
            />
          </div>
        )}

        {isFetchingMenus && (
          <Loader2
            size={14}
            className="animate-spin"
            style={{ color: "var(--text-muted)" }}
          />
        )}
      </div>

      {/* ── Mobile: day stepper ── */}
      <div className="md:hidden space-y-3">
        <div className="flex items-center justify-between">
          <button
            onClick={() => setMobileDay((d) => Math.max(0, d - 1))}
            disabled={mobileDay === 0}
            className="px-3 py-1.5 rounded-lg text-sm disabled:opacity-30 transition-opacity"
            style={{
              background: "var(--bg-secondary)",
              border: "1px solid var(--border-input)",
              color: "var(--text-secondary)",
            }}
          >
            ← Prev
          </button>

          <div className="text-center">
            <p
              className="text-sm font-semibold"
              style={{
                color:
                  dayDates[mobileDay] === TODAY ?
                    "#8b5cf6"
                  : "var(--text-primary)",
              }}
            >
              {DAYS[mobileDay]}
              {dayDates[mobileDay] === TODAY && (
                <span
                  className="ml-1.5 text-xs px-1.5 py-0.5 rounded-full"
                  style={{
                    background: "rgba(139,92,246,0.12)",
                    color: "#8b5cf6",
                  }}
                >
                  Today
                </span>
              )}
            </p>
            <p
              className="text-xs mt-0.5"
              style={{ color: "var(--text-muted)" }}
            >
              {new Date(dayDates[mobileDay] + "T00:00:00").toLocaleDateString(
                "en-US",
                { month: "long", day: "numeric" },
              )}
            </p>
          </div>

          <button
            onClick={() => setMobileDay((d) => Math.min(6, d + 1))}
            disabled={mobileDay === 6}
            className="px-3 py-1.5 rounded-lg text-sm disabled:opacity-30 transition-opacity"
            style={{
              background: "var(--bg-secondary)",
              border: "1px solid var(--border-input)",
              color: "var(--text-secondary)",
            }}
          >
            Next →
          </button>
        </div>

        <MobileDayCell {...cellProps(dayDates[mobileDay])} />
      </div>

      {/* ── Desktop: 7-column grid ── */}
      <div
        className="hidden md:block rounded-xl border overflow-hidden"
        style={{
          background: "var(--bg-card)",
          borderColor: "var(--border-card)",
          boxShadow: "var(--shadow-card)",
        }}
      >
        {/* Day headers */}
        <div
          className="grid grid-cols-7 border-b"
          style={{ borderColor: "var(--border-primary)" }}
        >
          {dayDates.map((date, i) => {
            const isToday = date === TODAY;
            const dayName = new Date(date + "T00:00:00").toLocaleDateString(
              "en-US",
              { weekday: "short" },
            );
            return (
              <div
                key={date}
                className="px-3 py-3 text-center"
                style={{
                  borderRight:
                    i < 6 ? "1px solid var(--border-primary)" : undefined,
                  background: isToday ? "rgba(139,92,246,0.06)" : undefined,
                }}
              >
                <p
                  className="text-xs font-semibold"
                  style={{
                    color: isToday ? "#8b5cf6" : "var(--text-secondary)",
                  }}
                >
                  {dayName}
                </p>
                <p
                  className="text-xs mt-0.5"
                  style={{ color: "var(--text-muted)" }}
                >
                  {new Date(date + "T00:00:00").toLocaleDateString("en-US", {
                    month: "short",
                    day: "numeric",
                  })}
                </p>
                {isToday && (
                  <div
                    className="mx-auto mt-1 h-1 w-1 rounded-full"
                    style={{ background: "#8b5cf6" }}
                  />
                )}
              </div>
            );
          })}
        </div>

        {/* Day cells */}
        <div className="grid grid-cols-7 min-h-50">
          {dayDates.map((date, i) => (
            <DesktopDayCell key={date} {...cellProps(date)} isLast={i === 6} />
          ))}
        </div>
      </div>
    </div>
  );
}
