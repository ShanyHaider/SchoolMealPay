"use client";

import {
  Coffee,
  Cookie,
  UtensilsCrossed as ForkKnife,
  Droplets,
  Leaf,
  UtensilsCrossed,
} from "lucide-react";
import type { MenuItem } from "@/types/canteenMenuTypes";
import { formatPKR } from "@/lib/currency";

const CATEGORY_ICONS_JSX: Record<string, React.ReactNode> = {
  breakfast: <Coffee size={12} />,
  lunch: <ForkKnife size={12} />,
  snack: <Cookie size={12} />,
  beverage: <Droplets size={12} />,
};

interface CatalogueGridProps {
  menuItems: MenuItem[];
  /** Optional slot for admin-only action buttons (Edit/Delete), rendered per-card if provided */
  renderActions?: (item: MenuItem) => React.ReactNode;
}

export function CatalogueGrid({
  menuItems,
  renderActions,
}: CatalogueGridProps) {
  if (menuItems.length === 0) {
    return (
      <div
        className="rounded-xl border py-16 text-center"
        style={{
          background: "var(--bg-card)",
          borderColor: "var(--border-card)",
        }}
      >
        <UtensilsCrossed
          size={32}
          className="mx-auto mb-3"
          style={{ color: "var(--text-muted)" }}
        />
        <p className="text-sm" style={{ color: "var(--text-muted)" }}>
          No menu items yet.
        </p>
      </div>
    );
  }

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
      {menuItems.map((item) => (
        <div
          key={item.id}
          className="rounded-xl border p-4 flex flex-col"
          style={{
            background: "var(--bg-card)",
            borderColor: "var(--border-card)",
            boxShadow: "var(--shadow-card)",
          }}
        >
          <div className="flex items-start justify-between mb-2">
            <div className="min-w-0 flex-1 pr-2">
              <h3
                className="font-semibold text-sm truncate"
                style={{ color: "var(--text-primary)" }}
              >
                {item.name}
              </h3>
              <div className="flex items-center gap-1 mt-0.5">
                <span style={{ color: "var(--text-muted)" }}>
                  {CATEGORY_ICONS_JSX[item.category]}
                </span>
                <p
                  className="text-xs capitalize"
                  style={{ color: "var(--text-muted)" }}
                >
                  {item.category}
                </p>
              </div>
            </div>

            {renderActions && (
              <div className="flex items-center gap-0.5 shrink-0">
                {renderActions(item)}
              </div>
            )}
          </div>

          <div className="flex items-center gap-2 mb-3">
            <span
              className="text-lg font-bold"
              style={{ color: "var(--text-primary)" }}
            >
              {formatPKR(item.price)}
            </span>
            {item.calories && (
              <span className="text-xs" style={{ color: "var(--text-muted)" }}>
                {item.calories} kcal
              </span>
            )}
          </div>

          <div className="flex gap-1.5 flex-wrap mt-auto">
            {item.isVegetarian && (
              <span
                className="px-2 py-0.5 rounded-full text-xs"
                style={{ background: "rgba(34,197,94,0.12)", color: "#22c55e" }}
              >
                <Leaf size={10} className="inline mr-1" />
                Veg
              </span>
            )}
            {item.isVegan && (
              <span
                className="px-2 py-0.5 rounded-full text-xs"
                style={{
                  background: "rgba(59,130,246,0.12)",
                  color: "#3b82f6",
                }}
              >
                Vegan
              </span>
            )}
          </div>
        </div>
      ))}
    </div>
  );
}
