"use client";

import { useState, useTransition } from "react";
import { createPortal } from "react-dom";
import { Trash2, Pencil, UtensilsCrossed, Leaf } from "lucide-react";
import { deleteMenuItem } from "@/db/actions/admin/Canteen";
import { ConfirmModal } from "@/components/ConfirmModal";
import { MenuItemModal, CATEGORY_ICONS_JSX } from "./MenuItemModal";
import type { MenuItem } from "../../../../../types/canteenMenuTypes";
import { formatPKR } from "@/lib/currency";

interface CatalogueTabProps {
  menuItems: MenuItem[];
  canteenId: string;
  onSuccess: (message: string) => void;
  onError: (message: string) => void;
}

export function CatalogueTab({
  menuItems,
  canteenId,
  onSuccess,
  onError,
}: CatalogueTabProps) {
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [editingItem, setEditingItem] = useState<MenuItem | null>(null);
  const [isDeleting, startDeleteTransition] = useTransition();

  const confirmDelete = () => {
    if (!deletingId) return;
    const item = menuItems.find((m) => m.id === deletingId);
    startDeleteTransition(async () => {
      try {
        await deleteMenuItem(deletingId);
        onSuccess(`"${item?.name ?? "Item"}" removed from catalogue.`);
      } catch {
        onError("Failed to delete item.");
      } finally {
        setDeletingId(null);
      }
    });
  };

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
          No menu items yet. Add your first item.
        </p>
      </div>
    );
  }

  return (
    <>
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
            {/* Header row: name + action buttons */}
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
                    {CATEGORY_ICONS_JSX[item.category as ItemCategory]}
                  </span>
                  <p
                    className="text-xs capitalize"
                    style={{ color: "var(--text-muted)" }}
                  >
                    {item.category}
                  </p>
                </div>
              </div>

              {/* Edit + Delete buttons */}
              <div className="flex items-center gap-0.5 shrink-0">
                <button
                  onClick={() => setEditingItem(item)}
                  disabled={isDeleting}
                  className="p-1.5 rounded-lg disabled:opacity-40 transition-colors hover:bg-(--bg-tertiary)"
                  style={{ color: "var(--text-muted)" }}
                  title="Edit item"
                >
                  <Pencil size={13} />
                </button>
                <button
                  onClick={() => setDeletingId(item.id)}
                  disabled={isDeleting}
                  className="p-1.5 rounded-lg disabled:opacity-40 transition-colors hover:bg-(--bg-tertiary)"
                  style={{ color: "#ef4444" }}
                  title="Delete item"
                >
                  <Trash2 size={13} />
                </button>
              </div>
            </div>

            {/* Price + calories */}
            <div className="flex items-center gap-2 mb-3">
              <span
                className="text-lg font-bold"
                style={{ color: "var(--text-primary)" }}
              >
                {formatPKR(item.price)}
              </span>
              {item.calories && (
                <span
                  className="text-xs"
                  style={{ color: "var(--text-muted)" }}
                >
                  {item.calories} kcal
                </span>
              )}
            </div>

            {/* Dietary badges */}
            <div className="flex gap-1.5 flex-wrap mt-auto">
              {item.isVegetarian && (
                <span
                  className="px-2 py-0.5 rounded-full text-xs"
                  style={{
                    background: "rgba(34,197,94,0.12)",
                    color: "#22c55e",
                  }}
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

      {/* Edit modal */}
      {editingItem && (
        <MenuItemModal
          item={editingItem}
          canteenId={canteenId}
          onClose={() => setEditingItem(null)}
          onSuccess={(msg) => {
            onSuccess(msg);
            setEditingItem(null);
          }}
          onError={onError}
        />
      )}

      {/* Delete confirm */}
      {deletingId &&
        createPortal(
          <ConfirmModal
            title="Delete menu item"
            description={`Permanently delete "${menuItems.find((m) => m.id === deletingId)?.name ?? "this item"}"? It will be removed from the catalogue and any scheduled menus.`}
            confirmLabel="Delete"
            variant="danger"
            isPending={isDeleting}
            onClose={() => setDeletingId(null)}
            onConfirm={confirmDelete}
          />,
          document.body,
        )}
    </>
  );
}

// Local alias so the JSX above compiles — ItemCategory is used in the icon lookup
type ItemCategory = keyof typeof CATEGORY_ICONS_JSX;
