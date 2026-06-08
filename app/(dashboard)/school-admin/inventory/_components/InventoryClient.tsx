"use client";

import { useState, useTransition } from "react";
import {
  createInventoryItem,
  updateInventoryQuantity,
  updateInventoryItem,
} from "@/db/actions/admin/Canteen";
import { useToast, ToastContainer } from "@/components/useToast";
import { InventoryControls } from "./InventoryControls";
import { InventoryAlertBanner } from "./InventoryAlertBanner";
import { InventoryStatCards } from "./InventoryStatCards";
import { InventoryTable } from "./InventoryTable";
import { InventoryItemModal } from "./InventoryItemModal";
import type {
  Canteen,
  FilterType,
  InventoryItem,
  AddInventoryValues,
  EditInventoryValues,
} from "./types";

// ─── Props ────────────────────────────────────────────────────────────────────

interface InventoryClientProps {
  canteens: Canteen[];
  initialInventory: InventoryItem[];
  defaultCanteenId: string;
}

// ─── Component ────────────────────────────────────────────────────────────────

export function InventoryClient({
  canteens,
  initialInventory,
  defaultCanteenId,
}: InventoryClientProps) {
  const { toasts, toast, dismiss } = useToast();
  const [isPending, startTransition] = useTransition();

  const [canteenId, setCanteenId] = useState(defaultCanteenId);
  const [inventory, setInventory] = useState<InventoryItem[]>(initialInventory);
  const [activeFilter, setActiveFilter] = useState<FilterType>("all");

  // Modal state — null = closed, "add" = add mode, InventoryItem = edit mode
  const [modalState, setModalState] = useState<null | "add" | InventoryItem>(null);

  // ── Derived lists ─────────────────────────────────────────────────────────

  const lowItems = inventory.filter(
    (i) => i.lowStockThreshold && parseFloat(i.quantity) <= parseFloat(i.lowStockThreshold),
  );
  const criticalItems = inventory.filter(
    (i) =>
      i.lowStockThreshold &&
      parseFloat(i.quantity) <= parseFloat(i.lowStockThreshold) * 0.5,
  );
  const healthyItems = inventory.filter(
    (i) => !i.lowStockThreshold || parseFloat(i.quantity) > parseFloat(i.lowStockThreshold),
  );
  const displayedInventory =
    activeFilter === "critical" ? criticalItems
      : activeFilter === "low" ? lowItems
        : activeFilter === "healthy" ? healthyItems
          : inventory;

  // ── Handlers ──────────────────────────────────────────────────────────────

  const handleAdd = (data: AddInventoryValues) => {
    startTransition(async () => {
      try {
        await createInventoryItem({
          canteenId,
          name: data.name,
          unit: data.unit,
          quantity: data.quantity,
          lowStockThreshold: data.lowStockThreshold || undefined,
        });
        toast("Item added to inventory");
        setModalState(null);
      } catch {
        toast("Failed to add item", "error");
      }
    });
  };

  const handleEdit = (data: EditInventoryValues) => {
    const item = modalState as InventoryItem;
    startTransition(async () => {
      try {
        await updateInventoryItem(item.id, {
          name: data.name,
          unit: data.unit,
          lowStockThreshold: data.lowStockThreshold || undefined,
        });
        await updateInventoryQuantity(item.id, data.quantity);
        setInventory((prev) =>
          prev.map((i) =>
            i.id === item.id
              ? {
                ...i,
                name: data.name,
                unit: data.unit,
                quantity: data.quantity,
                lowStockThreshold: data.lowStockThreshold || null,
              }
              : i,
          ),
        );
        toast("Item updated");
        setModalState(null);
      } catch {
        toast("Failed to update item", "error");
      }
    });
  };

  // ── Render ────────────────────────────────────────────────────────────────

  return (
    <>
      <ToastContainer toasts={toasts} dismiss={dismiss} />

      <div className="space-y-5">
        <InventoryControls
          canteens={canteens}
          canteenId={canteenId}
          onCanteenChange={setCanteenId}
          onAddClick={() => setModalState("add")}
        />

        <InventoryAlertBanner lowItems={lowItems} />

        <InventoryStatCards
          inventory={inventory}
          lowItems={lowItems}
          criticalItems={criticalItems}
          healthyItems={healthyItems}
          activeFilter={activeFilter}
          onFilterChange={setActiveFilter}
        />

        <InventoryTable
          items={displayedInventory}
          activeFilter={activeFilter}
          onEdit={(item) => setModalState(item)}
        />
      </div>

      {modalState === "add" && (
        <InventoryItemModal
          mode="add"
          isPending={isPending}
          onClose={() => setModalState(null)}
          onAdd={handleAdd}
        />
      )}

      {modalState !== null && modalState !== "add" && (
        <InventoryItemModal
          mode="edit"
          item={modalState}
          isPending={isPending}
          onClose={() => setModalState(null)}
          onEdit={handleEdit}
        />
      )}
    </>
  );
}