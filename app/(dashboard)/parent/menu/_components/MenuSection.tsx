"use client";

import { ChefHat } from "lucide-react";
import { MenuItemCard } from "./MenuItemCard";
import type { MenuItem, CartItem } from "./types";

interface MenuSectionProps {
  groupedItems: Record<string, MenuItem[]>;
  cart: CartItem[];
  suggestedNames: Set<string>;
  suggestedFor: string;
  onAdd: (item: { id: string; name: string; price: number }) => void;
  onRemove: (menuItemId: string) => void;
}

export function MenuSection({
  groupedItems,
  cart,
  suggestedNames,
  suggestedFor,
  onAdd,
  onRemove,
}: MenuSectionProps) {
  const entries = Object.entries(groupedItems);
  const hasAnyVisible = entries.some(([, items]) =>
    items.some((item) => {
      const menuItem = (item as any).menuItem ?? item;
      return menuItem.isAvailable;
    }),
  );

  if (!hasAnyVisible) {
    return (
      <div className="flex flex-col items-center justify-center py-20 bg-(--bg-card) border border-(--border-card) rounded-2xl shadow-sm italic text-(--text-muted)">
        <ChefHat size={48} className="mb-4 opacity-10" />
        <p>No menu items found for this selection.</p>
      </div>
    );
  }

  return (
    <>
      {entries.map(([slot, items]) => {
        const availableItems = items.filter((item) => {
          const menuItem = (item as any).menuItem ?? item;
          return menuItem.isAvailable;
        });
        if (availableItems.length === 0) return null;

        return (
          <div key={slot} className="space-y-4">
            <div className="flex items-center gap-3">
              <h3 className="text-[10px] font-bold text-(--text-muted) uppercase tracking-[0.2em] px-1">
                {slot}
              </h3>
              <div className="h-px flex-1 bg-(--border-card)" />
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {availableItems.map((item) => {
                const menuItem = (item as any).menuItem ?? item;
                const qty =
                  cart.find((i) => i.menuItemId === menuItem.id)?.quantity ?? 0;
                const isRecommended = suggestedNames.has(
                  menuItem.name.toLowerCase(),
                );

                return (
                  <MenuItemCard
                    key={menuItem.id}
                    item={menuItem}
                    quantity={qty}
                    isRecommended={isRecommended}
                    suggestedFor={suggestedFor}
                    onAdd={onAdd}
                    onRemove={onRemove}
                  />
                );
              })}
            </div>
          </div>
        );
      })}
    </>
  );
}
