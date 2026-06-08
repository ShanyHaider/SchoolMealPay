"use client";

import { Package, Pencil } from "lucide-react";
import type { FilterType, InventoryItem } from "./types";
import { cardStyle } from "./types";

// ─── Stock bar ────────────────────────────────────────────────────────────────

function StockBar({ current, reorder }: { current: number; reorder: number | null }) {
    if (!reorder || reorder === 0) return null;
    const pct = Math.min((current / (reorder * 2)) * 100, 100);
    const isCritical = current <= reorder * 0.5;
    const isLow = current <= reorder;
    return (
        <div className="w-full h-1.5 rounded-full mt-1" style={{ background: "var(--bg-tertiary)" }}>
            <div
                className="h-full rounded-full transition-all"
                style={{
                    width: `${pct}%`,
                    background: isCritical ? "#ef4444" : isLow ? "#f59e0b" : "#22c55e",
                }}
            />
        </div>
    );
}

function StatusBadge({ isCritical, isLow }: { isCritical: boolean; isLow: boolean }) {
    return (
        <span
            className="text-xs px-2 py-1 rounded-full font-medium whitespace-nowrap"
            style={
                isCritical
                    ? { background: "#ef444420", color: "#ef4444" }
                    : isLow
                        ? { background: "#f59e0b20", color: "#f59e0b" }
                        : { background: "#22c55e20", color: "#22c55e" }
            }
        >
            {isCritical ? "Critical" : isLow ? "Low" : "OK"}
        </span>
    );
}

// ─── Props ────────────────────────────────────────────────────────────────────

interface InventoryTableProps {
    items: InventoryItem[];
    activeFilter: FilterType;
    onEdit: (item: InventoryItem) => void;
}

// ─── Component ────────────────────────────────────────────────────────────────

