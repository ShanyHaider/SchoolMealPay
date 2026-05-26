"use client";

import { useState, useTransition } from "react";
import {
  Package,
  AlertTriangle,
  Plus,
  RefreshCw,
  X,
  TrendingDown,
  CheckCircle,
} from "lucide-react";
import {
  createInventoryItem,
  updateInventoryQuantity,
} from "@/db/actions/Admin";

type InventoryItem = {
  id: string;
  name: string;
  unit: string;
  quantity: string;
  lowStockThreshold: string | null;
  canteenId: string;
};
type Canteen = {
  id: string;
  name: string;
  staffAssignments: { staff: { name: string } }[];
};

function inputSty() {
  return {
    background: "var(--bg-secondary)",
    borderColor: "var(--border-input)",
    color: "var(--text-primary)",
  };
}

function Modal({
  title,
  onClose,
  children,
}: {
  title: string;
  onClose: () => void;
  children: React.ReactNode;
}) {
  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4"
      style={{ background: "rgba(0,0,0,0.5)" }}
    >
      <div
        className="w-full max-w-md rounded-xl border shadow-xl"
        style={{
          background: "var(--bg-card)",
          borderColor: "var(--border-card)",
        }}
      >
        <div
          className="flex items-center justify-between p-5 border-b"
          style={{ borderColor: "var(--border-primary)" }}
        >
          <h3
            className="text-base font-semibold"
            style={{ color: "var(--text-primary)" }}
          >
            {title}
          </h3>
          <button
            onClick={onClose}
            className="w-7 h-7 flex items-center justify-center rounded-lg hover:bg-(--bg-tertiary) transition-colors"
          >
            <X size={14} style={{ color: "var(--text-muted)" }} />
          </button>
        </div>
        <div className="p-5">{children}</div>
      </div>
    </div>
  );
}

function StockBar({
  current,
  reorder,
}: {
  current: number;
  reorder: number | null;
}) {
  if (!reorder || reorder === 0) return null;
  const pct = Math.min((current / (reorder * 2)) * 100, 100);
  const isLow = current <= reorder;
  const isCritical = current <= reorder * 0.5;
  return (
    <div
      className="w-full h-1.5 rounded-full mt-1.5"
      style={{ background: "var(--bg-tertiary)" }}
    >
      <div
        className="h-full rounded-full transition-all"
        style={{
          width: `${pct}%`,
          background:
            isCritical ? "#ef4444"
            : isLow ? "#f59e0b"
            : "#22c55e",
        }}
      />
    </div>
  );
}

