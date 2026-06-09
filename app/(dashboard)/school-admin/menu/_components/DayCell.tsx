"use client";

import { Plus, Trash2, Loader2 } from "lucide-react";
import { CustomSelect, type DropdownOption } from "./CustomSelect";
import type { DailyMenu, MealSlot } from "../../../../../types/menuTypes";

// ─── Props ────────────────────────────────────────────────────────────────────

export interface DayCellProps {
    date: string;
    slot: MealSlot;
    items: DailyMenu[];
    isScheduling: boolean;
    isRemoving: boolean;
    removingId: string | null;
    /** The date currently open for item-picking, or null */
    schedulingDay: string | null;
    schedulePickValue: string;
    menuItemOptions: DropdownOption[];
    onStartSchedule: () => void;
    onCancelSchedule: () => void;
    onPickItem: (id: string) => void;
    onConfirmSchedule: (id: string) => void;
    onRemove: (dm: DailyMenu) => void;
}

// ─── Chip ─────────────────────────────────────────────────────────────────────

export function ScheduledItemChip({
    dm,
    isRemoving,
    onRemove,
}: {
    dm: DailyMenu;
    isRemoving: boolean;
    onRemove: (dm: DailyMenu) => void;
}) {
    return (
        <div
            className="group relative rounded-lg p-2 text-xs"
            style={{
                background: "rgba(139,92,246,0.1)",
                border: "1px solid rgba(139,92,246,0.2)",
            }}
        >
            <p
                className="font-medium leading-tight pr-4 truncate"
                style={{ color: "var(--text-primary)" }}
            >
                {dm.menuItem?.name}
            </p>
            <p style={{ color: "var(--text-muted)" }}>
                Rs. {parseFloat(dm.menuItem?.price ?? "0").toFixed(0)}
            </p>
            <button
                onClick={() => onRemove(dm)}
                disabled={isRemoving}
                className="absolute top-1 right-1 opacity-0 group-hover:opacity-100 transition-opacity disabled:opacity-30"
                style={{ color: "#ef4444" }}
            >
                {isRemoving ? (
                    <Loader2 size={10} className="animate-spin" />
                ) : (
                    <Trash2 size={10} />
                )}
            </button>
        </div>
    );
}

// ─── Shared picker UI ─────────────────────────────────────────────────────────

const PICK_OPTIONS_PREFIX: DropdownOption[] = [
    { value: "", label: "Pick item…" },
];

function ItemPicker({
    schedulePickValue,
    menuItemOptions,
    isScheduling,
    compact,
    onPickItem,
    onConfirmSchedule,
    onCancelSchedule,
}: Pick<
    DayCellProps,
    | "schedulePickValue"
    | "menuItemOptions"
    | "isScheduling"
    | "onPickItem"
    | "onConfirmSchedule"
    | "onCancelSchedule"
> & { compact?: boolean }) {
    return (
        <div className={compact ? "space-y-1" : "space-y-2"}>
            <CustomSelect
                options={[...PICK_OPTIONS_PREFIX, ...menuItemOptions]}
                value={schedulePickValue}
                onChange={(v) => {
                    if (v) {
                        onPickItem(v);
                        onConfirmSchedule(v);
                    }
                }}
                disabled={isScheduling}
                compact={compact}
            />
            <button
                onClick={onCancelSchedule}
                disabled={isScheduling}
                className={`w-full text-center disabled:opacity-50 ${compact ? "text-xs py-0.5" : "text-sm py-1"}`}
                style={{ color: "var(--text-muted)" }}
            >
                Cancel
            </button>
        </div>
    );
}

// ─── Desktop cell ─────────────────────────────────────────────────────────────

export function DesktopDayCell({
    date,
    isLast,
    items,
    isScheduling,
    isRemoving,
    removingId,
    schedulingDay,
    schedulePickValue,
    menuItemOptions,
    onStartSchedule,
    onCancelSchedule,
    onPickItem,
    onConfirmSchedule,
    onRemove,
}: DayCellProps & { isLast: boolean }) {
    const isOpen = schedulingDay === date;

    return (
        <div
            className="p-2 min-h-[200px] flex flex-col"
            style={{
                borderRight: !isLast ? "1px solid var(--border-primary)" : undefined,
            }}
        >
            <div className="space-y-1.5 flex-1">
                {items.map((dm) => (
                    <ScheduledItemChip
                        key={dm.id}
                        dm={dm}
                        isRemoving={removingId === dm.id}
                        onRemove={onRemove}
                    />
                ))}
            </div>

            <div className="mt-1.5">
                {isOpen ? (
                    <ItemPicker
                        schedulePickValue={schedulePickValue}
                        menuItemOptions={menuItemOptions}
                        isScheduling={isScheduling}
                        compact
                        onPickItem={onPickItem}
                        onConfirmSchedule={onConfirmSchedule}
                        onCancelSchedule={onCancelSchedule}
                    />
                ) : (
                    <button
                        onClick={onStartSchedule}
                        disabled={isScheduling || isRemoving}
                        className="w-full py-1 rounded text-xs transition-all hover:bg-[var(--bg-tertiary)] flex items-center justify-center gap-1 disabled:opacity-40"
                        style={{
                            color: "var(--text-muted)",
                            border: "1px dashed var(--border-primary)",
                        }}
                    >
                        {isScheduling ? (
                            <Loader2 size={10} className="animate-spin" />
                        ) : (
                            <Plus size={10} />
                        )}
                        Add
                    </button>
                )}
            </div>
        </div>
    );
}

// ─── Mobile cell ──────────────────────────────────────────────────────────────

export function MobileDayCell({
    date,
    items,
    isScheduling,
    isRemoving,
    removingId,
    schedulingDay,
    schedulePickValue,
    menuItemOptions,
    onStartSchedule,
    onCancelSchedule,
    onPickItem,
    onConfirmSchedule,
    onRemove,
}: DayCellProps) {
    const isOpen = schedulingDay === date;

    return (
        <div
            className="rounded-xl border p-4 space-y-2"
            style={{
                background: "var(--bg-card)",
                borderColor: "var(--border-card)",
                boxShadow: "var(--shadow-card)",
                minHeight: 120,
            }}
        >
            {items.length === 0 && !isOpen && (
                <p
                    className="text-xs text-center py-4"
                    style={{ color: "var(--text-muted)" }}
                >
                    Nothing scheduled
                </p>
            )}

            {items.map((dm) => (
                <ScheduledItemChip
                    key={dm.id}
                    dm={dm}
                    isRemoving={removingId === dm.id}
                    onRemove={onRemove}
                />
            ))}

            {isOpen ? (
                <ItemPicker
                    schedulePickValue={schedulePickValue}
                    menuItemOptions={menuItemOptions}
                    isScheduling={isScheduling}
                    onPickItem={onPickItem}
                    onConfirmSchedule={onConfirmSchedule}
                    onCancelSchedule={onCancelSchedule}
                />
            ) : (
                <button
                    onClick={onStartSchedule}
                    disabled={isScheduling || isRemoving}
                    className="w-full py-2 rounded-lg text-sm transition-all flex items-center justify-center gap-1.5 disabled:opacity-40"
                    style={{
                        color: "var(--text-muted)",
                        border: "1px dashed var(--border-primary)",
                    }}
                >
                    {isScheduling ? (
                        <Loader2 size={12} className="animate-spin" />
                    ) : (
                        <Plus size={12} />
                    )}
                    Add item
                </button>
            )}
        </div>
    );
}