export function InventoryTable({ items, activeFilter, onEdit }: InventoryTableProps) {
    if (items.length === 0) {
        return (
            <div
                className="rounded-xl border text-center py-16"
                style={cardStyle}
            >
                <Package size={32} className="mx-auto mb-3 opacity-30" style={{ color: "var(--text-muted)" }} />
                <p className="text-sm" style={{ color: "var(--text-muted)" }}>
                    {activeFilter !== "all" ? `No ${activeFilter} items` : "No inventory items yet"}
                </p>
                {activeFilter === "all" && (
                    <p className="text-xs mt-1" style={{ color: "var(--text-muted)" }}>
                        Add items to start tracking stock
                    </p>
                )}
            </div>
        );
    }

    return (
        <>
            {/* ── Desktop table (md+) ── */}
            <div className="hidden md:block rounded-xl border overflow-hidden" style={cardStyle}>
                <table className="w-full">
                    <thead>
                        <tr
                            style={{
                                borderBottom: "1px solid var(--border-primary)",
                                background: "var(--bg-secondary)",
                            }}
                        >
                            {["Item", "Unit", "Current Stock", "Reorder Level", "Status", ""].map((h) => (
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
                        {items.map((item) => {
                            const current = parseFloat(item.quantity);
                            const reorder = item.lowStockThreshold ? parseFloat(item.lowStockThreshold) : null;
                            const isLow = reorder !== null && current <= reorder;
                            const isCritical = reorder !== null && current <= reorder * 0.5;

                            return (
                                <tr
                                    key={item.id}
                                    className="border-t transition-colors hover:bg-[var(--bg-secondary)]"
                                    style={{ borderColor: "var(--border-primary)" }}
                                >
                                    <td className="px-4 py-3">
                                        <div className="flex items-center gap-2">
                                            <div
                                                className="w-7 h-7 rounded-lg flex items-center justify-center shrink-0"
                                                style={{ background: "var(--bg-tertiary)" }}
                                            >
                                                <Package size={13} style={{ color: "var(--text-muted)" }} />
                                            </div>
                                            <span className="text-sm font-medium" style={{ color: "var(--text-primary)" }}>
                                                {item.name}
                                            </span>
                                        </div>
                                    </td>
                                    <td className="px-4 py-3 text-sm" style={{ color: "var(--text-secondary)" }}>
                                        {item.unit}
                                    </td>
                                    <td className="px-4 py-3">
                                        <p className="text-sm font-semibold" style={{ color: "var(--text-primary)" }}>
                                            {item.quantity} {item.unit}
                                        </p>
                                        <StockBar current={current} reorder={reorder} />
                                    </td>
                                    <td className="px-4 py-3 text-sm" style={{ color: "var(--text-secondary)" }}>
                                        {item.lowStockThreshold ? (
                                            `${item.lowStockThreshold} ${item.unit}`
                                        ) : (
                                            <span style={{ color: "var(--text-muted)" }}>—</span>
                                        )}
                                    </td>
                                    <td className="px-4 py-3">
                                        <StatusBadge isCritical={isCritical} isLow={isLow} />
                                    </td>
                                    <td className="px-4 py-3">
                                        <button
                                            onClick={() => onEdit(item)}
                                            className="flex items-center gap-1 px-2 py-1.5 rounded-lg text-xs transition-colors hover:bg-[var(--bg-tertiary)]"
                                            style={{ color: "var(--text-secondary)" }}
                                        >
                                            <Pencil size={11} /> Edit
                                        </button>
                                    </td>
                                </tr>
                            );
                        })}
                    </tbody>
                </table>
            </div>

            {/* ── Mobile cards (< md) ── */}
            <div className="md:hidden space-y-2">
                {items.map((item) => {
                    const current = parseFloat(item.quantity);
                    const reorder = item.lowStockThreshold ? parseFloat(item.lowStockThreshold) : null;
                    const isLow = reorder !== null && current <= reorder;
                    const isCritical = reorder !== null && current <= reorder * 0.5;

                    return (
                        <div
                            key={item.id}
                            className="rounded-xl border p-4"
                            style={cardStyle}
                        >
                            {/* Header row */}
                            <div className="flex items-start justify-between gap-2 mb-3">
                                <div className="flex items-center gap-2 min-w-0">
                                    <div
                                        className="w-8 h-8 rounded-lg flex items-center justify-center shrink-0"
                                        style={{ background: "var(--bg-tertiary)" }}
                                    >
                                        <Package size={14} style={{ color: "var(--text-muted)" }} />
                                    </div>
                                    <span className="text-sm font-semibold truncate" style={{ color: "var(--text-primary)" }}>
                                        {item.name}
                                    </span>
                                </div>
                                <div className="flex items-center gap-2 shrink-0">
                                    <StatusBadge isCritical={isCritical} isLow={isLow} />
                                    <button
                                        onClick={() => onEdit(item)}
                                        className="flex items-center gap-1 px-2 py-1.5 rounded-lg text-xs transition-colors hover:bg-[var(--bg-tertiary)]"
                                        style={{ color: "var(--text-secondary)", border: "1px solid var(--border-input)" }}
                                    >
                                        <Pencil size={11} /> Edit
                                    </button>
                                </div>
                            </div>

                            {/* Stats row */}
                            <div
                                className="grid grid-cols-2 gap-px rounded-lg overflow-hidden text-xs"
                                style={{ background: "var(--border-card)" }}
                            >
                                <div className="px-3 py-2" style={{ background: "var(--bg-secondary)" }}>
                                    <p className="text-[10px] uppercase font-semibold tracking-wide mb-0.5" style={{ color: "var(--text-muted)" }}>
                                        Stock
                                    </p>
                                    <p className="font-semibold" style={{ color: "var(--text-primary)" }}>
                                        {item.quantity} {item.unit}
                                    </p>
                                    <StockBar current={current} reorder={reorder} />
                                </div>
                                <div className="px-3 py-2" style={{ background: "var(--bg-secondary)" }}>
                                    <p className="text-[10px] uppercase font-semibold tracking-wide mb-0.5" style={{ color: "var(--text-muted)" }}>
                                        Reorder at
                                    </p>
                                    <p className="font-semibold" style={{ color: "var(--text-primary)" }}>
                                        {item.lowStockThreshold ? `${item.lowStockThreshold} ${item.unit}` : "—"}
                                    </p>
                                </div>
                            </div>
                        </div>
                    );
                })}
            </div>
        </>
    );
}