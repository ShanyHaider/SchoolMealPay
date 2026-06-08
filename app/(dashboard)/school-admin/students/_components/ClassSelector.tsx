// components/ClassSelector.tsx
"use client";

import { School } from "lucide-react";
import { PortalSelect } from "@/components/PortalSelect";
import type { getAllClasses } from "@/db/queries/Admin";

type Class = Awaited<ReturnType<typeof getAllClasses>>[number];

interface ClassSelectorProps {
    classes: Class[];
    value?: string | null;
    onChange: (value?: string | null) => void;
    error?: string;
    label?: string;
    optional?: boolean;
}

export function ClassSelector({
    classes,
    value,
    onChange,
    error,
    label = "Class",
    optional = false,
}: ClassSelectorProps) {
    return (
        <PortalSelect
            label={label}
            hint={optional ? "(optional)" : undefined}
            value={value}
            onChange={onChange}
            error={error}
            placeholder="No class assigned"
            noneLabel="No class assigned"
            triggerIcon={<School size={13} />}
            options={classes.map((c) => ({
                value: c.id,
                label: `Grade ${c.grade}`,
                sublabel: `Section ${c.section}`,
            }))}
        />
    );
}