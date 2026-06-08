// components/staff/StaffStatusBadge.tsx

import { CheckCircle2, Ban } from "lucide-react";

export type StaffStatus = "active" | "disabled";

export function StaffStatusBadge({ status }: { status: StaffStatus }) {
    if (status === "disabled") {
        return (
            <span
                className="inline-flex items-center gap-1 text-xs px-2 py-0.5 rounded-full font-medium"
                style={{ background: "rgba(239,68,68,0.08)", color: "#ef4444", border: "1px solid rgba(239,68,68,0.15)" }}
            >
                <Ban size={10} />
                Disabled
            </span>
        );
    }

    return (
        <span
            className="inline-flex items-center gap-1 text-xs px-2 py-0.5 rounded-full font-medium"
            style={{ background: "rgba(52,211,153,0.08)", color: "#34d399", border: "1px solid rgba(52,211,153,0.15)" }}
        >
            <CheckCircle2 size={10} />
            Active
        </span>
    );
}