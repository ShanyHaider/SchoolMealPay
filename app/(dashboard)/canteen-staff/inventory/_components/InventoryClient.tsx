"use client";

import { useState, useTransition } from "react";
import { updateInventoryQuantity } from "@/db/actions/Staff";
import { Package, AlertTriangle, Check, Pencil, X } from "lucide-react";

export function InventoryClient({ inventory }: { inventory: any[] }) {
  const [isPending, startTransition] = useTransition();
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editValue, setEditValue] = useState("");

  const startEdit = (item: any) => {
    setEditingId(item.id);
    // Schema field is `quantity`, not currentStock
    setEditValue(item.quantity ?? "0");
  };

  const saveEdit = (id: string) => {
    startTransition(async () => {
      await updateInventoryQuantity(id, editValue);
      setEditingId(null);
    });
  };

  // Schema field is `lowStockThreshold`, not reorderLevel
  const isLow = (item: any) =>
    item.lowStockThreshold &&
    parseFloat(item.quantity ?? "0") <= parseFloat(item.lowStockThreshold);

  const lowStockItems = inventory.filter(isLow);

  return (
    <div className="space-y-4">
      {/* Low stock banner */}
      {lowStockItems.length > 0 && (
        <div
          className="flex items-start gap-3 px-4 py-3 rounded-xl"
          style={{
            background: "rgba(245,158,11,0.08)",
            border: "1px solid rgba(245,158,11,0.2)",
          }}
        >
          <AlertTriangle
            size={16}
            style={{ color: "#f59e0b", flexShrink: 0, marginTop: 1 }}
          />
          <div>
            <p className="text-sm font-semibold" style={{ color: "#f59e0b" }}>
              {lowStockItems.length} item{lowStockItems.length !== 1 ? "s" : ""}{" "}
              low on stock
            </p>
            <p
              className="text-xs mt-0.5"
              style={{ color: "rgba(245,158,11,0.7)" }}
            >
              {lowStockItems.map((i: any) => i.name).join(", ")}
            </p>
          </div>
        </div>
      )}

      <div
        className="rounded-xl border overflow-hidden"
        style={{
          background: "var(--bg-card)",
          borderColor: "var(--border-card)",
          boxShadow: "var(--shadow-card)",
        }}
      >
        {inventory.length === 0 ?
          <div className="py-16 text-center">
            <Package
              size={32}
              className="mx-auto mb-3"
              style={{ color: "var(--text-muted)" }}
            />
            <p className="text-sm" style={{ color: "var(--text-muted)" }}>
              No inventory items. Admin can add items from the admin panel.
            </p>
          </div>
        : <table className="w-full text-sm">
            <thead>
              <tr style={{ borderBottom: "1px solid var(--border-primary)" }}>
                {[
                  "Item",
                  "Unit",
                  "Quantity",
                  "Low Stock Threshold",
                  "Status",
                  "",
                ].map((h) => (
                  <th
                    key={h}
                    className="px-5 py-3 text-left text-xs font-medium"
                    style={{ color: "var(--text-muted)" }}
                  >
                    {h}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {inventory.map((item: any, i: number) => {
                const low = isLow(item);
                const isLast = i === inventory.length - 1;

                return (
                  <tr
                    key={item.id}
                    className="transition-colors hover:bg-(--bg-secondary)"
                    style={{
                      borderBottom:
                        isLast ? undefined : "1px solid var(--border-primary)",
                      background: low ? "rgba(245,158,11,0.03)" : undefined,
                    }}
                  >
                    <td className="px-5 py-4">
                      <div className="flex items-center gap-2">
                        {low && (
                          <AlertTriangle
                            size={13}
                            style={{ color: "#f59e0b", flexShrink: 0 }}
                          />
                        )}
                        <span
                          className="font-medium"
                          style={{ color: "var(--text-primary)" }}
                        >
                          {item.name}
                        </span>
                      </div>
                    </td>
                    <td
                      className="px-5 py-4"
                      style={{ color: "var(--text-secondary)" }}
                    >
                      {item.unit}
                    </td>
                    <td className="px-5 py-4">
                      {editingId === item.id ?
                        <div className="flex items-center gap-2">
                          <input
                            value={editValue}
                            onChange={(e) => setEditValue(e.target.value)}
                            type="number"
                            step="0.001"
                            className="w-24 px-2 py-1 rounded-lg text-sm outline-none"
                            style={{
                              background: "var(--bg-secondary)",
                              border: "1px solid var(--border-input-focus)",
                              color: "var(--text-primary)",
                            }}
                            autoFocus
                            onKeyDown={(e) => {
                              if (e.key === "Enter") saveEdit(item.id);
                              if (e.key === "Escape") setEditingId(null);
                            }}
                          />
                          <button
                            onClick={() => saveEdit(item.id)}
                            disabled={isPending}
                            className="p-1.5 rounded-lg transition-colors disabled:opacity-50"
                            style={{
                              background: "rgba(34,197,94,0.12)",
                              color: "#22c55e",
                            }}
                          >
                            <Check size={13} />
                          </button>
                          <button
                            onClick={() => setEditingId(null)}
                            className="p-1.5 rounded-lg"
                            style={{ color: "var(--text-muted)" }}
                          >
                            <X size={13} />
                          </button>
                        </div>
                      : <span
                          className="font-semibold tabular-nums"
                          style={{
                            color: low ? "#f59e0b" : "var(--text-primary)",
                          }}
                        >
                          {/* `quantity` is the schema field */}
                          {parseFloat(item.quantity ?? "0").toFixed(2)}
                        </span>
                      }
                    </td>
                    <td
                      className="px-5 py-4"
                      style={{ color: "var(--text-secondary)" }}
                    >
                      {/* `lowStockThreshold` is the schema field */}
                      {item.lowStockThreshold ?
                        parseFloat(item.lowStockThreshold).toFixed(2)
                      : "—"}
                    </td>
                    <td className="px-5 py-4">
                      <span
                        className="px-2 py-0.5 rounded-full text-xs font-medium"
                        style={
                          low ?
                            {
                              background: "rgba(245,158,11,0.12)",
                              color: "#f59e0b",
                            }
                          : {
                              background: "rgba(34,197,94,0.12)",
                              color: "#22c55e",
                            }
                        }
                      >
                        {low ? "Low Stock" : "OK"}
                      </span>
                    </td>
                    <td className="px-5 py-4">
                      {editingId !== item.id && (
                        <button
                          onClick={() => startEdit(item)}
                          className="p-1.5 rounded-lg transition-colors"
                          style={{ color: "var(--text-muted)" }}
                          title="Update quantity"
                        >
                          <Pencil size={13} />
                        </button>
                      )}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        }
      </div>
    </div>
  );
}