export function InventoryClient({
  canteens,
  initialInventory,
  defaultCanteenId,
}: {
  canteens: Canteen[];
  initialInventory: InventoryItem[];
  defaultCanteenId: string;
}) {
  const [canteenId, setCanteenId] = useState(defaultCanteenId);
  const [inventory, setInventory] = useState(initialInventory);
  const [isPending, startTransition] = useTransition();
  const [showAdd, setShowAdd] = useState(false);
  const [editStock, setEditStock] = useState<{
    id: string;
    name: string;
    current: string;
  } | null>(null);
  const [addForm, setAddForm] = useState({
    name: "",
    unit: "kg",
    quantity: "",
    lowStockThreshold: "",
  });
  const [newStock, setNewStock] = useState("");

  const lowItems = inventory.filter(
    (i) =>
      i.lowStockThreshold &&
      parseFloat(i.quantity) <= parseFloat(i.lowStockThreshold),
  );

  function handleAdd() {
    startTransition(async () => {
      await createInventoryItem({
        canteenId,
        name: addForm.name,
        unit: addForm.unit,
        quantity: addForm.quantity,
        lowStockThreshold: addForm.lowStockThreshold || undefined,
      });
      setShowAdd(false);
      setAddForm({ name: "", unit: "kg", quantity: "", lowStockThreshold: "" });
    });
  }

  function handleUpdateStock() {
    if (!editStock) return;
    startTransition(async () => {
      await updateInventoryQuantity(editStock.id, newStock);
      setInventory((prev) =>
        prev.map((i) =>
          i.id === editStock.id ? { ...i, quantity: newStock } : i,
        ),
      );
      setEditStock(null);
      setNewStock("");
    });
  }

  const cardStyle = {
    background: "var(--bg-card)",
    borderColor: "var(--border-card)",
    boxShadow: "var(--shadow-card)",
  };

  const UNITS = ["kg", "g", "L", "ml", "pcs", "boxes", "bags", "dozen"];

  return (
    <div className="space-y-5">
      {/* Controls */}
      <div className="flex flex-col sm:flex-row gap-3 items-start sm:items-center justify-between">
        <div className="flex items-center gap-3 ">
          <label
            className="text-sm font-medium"
            style={{ color: "var(--text-secondary)" }}
          >
            Canteen:
          </label>
          <select
            value={canteenId}
            onChange={(e) => setCanteenId(e.target.value)}
            className="px-3 py-1.5 text-sm rounded-lg border outline-none"
            style={inputSty()}
          >
            {canteens.map((c) => (
              <option key={c.id} value={c.id}>
                {c.name}
              </option>
            ))}
          </select>
        </div>
        <button
          onClick={() => setShowAdd(true)}
          className="flex items-center gap-1.5 px-3 py-2 rounded-lg text-sm font-medium"
          style={{ background: "var(--accent)", color: "var(--accent-text)" }}
        >
          <Plus size={14} /> Add Item
        </button>
      </div>

      {/* Low stock alert banner */}
      {lowItems.length > 0 && (
        <div
          className="flex items-start gap-3 p-4 rounded-xl border"
          style={{ background: "#f59e0b10", borderColor: "#f59e0b30" }}
        >
          <AlertTriangle
            size={16}
            style={{ color: "#f59e0b", flexShrink: 0, marginTop: 1 }}
          />
          <div>
            <p className="text-sm font-medium" style={{ color: "#f59e0b" }}>
              {lowItems.length} item{lowItems.length > 1 ? "s" : ""} below
              reorder level
            </p>
            <p
              className="text-xs mt-0.5"
              style={{ color: "var(--text-secondary)" }}
            >
              {lowItems.map((i) => i.name).join(", ")}
            </p>
          </div>
        </div>
      )}

      {/* Summary stats */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        {[
          {
            label: "Total Items",
            value: inventory.length,
            icon: Package,
            color: "#3b82f6",
          },
          {
            label: "Low Stock",
            value: lowItems.length,
            icon: TrendingDown,
            color: "#f59e0b",
          },
          {
            label: "Critical",
            value: inventory.filter(
              (i) =>
                i.lowStockThreshold &&
                parseFloat(i.quantity) <= parseFloat(i.lowStockThreshold) * 0.5,
            ).length,
            icon: AlertTriangle,
            color: "#ef4444",
          },
          {
            label: "Healthy",
            value: inventory.filter(
              (i) =>
                !i.lowStockThreshold ||
                parseFloat(i.quantity) > parseFloat(i.lowStockThreshold),
            ).length,
            icon: CheckCircle,
            color: "#22c55e",
          },
        ].map(({ label, value, icon: Icon, color }) => (
          <div key={label} className="rounded-xl border p-4" style={cardStyle}>
            <div className="flex items-center gap-2 mb-1">
              <Icon size={14} style={{ color }} />
              <span className="text-xs" style={{ color: "var(--text-muted)" }}>
                {label}
              </span>
            </div>
            <p
              className="text-2xl font-bold"
              style={{ color: "var(--text-primary)" }}
            >
              {value}
            </p>
          </div>
        ))}
      </div>

      {/* Inventory table */}
      <div className="rounded-xl border overflow-hidden" style={cardStyle}>
        {inventory.length === 0 ?
          <div className="text-center py-16">
            <Package
              size={32}
              className="mx-auto mb-3 opacity-30"
              style={{ color: "var(--text-muted)" }}
            />
            <p className="text-sm" style={{ color: "var(--text-muted)" }}>
              No inventory items yet
            </p>
            <p className="text-xs mt-1" style={{ color: "var(--text-muted)" }}>
              Add items to start tracking stock
            </p>
          </div>
        : <table className="w-full">
            <thead>
              <tr
                style={{
                  borderBottom: "1px solid var(--border-primary)",
                  background: "var(--bg-secondary)",
                }}
              >
                {[
                  "Item",
                  "Unit",
                  "Current Stock",
                  "Reorder Level",
                  "Status",
                  "",
                ].map((h) => (
                  <th
                    key={h}
                    className="text-left px-4 py-3 text-xs font-medium"
                    style={{ color: "var(--text-muted)" }}
                  >
                    {h}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {inventory.map((item) => {
                const current = parseFloat(item.quantity);
                const reorder =
                  item.lowStockThreshold ?
                    parseFloat(item.lowStockThreshold)
                  : null;
                const isLow = reorder !== null && current <= reorder;
                const isCritical = reorder !== null && current <= reorder * 0.5;

                return (
                  <tr
                    key={item.id}
                    className="border-t hover:bg-(--bg-secondary) transition-colors"
                    style={{ borderColor: "var(--border-primary)" }}
                  >
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-2">
                        <div
                          className="w-7 h-7 rounded-lg flex items-center justify-center"
                          style={{ background: "var(--bg-tertiary)" }}
                        >
                          <Package
                            size={13}
                            style={{ color: "var(--text-muted)" }}
                          />
                        </div>
                        <span
                          className="text-sm font-medium"
                          style={{ color: "var(--text-primary)" }}
                        >
                          {item.name}
                        </span>
                      </div>
                    </td>
                    <td
                      className="px-4 py-3 text-sm"
                      style={{ color: "var(--text-secondary)" }}
                    >
                      {item.unit}
                    </td>
                    <td className="px-4 py-3">
                      <p
                        className="text-sm font-semibold"
                        style={{ color: "var(--text-primary)" }}
                      >
                        {item.quantity} {item.unit}
                      </p>
                      <StockBar current={current} reorder={reorder} />
                    </td>
                    <td
                      className="px-4 py-3 text-sm"
                      style={{ color: "var(--text-secondary)" }}
                    >
                      {item.lowStockThreshold ?
                        `${item.lowStockThreshold} ${item.unit}`
                      : <span style={{ color: "var(--text-muted)" }}>—</span>}
                    </td>
                    <td className="px-4 py-3">
                      <span
                        className="text-xs px-2 py-1 rounded-full font-medium"
                        style={
                          isCritical ?
                            { background: "#ef444420", color: "#ef4444" }
                          : isLow ?
                            { background: "#f59e0b20", color: "#f59e0b" }
                          : { background: "#22c55e20", color: "#22c55e" }
                        }
                      >
                        {isCritical ?
                          "Critical"
                        : isLow ?
                          "Low"
                        : "OK"}
                      </span>
                    </td>
                    <td className="px-4 py-3">
                      <button
                        onClick={() => {
                          setEditStock({
                            id: item.id,
                            name: item.name,
                            current: item.quantity,
                          });
                          setNewStock(item.quantity);
                        }}
                        className="flex items-center gap-1 px-2 py-1.5 rounded-lg text-xs transition-colors hover:bg-(--bg-tertiary)"
                        style={{ color: "var(--text-secondary)" }}
                      >
                        <RefreshCw size={11} /> Update
                      </button>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        }
      </div>

      {/* Add Modal */}
      {showAdd && (
        <Modal title="Add Inventory Item" onClose={() => setShowAdd(false)}>
          <div className="space-y-3">
            <div>
              <label
                className="block text-xs font-medium mb-1.5"
                style={{ color: "var(--text-secondary)" }}
              >
                Item Name *
              </label>
              <input
                value={addForm.name}
                onChange={(e) =>
                  setAddForm((f) => ({ ...f, name: e.target.value }))
                }
                placeholder="e.g. Chicken"
                className="w-full px-3 py-2 rounded-lg border text-sm outline-none"
                style={inputSty()}
              />
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label
                  className="block text-xs font-medium mb-1.5"
                  style={{ color: "var(--text-secondary)" }}
                >
                  Unit *
                </label>
                <select
                  value={addForm.unit}
                  onChange={(e) =>
                    setAddForm((f) => ({ ...f, unit: e.target.value }))
                  }
                  className="w-full px-3 py-2 rounded-lg border text-sm outline-none"
                  style={inputSty()}
                >
                  {UNITS.map((u) => (
                    <option key={u} value={u}>
                      {u}
                    </option>
                  ))}
                </select>
              </div>
              <div>
                <label
                  className="block text-xs font-medium mb-1.5"
                  style={{ color: "var(--text-secondary)" }}
                >
                  Current Stock *
                </label>
                <input
                  type="number"
                  value={addForm.quantity}
                  onChange={(e) =>
                    setAddForm((f) => ({ ...f, quantity: e.target.value }))
                  }
                  placeholder="50"
                  className="w-full px-3 py-2 rounded-lg border text-sm outline-none"
                  style={inputSty()}
                />
              </div>
            </div>
            <div>
              <label
                className="block text-xs font-medium mb-1.5"
                style={{ color: "var(--text-secondary)" }}
              >
                Reorder Level (optional)
              </label>
              <input
                type="number"
                value={addForm.lowStockThreshold}
                onChange={(e) =>
                  setAddForm((f) => ({
                    ...f,
                    lowStockThreshold: e.target.value,
                  }))
                }
                placeholder="Alert when stock drops below this"
                className="w-full px-3 py-2 rounded-lg border text-sm outline-none"
                style={inputSty()}
              />
            </div>
            <div className="flex gap-2 pt-2">
              <button
                onClick={() => setShowAdd(false)}
                className="flex-1 py-2 rounded-lg text-sm border"
                style={{
                  borderColor: "var(--border-input)",
                  color: "var(--text-secondary)",
                }}
              >
                Cancel
              </button>
              <button
                onClick={handleAdd}
                disabled={!addForm.name || !addForm.quantity || isPending}
                className="flex-1 py-2 rounded-lg text-sm font-medium disabled:opacity-50"
                style={{
                  background: "var(--accent)",
                  color: "var(--accent-text)",
                }}
              >
                {isPending ? "Adding…" : "Add Item"}
              </button>
            </div>
          </div>
        </Modal>
      )}

      {/* Update stock modal */}
      {editStock && (
        <Modal
          title={`Update Stock — ${editStock.name}`}
          onClose={() => setEditStock(null)}
        >
          <div className="space-y-4">
            <p className="text-sm" style={{ color: "var(--text-secondary)" }}>
              Current:{" "}
              <strong style={{ color: "var(--text-primary)" }}>
                {editStock.current}
              </strong>
            </p>
            <div>
              <label
                className="block text-xs font-medium mb-1.5"
                style={{ color: "var(--text-secondary)" }}
              >
                New Stock Level *
              </label>
              <input
                type="number"
                value={newStock}
                onChange={(e) => setNewStock(e.target.value)}
                className="w-full px-3 py-2 rounded-lg border text-sm outline-none"
                style={inputSty()}
                autoFocus
              />
            </div>
            <div className="flex gap-2">
              <button
                onClick={() => setEditStock(null)}
                className="flex-1 py-2 rounded-lg text-sm border"
                style={{
                  borderColor: "var(--border-input)",
                  color: "var(--text-secondary)",
                }}
              >
                Cancel
              </button>
              <button
                onClick={handleUpdateStock}
                disabled={!newStock || isPending}
                className="flex-1 py-2 rounded-lg text-sm font-medium disabled:opacity-50"
                style={{
                  background: "var(--accent)",
                  color: "var(--accent-text)",
                }}
              >
                {isPending ? "Saving…" : "Update Stock"}
              </button>
            </div>
          </div>
        </Modal>
      )}
    </div>
  );
}
