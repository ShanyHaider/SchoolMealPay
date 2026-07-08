"use client";

import { useState, useTransition } from "react";
import { createPortal } from "react-dom";
import { Trash2, Pencil } from "lucide-react";
import { deleteMenuItem } from "@/db/actions/admin/Canteen";
import { ConfirmModal } from "@/components/ConfirmModal";
import { MenuItemModal } from "./MenuItemModal";
import type { MenuItem } from "@/types/canteenMenuTypes";
import { CatalogueGrid } from "@/components/CatalogueGrid";

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
      } catch (err) {
        onError(err instanceof Error ? err.message : "Failed to delete item.");
      } finally {
        setDeletingId(null);
      }
    });
  };

  return (
    <>
      <CatalogueGrid
        menuItems={menuItems}
        renderActions={(item) => (
          <>
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
          </>
        )}
      />

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
