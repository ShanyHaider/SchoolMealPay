"use client";

import React from "react";

// ── Section wrapper ────────────────────────────────────────────────────────────

export function Section({
    icon,
    title,
    subtitle,
    badge,
    children,
}: {
    icon: React.ReactNode;
    title: string;
    subtitle?: string;
    badge?: number;
    children: React.ReactNode;
}) {
    return (
        <div
            className="rounded-2xl border p-5 flex flex-col gap-4"
            style={{
                background: "var(--bg-card)",
                borderColor: "var(--border-card)",
                boxShadow: "var(--shadow-card)",
            }}
        >
            <div className="flex items-start justify-between gap-2">
                <div className="flex items-start gap-2.5">
                    <span className="mt-0.5 text-(--text-muted)">{icon}</span>
                    <div>
                        <h2 className="text-sm font-bold text-(--text-primary)">{title}</h2>
                        {subtitle && (
                            <p className="text-xs text-(--text-secondary) mt-0.5">{subtitle}</p>
                        )}
                    </div>
                </div>
                {badge != null && badge > 0 && (
                    <span className="text-xs font-semibold px-2 py-0.5 rounded-full shrink-0 bg-red-500/10 text-red-500">
                        {badge}
                    </span>
                )}
            </div>
            {children}
        </div>
    );
}

// ── Form field wrapper ─────────────────────────────────────────────────────────

export function Field({
    label,
    icon,
    hint,
    error,
    children,
}: {
    label: string;
    icon?: React.ReactNode;
    hint?: string;
    error?: string;
    children: React.ReactNode;
}) {
    return (
        <div className="flex flex-col gap-1.5">
            <label className="flex items-center gap-1.5 text-xs font-semibold text-(--text-secondary) uppercase tracking-wider">
                {icon}
                {label}
            </label>
            {children}
            {error ? (
                <p className="text-xs text-red-500 font-medium">{error}</p>
            ) : hint ? (
                <p className="text-xs text-(--text-muted)">{hint}</p>
            ) : null}
        </div>
    );
}

// ── PKR prefix input wrapper ───────────────────────────────────────────────────

export function PrefixInput({ prefix, children }: { prefix: string; children: React.ReactNode }) {
    return (
        <div className="relative">
            <span className="absolute left-3 top-1/2 -translate-y-1/2 text-xs font-semibold text-(--text-muted) pointer-events-none tracking-wide">
                {prefix}
            </span>
            {children}
        </div>
    );
}

// ── Form footer (dirty indicator + action) ────────────────────────────────────

export function FormFooter({
    isDirty,
    customLeft,
    children,
}: {
    isDirty?: boolean;
    customLeft?: React.ReactNode;
    children: React.ReactNode;
}) {
    return (
        <div className="flex items-center justify-between pt-3 border-t border-(--border-card)">
            {customLeft ?? (
                isDirty
                    ? <p className="text-xs text-amber-500 font-medium">Unsaved changes</p>
                    : <span />
            )}
            {children}
        </div>
    );
}

// ── Stat pill ─────────────────────────────────────────────────────────────────

export function Stat({ label, value, color }: { label: string; value: number; color?: string }) {
    return (
        <div className="flex flex-col items-center gap-0.5">
            <span className="text-lg font-bold leading-none" style={{ color: color ?? "var(--text-primary)" }}>
                {value}
            </span>
            <span className="text-[10px] text-(--text-muted) font-medium uppercase tracking-wide">
                {label}
            </span>
        </div>
    );
}

// ── Spinner ───────────────────────────────────────────────────────────────────

export function Spinner() {
    return (
        <span className="w-3.5 h-3.5 border-2 border-current/30 border-t-current rounded-full animate-spin" />
    );
}

// ── Input class helper ────────────────────────────────────────────────────────

export function inputCls(hasError: boolean) {
    return `w-full px-3 py-2 rounded-lg border text-sm outline-none transition-colors bg-(--bg-secondary) text-(--text-primary) placeholder:text-(--text-muted) ${hasError
        ? "border-red-500/60 focus:border-red-500"
        : "border-(--border-input) focus:border-(--border-input-focus)"
        }`;
}