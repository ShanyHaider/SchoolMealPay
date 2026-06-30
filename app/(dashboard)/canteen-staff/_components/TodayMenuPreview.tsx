"use client";

import Link from "next/link";
import { ArrowRight, UtensilsCrossed } from "lucide-react";

const SLOT_LABEL: Record<string, string> = {
  breakfast: "Breakfast",
  lunch: "Lunch",
  snack: "Snack",
};

const SLOT_ORDER = ["breakfast", "lunch", "snack"];

export function TodayMenuPreview({ menuItems }: { menuItems: any[] }) {
  const grouped: Record<string, any[]> = {};
  for (const dm of menuItems) {
    const slot = dm.mealSlot ?? "other";
    if (!grouped[slot]) grouped[slot] = [];
    grouped[slot].push(dm);
  }

  const orderedSlots = [
    ...SLOT_ORDER.filter((s) => grouped[s]),
    ...Object.keys(grouped).filter((s) => !SLOT_ORDER.includes(s)),
  ];

  return (
    <div
      className="rounded-2xl border overflow-hidden"
      style={{
        background: "var(--bg-card)",
        borderColor: "var(--border-card)",
        boxShadow: "var(--shadow-card)",
      }}
    >
      {/* Header */}
      <div
        className="px-5 py-4 border-b flex items-center justify-between"
        style={{ borderColor: "var(--border-primary)" }}
      >
        <h2
          className="text-sm font-semibold flex items-center gap-2"
          style={{ color: "var(--text-primary)" }}
        >
          <UtensilsCrossed size={14} style={{ color: "#f59e0b" }} />
          Today&apos;s Menu
        </h2>
        <Link
          href="/canteen-staff/menu"
          className="flex items-center gap-1 text-xs font-medium transition-colors hover:text-(--text-primary)"
          style={{ color: "var(--text-muted)" }}
        >
          Full menu <ArrowRight size={12} />
        </Link>
      </div>

      {menuItems.length === 0 ?
        <div className="py-10 text-center px-5">
          <UtensilsCrossed
            size={26}
            className="mx-auto mb-3"
            style={{ color: "var(--text-muted)", opacity: 0.4 }}
          />
          <p
            className="text-sm font-medium"
            style={{ color: "var(--text-muted)" }}
          >
            No menu scheduled for today
          </p>
          <p
            className="text-[11px] mt-1 leading-relaxed"
            style={{ color: "var(--text-muted)", opacity: 0.6 }}
          >
            Admin can schedule items from the menu page.
          </p>
        </div>
      : <div className="px-4 py-4 space-y-5">
          {orderedSlots.map((slot) => (
            <div key={slot}>
              {/* Slot divider */}
              <div className="flex items-center gap-2 mb-2.5">
                <span
                  className="text-[10px] font-bold uppercase tracking-widest"
                  style={{ color: "var(--text-muted)" }}
                >
                  {SLOT_LABEL[slot] ?? slot}
                </span>
                <div
                  className="flex-1 h-px"
                  style={{ background: "var(--border-primary)" }}
                />
              </div>

              {/* Items */}
              <div className="space-y-1.5">
                {grouped[slot].map((dm: any) => (
                  <div
                    key={dm.id}
                    className="flex items-center justify-between gap-3 py-2.5 px-3 rounded-xl transition-colors duration-150 cursor-default"
                    onMouseEnter={(e) =>
                      (e.currentTarget.style.background = "var(--bg-tertiary)")
                    }
                    onMouseLeave={(e) =>
                      (e.currentTarget.style.background = "var(--bg-secondary)")
                    }
                    style={{ background: "var(--bg-secondary)" }}
                  >
                    <div className="min-w-0">
                      <p
                        className="text-[13px] font-medium truncate"
                        style={{ color: "var(--text-primary)" }}
                      >
                        {dm.menuItem?.name}
                      </p>
                      <p
                        className="text-[11px] mt-0.5"
                        style={{ color: "var(--text-muted)" }}
                      >
                        {dm.menuItem?.calories ?
                          `${dm.menuItem.calories} kcal`
                        : (dm.menuItem?.category ?? "")}
                      </p>
                    </div>
                    <span
                      className="text-[13px] font-bold shrink-0"
                      style={{ color: "#f59e0b" }}
                    >
                      Rs. {parseFloat(dm.menuItem?.price ?? "0").toFixed(0)}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>
      }
    </div>
  );
}
