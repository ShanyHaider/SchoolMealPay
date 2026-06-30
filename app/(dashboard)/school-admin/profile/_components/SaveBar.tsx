"use client";

import { Save, CheckCircle, AlertCircle } from "lucide-react";

function isLight(hex: string) {
    const r = parseInt(hex.slice(1, 3), 16), g = parseInt(hex.slice(3, 5), 16), b = parseInt(hex.slice(5, 7), 16);
    return (r * 299 + g * 587 + b * 114) / 1000 > 128;
}

interface Props {
    isPending: boolean;
    saved: boolean;
    error: string;
    isNew: boolean;
    isDirty: boolean;
    accentColor: string;
    onSave: () => void;
}

export function SaveBar({ isPending, saved, error, isNew, isDirty, accentColor, onSave }: Props) {
    return (
        <div className="sticky bottom-4 flex items-center justify-between gap-4 px-5 py-3.5 rounded-2xl border shadow-lg"
            style={{ background: "var(--bg-card)", borderColor: "var(--border-card)" }}>
            <div className="flex items-center gap-2">
                {error && <>
                    <AlertCircle size={14} style={{ color: "#ef4444" }} />
                    <p className="text-xs font-medium" style={{ color: "#ef4444" }}>{error}</p>
                </>}
                {saved && <>
                    <CheckCircle size={14} style={{ color: "#22c55e" }} />
                    <p className="text-xs font-medium" style={{ color: "#22c55e" }}>Profile saved successfully</p>
                </>}
                {!error && !saved && (
                    <p className="text-xs" style={{ color: "var(--text-muted)" }}>
                        {isNew ? "Fill in your details and save to go live." : "Changes save immediately."}
                    </p>
                )}
            </div>
            <button onClick={onSave}
                disabled={isPending || !isDirty}
                className="flex items-center gap-2 px-5 py-2.5 rounded-xl text-sm font-bold disabled:opacity-50 transition-all hover:opacity-90 active:scale-95"
                style={{ background: accentColor, color: isLight(accentColor) ? "#000" : "#fff" }}>
                <Save size={14} />
                {isPending ? "Saving…" : "Save Profile"}
            </button>
        </div>
    );
}