"use client";

import { AlertTriangle } from "lucide-react";
import type { InventoryItem } from "../../../../../types/inventoryTypes";

export function InventoryAlertBanner({ lowItems }: { lowItems: InventoryItem[] }) {
    if (lowItems.length === 0) return null;

    return (
        <div
            className="flex items-start gap-3 p-4 rounded-xl border"
            style={{ background: "#f59e0b10", borderColor: "#f59e0b30" }}
        >
            <AlertTriangle size={16} style={{ color: "#f59e0b", flexShrink: 0, marginTop: 1 }} />
            <div>
                <p className="text-sm font-medium" style={{ color: "#f59e0b" }}>
                    {lowItems.length} item{lowItems.length > 1 ? "s" : ""} below reorder level
                </p>
                <p className="text-xs mt-0.5" style={{ color: "var(--text-secondary)" }}>
                    {lowItems.map((i) => i.name).join(", ")}
                </p>
            </div>
        </div>
    );
}