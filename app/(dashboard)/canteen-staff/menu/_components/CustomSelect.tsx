// components/CustomSelect.tsx  — drop-in replacement, same props as before
"use client";

import { PortalSelect, type SelectOption } from "@/components/PortalSelect";

export type { SelectOption as DropdownOption };

export interface CustomSelectProps {
    options: SelectOption[];
    value: string;
    onChange: (value: string) => void;
    disabled?: boolean;
    placeholder?: string;
    compact?: boolean;
}

export function CustomSelect({
    options,
    value,
    onChange,
    disabled,
    placeholder,
    compact,
}: CustomSelectProps) {
    return (
        <PortalSelect
            options={options}
            value={value}
            // CustomSelect never passes undefined — map back to empty string
            onChange={(v) => onChange(v ?? "")}
            disabled={disabled}
            placeholder={placeholder}
            compact={compact}
        />
    );
}