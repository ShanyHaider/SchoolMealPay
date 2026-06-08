"use client";

import { CheckCircle } from "lucide-react";
import type { FormValues } from "./ProfileForms";

function isValidHex(v: string) { return /^#[0-9A-Fa-f]{6}$/.test(v); }

interface Props { form: FormValues; accentColor: string; }

export function CompletionPanel({ form, accentColor }: Props) {
    const items = [
        { label: "School name", done: !!form.name.trim() },
        { label: "Logo", done: !!form.logoUrl },
        { label: "Contact email", done: !!form.email.trim() },
        { label: "Contact phone", done: !!form.phone.trim() },
        { label: "City / address", done: !!(form.city.trim() || form.address.trim()) },
        { label: "School type", done: !!form.schoolType },
        { label: "Academic year", done: !!form.academicYear.trim() },
        { label: "Brand colour", done: isValidHex(form.primaryColor) },
    ];
    const pct = Math.round((items.filter((i) => i.done).length / items.length) * 100);

    return (
        <div className="rounded-2xl border overflow-hidden"
            style={{ background: "var(--bg-card)", borderColor: "var(--border-card)" }}>
            <div className="px-5 py-4 border-b"
                style={{ borderColor: "var(--border-primary)", background: "var(--bg-secondary)" }}>
                <h2 className="text-sm font-bold" style={{ color: "var(--text-primary)" }}>Profile Completion</h2>
            </div>
            <div className="p-5 space-y-2.5">
                {items.map(({ label, done }) => (
                    <div key={label} className="flex items-center gap-2.5">
                        <div className="w-4 h-4 rounded-full shrink-0 flex items-center justify-center"
                            style={{
                                background: done ? "#22c55e18" : "var(--bg-tertiary)",
                                border: `1.5px solid ${done ? "#22c55e" : "var(--border-primary)"}`,
                            }}>
                            {done && <CheckCircle size={10} style={{ color: "#22c55e" }} />}
                        </div>
                        <span className="text-xs"
                            style={{ color: done ? "var(--text-primary)" : "var(--text-muted)" }}>
                            {label}
                        </span>
                    </div>
                ))}
                <div className="pt-2">
                    <div className="flex justify-between text-[10px] mb-1.5" style={{ color: "var(--text-muted)" }}>
                        <span>Profile complete</span>
                        <span className="font-bold"
                            style={{ color: pct === 100 ? "#22c55e" : "var(--text-secondary)" }}>
                            {pct}%
                        </span>
                    </div>
                    <div className="h-1.5 rounded-full overflow-hidden" style={{ background: "var(--bg-tertiary)" }}>
                        <div className="h-full rounded-full transition-all duration-500"
                            style={{ width: `${pct}%`, background: pct === 100 ? "#22c55e" : accentColor }} />
                    </div>
                </div>
            </div>
        </div>
    );
}