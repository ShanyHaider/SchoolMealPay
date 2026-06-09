// app/(dashboard)/system-admin/_components/SystemAdminStatCard.tsx

import type { LucideIcon } from "lucide-react";

interface SystemAdminStatCardProps {
    label: string;
    value: string;
    desc: string;
    icon: LucideIcon;
    iconClassName: string;
}

export function SystemAdminStatCard({
    label,
    value,
    desc,
    icon: Icon,
    iconClassName,
}: SystemAdminStatCardProps) {
    return (
        <div
            className="rounded-2xl border p-5 flex items-start justify-between shadow-sm"
            style={{
                background: "var(--bg-card)",
                borderColor: "var(--border-card)",
            }}
        >
            <div className="space-y-1">
                <p className="text-xs font-bold text-(--text-secondary) uppercase tracking-wider">
                    {label}
                </p>
                <h3 className="text-2xl font-black text-(--text-primary)">{value}</h3>
                <p className="text-[10px] text-(--text-muted) font-medium">{desc}</p>
            </div>
            <div
                className={`p-2.5 rounded-xl bg-(--bg-secondary) border border-(--border-card) ${iconClassName}`}
            >
                <Icon size={18} />
            </div>
        </div>
    );
}