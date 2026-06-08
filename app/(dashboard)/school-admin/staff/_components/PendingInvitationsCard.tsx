// components/staff/PendingInvitationsCard.tsx
"use client";

import { useState, useTransition } from "react";
import { createPortal } from "react-dom";
import { Mail, MapPin, Clock, X } from "lucide-react";
import { cancelStaffInvitation } from "@/db/actions/admin/Staff";
import { ConfirmModal } from "@/components/ConfirmModal";

type PendingInvitation = {
    id: string;
    name: string;
    email: string;
    status: "pending" | "accepted" | "expired";
    canteen?: { id: string; name: string } | null;
};

export function PendingInvitationsCard({
    invitations,
}: {
    invitations: PendingInvitation[];
}) {
    const [cancelling, setCancelling] = useState<PendingInvitation | null>(null);
    const [isCancelPending, startCancelTransition] = useTransition();

    if (invitations.length === 0) return null;

    const confirmCancel = () => {
        if (!cancelling) return;
        startCancelTransition(async () => {
            await cancelStaffInvitation(cancelling.id);
            setCancelling(null);
        });
    };

    return (
        <>
            <div
                className="rounded-xl border overflow-hidden"
                style={{
                    background: "var(--bg-card)",
                    borderColor: "var(--border-card)",
                    boxShadow: "var(--shadow-card)",
                }}
            >
                {/* Header */}
                <div
                    className="px-4 sm:px-5 py-3 border-b flex items-center gap-2"
                    style={{ borderColor: "var(--border-primary)" }}
                >
                    <div
                        className="flex items-center justify-center w-5 h-5 rounded-full text-xs font-bold flex-shrink-0"
                        style={{ background: "rgba(251,191,36,0.15)", color: "#f59e0b" }}
                    >
                        {invitations.length}
                    </div>
                    <p className="text-xs font-semibold" style={{ color: "var(--text-secondary)" }}>
                        Pending Invitations
                    </p>
                    <p className="text-xs ml-auto hidden sm:block" style={{ color: "var(--text-muted)" }}>
                        Awaiting account creation
                    </p>
                </div>

                {/* Rows */}
                <div>
                    {invitations.map((inv, i) => (
                        <div
                            key={inv.id}
                            className="px-4 sm:px-5 py-3.5 transition-colors hover:bg-[var(--bg-secondary)]"
                            style={{
                                borderBottom:
                                    i < invitations.length - 1 ? "1px solid var(--border-primary)" : undefined,
                            }}
                        >
                            {/* Main row: avatar | name+email | canteen | status | cancel */}
                            <div className="flex items-center gap-3 sm:gap-4">
                                {/* Avatar */}
                                <div
                                    className="w-8 h-8 rounded-full flex items-center justify-center flex-shrink-0 text-sm font-bold"
                                    style={{
                                        background: "rgba(251,191,36,0.10)",
                                        color: "#f59e0b",
                                        border: "1px solid rgba(251,191,36,0.2)",
                                    }}
                                >
                                    {inv.name[0]?.toUpperCase()}
                                </div>

                                {/* Name + email */}
                                <div className="flex-1 min-w-0">
                                    <p className="text-sm font-medium truncate" style={{ color: "var(--text-primary)" }}>
                                        {inv.name}
                                    </p>
                                    <p className="text-xs flex items-center gap-1 mt-0.5 truncate" style={{ color: "var(--text-muted)" }}>
                                        <Mail size={10} className="shrink-0" />
                                        {inv.email}
                                    </p>
                                </div>

                                {/* Canteen chip — sm+ only */}
                                <div className="hidden sm:block flex-shrink-0">
                                    {inv.canteen ? (
                                        <div
                                            className="flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-xs"
                                            style={{
                                                background: "var(--bg-tertiary)",
                                                border: "1px solid var(--border-input)",
                                                color: "var(--text-secondary)",
                                            }}
                                        >
                                            <MapPin size={10} style={{ color: "var(--text-muted)" }} />
                                            {inv.canteen.name}
                                        </div>
                                    ) : (
                                        <div
                                            className="flex items-center gap-1 px-2.5 py-1 rounded-lg text-xs"
                                            style={{
                                                background: "var(--bg-tertiary)",
                                                border: "1px dashed var(--border-input)",
                                                color: "var(--text-muted)",
                                            }}
                                        >
                                            No canteen
                                        </div>
                                    )}
                                </div>

                                {/* Status pill — sm+ only */}
                                <span
                                    className="hidden sm:flex items-center gap-1 text-xs px-2.5 py-1 rounded-full font-medium flex-shrink-0"
                                    style={{ background: "rgba(251,191,36,0.10)", color: "#f59e0b" }}
                                >
                                    <Clock size={10} />
                                    Awaiting signup
                                </span>

                                {/* Cancel button */}
                                <button
                                    onClick={() => setCancelling(inv)}
                                    disabled={isCancelPending}
                                    title="Cancel invitation"
                                    className="flex items-center justify-center w-7 h-7 rounded-lg transition-colors hover:bg-red-500/10 disabled:opacity-40 flex-shrink-0"
                                    style={{ border: "1px solid var(--border-input)", color: "var(--text-muted)" }}
                                >
                                    <X size={13} />
                                </button>
                            </div>

                            {/* Mobile-only chips below */}
                            <div className="flex items-center gap-2 mt-2 ml-11 sm:hidden flex-wrap">
                                {inv.canteen ? (
                                    <div
                                        className="flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-xs"
                                        style={{
                                            background: "var(--bg-tertiary)",
                                            border: "1px solid var(--border-input)",
                                            color: "var(--text-secondary)",
                                        }}
                                    >
                                        <MapPin size={10} style={{ color: "var(--text-muted)" }} />
                                        {inv.canteen.name}
                                    </div>
                                ) : (
                                    <div
                                        className="flex items-center gap-1 px-2.5 py-1 rounded-lg text-xs"
                                        style={{
                                            background: "var(--bg-tertiary)",
                                            border: "1px dashed var(--border-input)",
                                            color: "var(--text-muted)",
                                        }}
                                    >
                                        No canteen
                                    </div>
                                )}
                                <span
                                    className="flex items-center gap-1 text-xs px-2.5 py-1 rounded-full font-medium"
                                    style={{ background: "rgba(251,191,36,0.10)", color: "#f59e0b" }}
                                >
                                    <Clock size={10} />
                                    Awaiting signup
                                </span>
                            </div>
                        </div>
                    ))}
                </div>
            </div>

            {cancelling &&
                createPortal(
                    <ConfirmModal
                        title="Cancel invitation"
                        description={`Cancel the invitation sent to ${cancelling.email}? They won't be able to use the invite link to sign up.`}
                        confirmLabel="Cancel Invitation"
                        variant="warning"
                        isPending={isCancelPending}
                        onClose={() => setCancelling(null)}
                        onConfirm={confirmCancel}
                    />,
                    document.body,
                )}
        </>
    );
}