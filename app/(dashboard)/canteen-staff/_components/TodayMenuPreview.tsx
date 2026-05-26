import Link from "next/link";
import { ArrowRight, UtensilsCrossed } from "lucide-react";

const SLOT_LABEL: Record<string, string> = {
  breakfast: "Breakfast",
  lunch: "Lunch",
  snack: "Snack",
};

export function TodayMenuPreview({ menuItems }: { menuItems: any[] }) {
  const grouped: Record<string, any[]> = {};
  for (const dm of menuItems) {
    const slot = dm.mealSlot ?? "other";
    if (!grouped[slot]) grouped[slot] = [];
    grouped[slot].push(dm);
  }

  return (
    <div
      className="rounded-xl border overflow-hidden"
      style={{
        background: "var(--bg-card)",
        borderColor: "var(--border-card)",
        boxShadow: "var(--shadow-card)",
      }}
    >
      <div
        className="px-5 py-4 border-b flex items-center justify-between"
        style={{ borderColor: "var(--border-primary)" }}
      >
        <h2
          className="text-sm font-semibold"
          style={{ color: "var(--text-primary)" }}
        >
          Today&apos;s Menu
        </h2>
        <Link
          href="/canteen-staff/menu"
          className="flex items-center gap-1 text-xs font-medium"
          style={{ color: "var(--text-muted)" }}
        >
          Full menu <ArrowRight size={12} />
        </Link>
      </div>

      {menuItems.length === 0 ?
        <div className="py-10 text-center px-5">
          <UtensilsCrossed
            size={28}
            className="mx-auto mb-2"
            style={{ color: "var(--text-muted)" }}
          />
          <p className="text-sm" style={{ color: "var(--text-muted)" }}>
            No menu scheduled for today.
          </p>
          <p className="text-xs mt-1" style={{ color: "var(--text-muted)" }}>
            Admin can schedule items from the menu page.
          </p>
        </div>
      : <div className="px-5 py-4 space-y-4">
          {Object.entries(grouped).map(([slot, items]) => (
            <div key={slot}>
              <p
                className="text-xs font-semibold uppercase tracking-wider mb-2"
                style={{ color: "var(--text-muted)" }}
              >
                {SLOT_LABEL[slot] ?? slot}
              </p>
              <div className="space-y-2">
                {items.map((dm: any) => (
                  <div
                    key={dm.id}
                    className="flex items-center justify-between gap-2 py-1.5 px-3 rounded-lg"
                    style={{ background: "var(--bg-secondary)" }}
                  >
                    <div className="min-w-0">
                      <p
                        className="text-sm font-medium truncate"
                        style={{ color: "var(--text-primary)" }}
                      >
                        {dm.menuItem?.name}
                      </p>
                      <p
                        className="text-xs"
                        style={{ color: "var(--text-muted)" }}
                      >
                        {dm.menuItem?.calories ?
                          `${dm.menuItem.calories} kcal`
                        : dm.menuItem?.category}
                      </p>
                    </div>
                    <span
                      className="text-sm font-semibold shrink-0"
                      style={{ color: "var(--text-primary)" }}
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
