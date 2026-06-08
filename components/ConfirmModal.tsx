// components/ConfirmModal.tsx
"use client";

import { Loader2, Trash2, UserX, UserCheck, AlertTriangle } from "lucide-react";

type ModalVariant = "danger" | "warning" | "success";

interface ConfirmModalProps {
    title: string;
    description: string;
    confirmLabel: string;
    variant?: ModalVariant;
    isPending: boolean;
    onClose: () => void;
    onConfirm: () => void;
}

const variantConfig: Record<ModalVariant, {
    iconBg: string;
    iconColor: string;
    btnClass: string;
    Icon: React.ElementType;
}> = {
    danger: {
        iconBg: "bg-red-500/10",
        iconColor: "text-red-500",
        btnClass: "bg-red-600 hover:bg-red-700 text-white",
        Icon: Trash2,
    },
    warning: {
        iconBg: "bg-amber-500/10",
        iconColor: "text-amber-500",
        btnClass: "bg-amber-500 hover:bg-amber-600 text-white",
        Icon: UserX,
    },
    success: {
        iconBg: "bg-emerald-500/10",
        iconColor: "text-emerald-500",
        btnClass: "bg-emerald-600 hover:bg-emerald-700 text-white",
        Icon: UserCheck,
    },
};

export function ConfirmModal({
    title,
    description,
    confirmLabel,
    variant = "danger",
    isPending,
    onClose,
    onConfirm,
}: ConfirmModalProps) {
    const { iconBg, iconColor, btnClass, Icon } = variantConfig[variant];

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            <div className="absolute inset-0 bg-black/60 backdrop-blur-xs" onClick={onClose} />
            <div
                className="relative z-10 w-full max-w-sm rounded-2xl border p-6 shadow-xl"
                style={{ background: "var(--bg-card)", borderColor: "var(--border-card)" }}
            >
                <div className={`flex h-10 w-10 items-center justify-center rounded-full mb-4 ${iconBg} ${iconColor}`}>
                    <Icon size={18} />
                </div>

                <h3 className="text-base font-semibold mb-1" style={{ color: "var(--text-primary)" }}>
                    {title}
                </h3>
                <p className="text-sm mb-5" style={{ color: "var(--text-secondary)" }}>
                    {description}
                </p>

                <div className="flex gap-2">
                    <button
                        type="button"
                        onClick={onClose}
                        disabled={isPending}
                        className="flex-1 rounded-lg border py-2 text-sm font-medium disabled:opacity-50"
                        style={{
                            borderColor: "var(--border-input)",
                            background: "var(--bg-tertiary)",
                            color: "var(--text-secondary)",
                        }}
                    >
                        Cancel
                    </button>
                    <button
                        type="button"
                        onClick={onConfirm}
                        disabled={isPending}
                        className={`flex flex-1 items-center justify-center gap-2 rounded-lg py-2 text-sm font-medium disabled:opacity-50 ${btnClass}`}
                    >
                        {isPending && <Loader2 size={14} className="animate-spin" />}
                        {confirmLabel}
                    </button>
                </div>
            </div>
        </div>
    );
}