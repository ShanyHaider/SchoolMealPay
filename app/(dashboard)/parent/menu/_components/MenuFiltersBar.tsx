"use client";

import { useRouter } from "next/navigation";
import { Calendar, Store, Repeat } from "lucide-react";
import { PortalSelect } from "@/components/PortalSelect";
import type { Canteen } from "./types";

interface MenuFiltersBarProps {
    canteens: Canteen[];
    selectedCanteenId: string;
    selectedDate: string;
    today: string;
    onScheduleRecurring: () => void;
}

export function MenuFiltersBar({
    canteens,
    selectedCanteenId,
    selectedDate,
    today,
    onScheduleRecurring,
}: MenuFiltersBarProps) {
    const router = useRouter();

    const maxDateStr = new Date(Date.now() + 7 * 86400000)
        .toISOString()
        .split("T")[0];

    const canteenOptions = canteens.map((c) => ({
        value: c.id,
        label: c.name,
        sublabel: c.location ?? undefined,
        icon: <Store size={14} />,
    }));

    return (
        <div className="flex flex-wrap items-center gap-4 p-4 bg-(--bg-card) border border-(--border-card) rounded-2xl shadow-sm">
            <div className="flex items-center gap-2 px-4 py-2 bg-(--bg-secondary) rounded-xl border border-(--border-card)">
                <Calendar size={16} className="text-(--text-muted)" />
                <input
                    type="date"
                    value={selectedDate}
                    min={today}
                    max={maxDateStr}
                    onChange={(e) =>
                        router.push(
                            `/parent/menu?date=${e.target.value}&canteen=${selectedCanteenId}`,
                        )
                    }
                    className="bg-transparent text-sm font-bold text-(--text-primary) outline-none cursor-pointer"
                />
            </div>

            {canteens.length > 1 && (
                <div className="w-56">
                    <PortalSelect
                        options={canteenOptions}
                        value={selectedCanteenId}
                        onChange={(val) => {
                            if (val) {
                                localStorage.setItem("preferred_canteen", val);
                                router.push(`/parent/menu?date=${selectedDate}&canteen=${val}`);
                            }
                        }}
                        triggerIcon={<Store size={14} />}
                        placeholder="Select canteen…"
                        compact
                    />
                </div>
            )}

            <button
                onClick={onScheduleRecurring}
                className="ml-auto flex items-center gap-2 px-3 py-2 bg-(--bg-secondary) border border-(--border-card) text-(--text-secondary) hover:text-(--text-primary) hover:border-(--border-primary) rounded-xl text-sm font-medium transition-colors shrink-0"
            >
                <Repeat size={14} />
                <span className="hidden sm:inline">Schedule recurring</span>
                <span className="sm:hidden">Recurring</span>
            </button>
        </div>
    );
}