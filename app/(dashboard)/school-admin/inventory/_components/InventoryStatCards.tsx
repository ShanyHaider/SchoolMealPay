"use client";

import { Package, AlertTriangle, TrendingDown, CheckCircle, X } from "lucide-react";
import type { FilterType, InventoryItem } from "../../../../../types/inventoryTypes";
import { cardStyle } from "../../../../../types/inventoryTypes";

interface InventoryStatCardsProps {
    inventory: InventoryItem[];
    lowItems: InventoryItem[];
    criticalItems: InventoryItem[];
    healthyItems: InventoryItem[];
    activeFilter: FilterType;
    onFilterChange: (f: FilterType) => void;
}

export function InventoryStatCards({
    inventory,
    lowItems,
    criticalItems,
    healthyItems,
    activeFilter,
    onFilterChange,
}: InventoryStatCardsProps) {
    const stats: {
        label: string;
        value: number;
        icon: React.ElementType;
        color: string;
        filter: FilterType;
    }[] = [
            { label: "Total Items", value: inventory.length, icon: Package, color: "#3b82f6", filter: "all" },
            { label: "Low Stock", value: lowItems.length, icon: TrendingDown, color: "#f59e0b", filter: "low" },
            { label: "Critical", value: criticalItems.length, icon: AlertTriangle, color: "#ef4444", filter: "critical" },
            { label: "Healthy", value: healthyItems.length, icon: CheckCircle, color: "#22c55e", filter: "healthy" },
        ];

    const activeColor = stats.find((s) => s.filter === activeFilter)?.color;

    return (
        <div className="space-y-3">
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                {stats.map(({ label, value, icon: Icon, color, filter }) => {
                    const isActive = activeFilter === filter;
                    return (
                        <div
                            key={label}
                            onClick={() => onFilterChange(isActive && filter !== "all" ? "all" : filter)}
                            className="rounded-xl border p-4 cursor-pointer transition-all select-none"
                            style={{
                                ...cardStyle,
                                ...(isActive && filter !== "all"
                                    ? { borderColor: color, boxShadow: `0 0 0 2px ${color}30` }
                                    : {}),
                            }}
                        >
                            <div className="flex items-center gap-2 mb-1">
                                <Icon size={14} style={{ color }} />
                                <span className="text-xs" style={{ color: "var(--text-muted)" }}>{label}</span>
                                {filter !== "all" && (
                                    <span
                                        className="ml-auto text-[10px] px-1.5 py-0.5 rounded-full"
                                        style={{ background: `${color}15`, color }}
                                    >
                                        {isActive ? "ON" : "filter"}
                                    </span>
                                )}
                            </div>
                            <p className="text-2xl font-bold" style={{ color: "var(--text-primary)" }}>
                                {value}
                            </p>
                        </div>
                    );
                })}
            </div>

            {/* Active filter pill */}
            {activeFilter !== "all" && (
                <div className="flex items-center gap-2">
                    <span
                        className="text-xs px-2.5 py-1 rounded-full flex items-center gap-1.5"
                        style={{
                            background: `${activeColor}15`,
                            color: activeColor,
                            border: `1px solid ${activeColor}30`,
                        }}
                    >
                        Showing {activeFilter} items only
                        <button
                            onClick={() => onFilterChange("all")}
                            className="ml-1 hover:opacity-70"
                        >
                            <X size={11} />
                        </button>
                    </span>
                </div>
            )}
        </div>
    );
}