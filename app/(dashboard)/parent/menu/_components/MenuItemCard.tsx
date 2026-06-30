"use client";

import { Plus, Minus, Sparkles } from "lucide-react";
import type { MenuItem } from "./types";
import { formatPKR } from "@/lib/currency";

interface MenuItemCardProps {
  item: MenuItem;
  quantity: number;
  isRecommended: boolean;
  suggestedFor: string;
  onAdd: (item: { id: string; name: string; price: number }) => void;
  onRemove: (menuItemId: string) => void;
}

export function MenuItemCard({
  item,
  quantity,
  isRecommended,
  suggestedFor,
  onAdd,
  onRemove,
}: MenuItemCardProps) {
  return (
    <div
      className={`bg-(--bg-card) border rounded-2xl p-6 shadow-sm hover:shadow-md transition-all flex flex-col justify-between ${
        isRecommended ?
          "border-violet-300 dark:border-violet-700 ring-1 ring-violet-200 dark:ring-violet-800"
        : "border-(--border-card)"
      }`}
    >
      <div>
        <div className="flex justify-between items-start mb-2">
          <div className="flex flex-col gap-1">
            <h4 className="text-lg font-bold text-(--text-primary)">
              {item.name}
            </h4>
            {isRecommended && (
              <span className="inline-flex items-center gap-1 text-[10px] font-bold text-violet-600 dark:text-violet-400 uppercase tracking-wider">
                <Sparkles size={9} />
                Recommended for {suggestedFor}
              </span>
            )}
          </div>
          <span className="text-sm font-bold text-(--text-primary) shrink-0 ml-2">
            {formatPKR(item.price)}
          </span>
        </div>

        <p className="text-sm text-(--text-secondary) font-medium line-clamp-2 mb-4">
          {item.description || "Standard nutritious meal."}
        </p>

        <div className="flex flex-wrap gap-2 mb-6">
          {item.isSpecialOfDay && (
            <span className="text-[11px] px-2 py-0.5 rounded-lg font-bold bg-amber-500/10 text-amber-600 border border-amber-500/20">
              Special
            </span>
          )}
          {item.isVegetarian && (
            <span className="text-[11px] px-2 py-0.5 rounded-lg font-bold bg-green-500/10 text-green-600 border border-green-500/20">
              Veg
            </span>
          )}
          {item.calories && (
            <span className="text-[11px] px-2 py-0.5 rounded-lg font-bold bg-zinc-100 text-zinc-900 border border-zinc-200 dark:bg-zinc-800 dark:text-zinc-100 dark:border-zinc-700">
              {item.calories} kcal
            </span>
          )}
        </div>
      </div>

      <div className="flex items-center justify-end gap-3 pt-4 border-t border-(--border-card)">
        {quantity > 0 ?
          <div className="flex items-center gap-4 bg-(--bg-secondary) rounded-xl p-1.5 border border-(--border-card)">
            <button
              onClick={() => onRemove(item.id)}
              className="w-8 h-8 rounded-lg flex items-center justify-center bg-(--bg-card) hover:bg-zinc-200 dark:hover:bg-zinc-700 transition-colors text-(--text-primary)"
            >
              <Minus size={14} />
            </button>
            <span className="text-sm font-bold min-w-4 text-center">
              {quantity}
            </span>
            <button
              onClick={() => onAdd(item)}
              className="w-8 h-8 rounded-lg flex items-center justify-center bg-(--bg-card) hover:bg-zinc-200 dark:hover:bg-zinc-700 transition-colors text-(--text-primary)"
            >
              <Plus size={14} />
            </button>
          </div>
        : <button
            onClick={() => onAdd(item)}
            className="flex items-center gap-2 px-5 py-2.5 bg-zinc-900 text-white dark:bg-zinc-100 dark:text-zinc-900 rounded-xl text-xs font-bold hover:opacity-90 transition-all active:scale-95"
          >
            <Plus size={14} /> Add to Cart
          </button>
        }
      </div>
    </div>
  );
}
