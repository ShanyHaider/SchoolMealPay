"use client";

import { X } from "lucide-react";

// ─── Field ────────────────────────────────────────────────────────────────────

export function Field({
    label,
    required,
    error,
    children,
}: {
    label: string;
    required?: boolean;
    error?: string;
    children: React.ReactNode;
}) {
    return (
        <div className="flex flex-col gap-1.5">
            <label className="block text-xs font-medium" style={{ color: "var(--text-secondary)" }}>
                {label}
                {required && <span className="text-red-500 ml-0.5">*</span>}
            </label>
            {children}
            {error && <p className="text-xs" style={{ color: "#ef4444" }}>{error}</p>}
        </div>
    );
}

// ─── Modal ────────────────────────────────────────────────────────────────────

export function Modal({
    title,
    onClose,
    children,
}: {
    title: string;
    onClose: () => void;
    children: React.ReactNode;
}) {
    return (
        <div
            className="fixed inset-0 z-50 flex items-center justify-center p-4"
            style={{ background: "rgba(0,0,0,0.5)", backdropFilter: "blur(2px)" }}
        >
            <div
                className="w-full max-w-md rounded-2xl border shadow-xl"
                style={{
                    background: "var(--bg-card)",
                    borderColor: "var(--border-card)",
                    boxShadow: "var(--shadow-card)",
                }}
            >
                <div
                    className="flex items-center justify-between px-5 pt-5 pb-4 border-b"
                    style={{ borderColor: "var(--border-card)" }}
                >
                    <h3 className="text-base font-semibold" style={{ color: "var(--text-primary)" }}>
                        {title}
                    </h3>
                    <button
                        onClick={onClose}
                        className="w-7 h-7 flex items-center justify-center rounded-lg transition-colors hover:bg-[var(--bg-tertiary)]"
                    >
                        <X size={14} style={{ color: "var(--text-muted)" }} />
                    </button>
                </div>
                <div className="p-5">{children}</div>
            </div>
        </div>
    );
}