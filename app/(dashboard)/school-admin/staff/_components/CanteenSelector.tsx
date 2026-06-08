// components/staff/CanteenSelector.tsx
"use client";

import { UtensilsCrossed } from "lucide-react";
import { PortalSelect } from "@/components/PortalSelect";

type Canteen = { id: string; name: string };

interface CanteenSelectorProps {
    canteens: Canteen[];
    value?: string | null;
    onChange: (value?: string | null) => void;
    error?: string;
    label?: string;
    optional?: boolean;
    disabled?: boolean;
}

export function CanteenSelector({
    canteens,
    value,
    onChange,
    error,
    label = "Assign to Canteen",
    optional = false,
    disabled = false,
}: CanteenSelectorProps) {
    return (
        <PortalSelect
            label={label}
            hint={optional ? "(optional)" : undefined}
            value={value}
            onChange={onChange}
            error={error}
            placeholder="Assign later…"
            noneLabel="Assign later…"
            triggerIcon={<UtensilsCrossed size={13} />}
            disabled={disabled}
            options={canteens.map((c) => ({
                value: c.id,
                label: c.name,
                icon: <UtensilsCrossed size={11} />,
            }))}
        />
    );
}