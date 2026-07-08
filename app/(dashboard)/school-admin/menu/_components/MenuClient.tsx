"use client";

import { useState, useTransition } from "react";
import { Plus } from "lucide-react";
import { getWeeklyMenuAction } from "@/db/actions/admin/getWeeklyMenuAction";
import { useToast } from "@/components/useToast";
import { ToastContainer } from "@/components/useToast";

import type {
  MenuItem,
  DailyMenu,
  Canteen,
} from "@/types/menuTypes";
import { CatalogueTab } from "./CatalogueTab";
import { MenuItemModal } from "./MenuItemModal";
import { ScheduleTab } from "./ScheduleTab";

// ─── Props ────────────────────────────────────────────────────────────────────

interface MenuClientProps {
  menuItems: MenuItem[];
  dailyMenus: DailyMenu[];
  canteens: Canteen[];
  weekStart: string;
  weekEnd: string;
  defaultCanteenId: string;
  canManageCatalogue: boolean;
}

// ─── Component ────────────────────────────────────────────────────────────────

export function MenuClient({
  menuItems,
  dailyMenus: initialDailyMenus,
  canteens,
  weekStart,
  weekEnd,
  defaultCanteenId,
  canManageCatalogue,
}: MenuClientProps) {
  const { toasts, toast, dismiss } = useToast();

  const [tab, setTab] = useState<"catalogue" | "schedule">("catalogue");
  const [showAdd, setShowAdd] = useState(false);

  // Canteen + daily menus — canteen switch re-fetches via server action
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
        {/* ── Tab bar + Add button ─────────────────────────────────────────────
            On all screen sizes: tabs on the left, Add button on the right,
            both on the same row. The tab pill shrinks to fit; the button
            never wraps to its own row.
        ──────────────────────────────────────────────────────────────────── */}
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
                {/* Shorten label on small screens */}
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

          {/* Add button always sits on the right of the tab bar */}
          {tab === "catalogue" && (
            <button
              onClick={() => setShowAdd(true)}
              className="ml-auto flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-sm font-medium whitespace-nowrap shrink-0"
              style={{
                background: "var(--accent)",
                color: "var(--accent-text)",
                boxShadow: "var(--shadow-btn)",
              }}
            >
              <Plus size={14} />
              <span className="sm:hidden">Add</span>
              <span className="hidden sm:inline">Add Item</span>
            </button>
          )}
        </div>

        {/* ── Tab content ── */}
        {tab === "catalogue" ?
          <CatalogueTab
            menuItems={menuItems}
            canteenId={activeCanteenId}
            onSuccess={(msg) => toast(msg, "success")}
            onError={(msg) => toast(msg, "error")}
          />
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

      {/* ── Add item modal ── */}
      {showAdd &&
        canManageCatalogue && ( // ← extra guard, belt-and-suspenders
          <MenuItemModal
            canteenId={activeCanteenId}
            onClose={() => setShowAdd(false)}
            onSuccess={(msg) => toast(msg, "success")}
            onError={(msg) => toast(msg, "error")}
          />
        )}

      <ToastContainer toasts={toasts} dismiss={dismiss} />
    </>
  );
}
