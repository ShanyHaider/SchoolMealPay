"use client";

import { Plus } from "lucide-react";
import { PortalSelect } from "@/components/PortalSelect";
import type { Canteen } from "./types";

interface InventoryControlsProps {
    canteens: Canteen[];
    canteenId: string;
    onCanteenChange: (id: string) => void;
    onAddClick: () => void;
}

export function InventoryControls({
    canteens,
    canteenId,
    onCanteenChange,
    onAddClick,
}: InventoryControlsProps) {
    const canteenOptions = canteens.map((c) => ({ value: c.id, label: c.name }));

    return (
        <div className="flex flex-col sm:flex-row gap-3 items-start sm:items-center justify-between">
            <div className="w-full sm:w-56">
                <PortalSelect
                    options={canteenOptions}
                    value={canteenId}
                    onChange={(v) => v && onCanteenChange(v)}
                    placeholder="Select canteen…"
                />
            </div>
            <button
                onClick={onAddClick}
                className="w-full sm:w-auto flex items-center justify-center gap-1.5 px-3 py-2 rounded-lg text-sm font-medium"
                style={{ background: "var(--accent)", color: "var(--accent-text)" }}
            >
                <Plus size={14} /> Add Item
            </button>
        </div>
    );
}