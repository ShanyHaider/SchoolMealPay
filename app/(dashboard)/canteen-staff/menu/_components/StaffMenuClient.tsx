"use client";

import { useState, useTransition } from "react";
import { useToast, ToastContainer } from "@/components/useToast";
import { StaffCatalogueView } from "./StaffCatalogueView";
import { ScheduleTab } from "./ScheduleTab";
import type { MenuItem, DailyMenu, Canteen } from "@/types/menuTypes";
import { getWeeklyMenuAction } from "@/db/actions/admin/getWeeklyMenuAction";

interface StaffMenuClientProps {
  menuItems: MenuItem[];
  dailyMenus: DailyMenu[];
  canteens: Canteen[];
  weekStart: string;
  weekEnd: string;
  defaultCanteenId: string;
}

export function StaffMenuClient({
  menuItems,
  dailyMenus: initialDailyMenus,
  canteens,
  weekStart,
  weekEnd,
  defaultCanteenId,
}: StaffMenuClientProps) {
  const { toasts, toast, dismiss } = useToast();
  const [tab, setTab] = useState<"catalogue" | "schedule">("catalogue");
  const [selectedCanteen, setSelectedCanteen] = useState(defaultCanteenId);
  const [dailyMenus, setDailyMenus] = useState<DailyMenu[]>(initialDailyMenus);
  const [isFetchingMenus, startFetchTransition] = useTransition();

  const handleCanteenChange = (canteenId: string) => {
    setSelectedCanteen(canteenId);
    startFetchTransition(async () => {
      try {
        const fresh = await getWeeklyMenuAction(canteenId, weekStart, weekEnd);
        setDailyMenus(fresh);
      } catch {
        toast("Failed to load schedule for this canteen.", "error");
      }
    });
  };

  const activeCanteenId = selectedCanteen || canteens[0]?.id || "";

  return (
    <>
      <div className="space-y-4">
        <div className="flex items-center gap-2">
          <div
            className="flex rounded-lg p-1 gap-1 min-w-0"
            style={{ background: "var(--bg-pill)" }}
          >
            {(["catalogue", "schedule"] as const).map((t) => (
              <button
                key={t}
                onClick={() => setTab(t)}
                className="px-3 py-1.5 rounded-md text-sm font-medium transition-all whitespace-nowrap"
                style={{
                  background:
                    tab === t ? "var(--bg-pill-active)" : "transparent",
                  color:
                    tab === t ? "var(--text-primary)" : "var(--text-secondary)",
                  boxShadow: tab === t ? "var(--shadow-pill)" : undefined,
                }}
              >
                <span className="sm:hidden">
                  {t === "catalogue" ?
                    `Items (${menuItems.length})`
                  : "Schedule"}
                </span>
                <span className="hidden sm:inline">
                  {t === "catalogue" ?
                    `Catalogue (${menuItems.length})`
                  : "Weekly Schedule"}
                </span>
              </button>
            ))}
          </div>
          {/* No Add button — staff has no catalogue-mutation capability */}
        </div>

        {tab === "catalogue" ?
          <StaffCatalogueView menuItems={menuItems} />
        : <ScheduleTab
            menuItems={menuItems}
            dailyMenus={dailyMenus}
            canteens={canteens}
            selectedCanteen={selectedCanteen}
            weekStart={weekStart}
            weekEnd={weekEnd}
            isFetchingMenus={isFetchingMenus}
            onCanteenChange={handleCanteenChange}
            onDailyMenusChange={(updater) => setDailyMenus(updater)}
            onError={(msg) => toast(msg, "error")}
          />
        }
      </div>

      <ToastContainer toasts={toasts} dismiss={dismiss} />
    </>
  );
}
