"use client";

// app/(dashboard)/system-admin/_components/UserLedgerTable.tsx

import { useTransition } from "react";
import { UserCheck, UserMinus, KeyRound } from "lucide-react";
import {
    toggleUserStatus,
    triggerClerkReverification,
} from "@/db/actions/SuperAdmin";

export type UserRow = {
    id: string;
    name: string;
    email: string;
    role: string;
    isActive: boolean;
    createdAt: Date;
};

const ROLE_STYLES: Record<string, { bg: string; color: string }> = {
    system_admin: { bg: "rgba(239,68,68,0.1)", color: "#ef4444" },
    school_admin: { bg: "rgba(59,130,246,0.1)", color: "#3b82f6" },
    canteen_staff: { bg: "rgba(245,158,11,0.1)", color: "#f59e0b" },
    parent: { bg: "rgba(139,92,246,0.1)", color: "#8b5cf6" },
};

interface UserLedgerTableProps {
    users: UserRow[];
    currentAdminUserId: string;
    onMessage: (text: string, type: "success" | "error") => void;
}

export function UserLedgerTable({
    users,
    currentAdminUserId,
    onMessage,
}: UserLedgerTableProps) {
    const [isPending, startTransition] = useTransition();

    const handleToggleActive = (userId: string, currentActive: boolean) => {
        startTransition(async () => {
            try {
                await toggleUserStatus(userId, !currentActive, currentAdminUserId);
                onMessage("User account status updated successfully.", "success");
            } catch (err) {
                const msg = err instanceof Error ? err.message : "Failed to change user status.";
                onMessage(msg, "error");
            }
        });
    };

    const handleReverify = (userId: string) => {
        startTransition(async () => {
            try {
                await triggerClerkReverification(userId, currentAdminUserId);
                onMessage(
                    "User session revoked. Reverification triggered in Clerk.",
                    "success",
                );
            } catch (err) {
                const msg = err instanceof Error ? err.message : "Failed to trigger reverification.";
                onMessage(msg, "error");
            }
        });
    };

    return (
        <div
            className="rounded-2xl border overflow-hidden shadow-sm"
            style={{
                background: "var(--bg-card)",
                borderColor: "var(--border-card)",
            }}
        >
            {/* Header */}
            <div className="p-5 border-b border-(--border-primary) flex items-center justify-between">
                <div>
                    <h3 className="text-sm font-bold text-(--text-primary) uppercase tracking-widest">
                        Global User Ledger
                    </h3>
                    <p className="text-[10px] text-(--text-secondary) mt-0.5">
                        Manage accounts, block logins, and trigger Clerk session resets.
                    </p>
                </div>
                <span className="px-2.5 py-1 rounded-md text-[10px] font-bold bg-(--bg-secondary) text-(--text-secondary) border border-(--border-card)">
                    {users.length} registered
                </span>
            </div>

            {/* Table */}
            <div className="overflow-x-auto">
                <table className="w-full text-left text-xs border-collapse">
                    <thead>
                        <tr className="bg-(--bg-secondary) border-b border-(--border-primary) text-(--text-secondary) uppercase tracking-wider font-bold">
                            <th className="p-4">Name / Email</th>
                            <th className="p-4">Role</th>
                            <th className="p-4">Status</th>
                            <th className="p-4">Joined</th>
                            <th className="p-4 text-right">Actions</th>
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-(--border-primary) font-medium text-(--text-secondary)">
                        {users.map((u) => {
                            const roleStyle = ROLE_STYLES[u.role] ?? ROLE_STYLES.parent;
                            const isSelf = u.id === currentAdminUserId;

                            return (
                                <tr
                                    key={u.id}
                                    className="hover:bg-black/5 dark:hover:bg-white/5 transition-colors"
                                >
                                    {/* Name / Email */}
                                    <td className="p-4">
                                        <p className="font-bold text-(--text-primary)">{u.name}</p>
                                        <p className="text-[10px] text-(--text-muted) font-mono">
                                            {u.email}
                                        </p>
                                    </td>

                                    {/* Role badge */}
                                    <td className="p-4">
                                        <span
                                            className="px-2 py-0.5 rounded text-[10px] font-semibold uppercase tracking-wider border"
                                            style={{
                                                background: roleStyle.bg,
                                                color: roleStyle.color,
                                                borderColor: `${roleStyle.color}33`,
                                            }}
                                        >
                                            {u.role.replace(/_/g, " ")}
                                        </span>
                                    </td>

                                    {/* Active / Blocked badge */}
                                    <td className="p-4">
                                        <span
                                            className={`px-2 py-0.5 rounded text-[10px] font-bold uppercase border ${u.isActive
                                                    ? "bg-green-500/10 text-green-600 border-green-500/20"
                                                    : "bg-red-500/10 text-red-600 border-red-500/20"
                                                }`}
                                        >
                                            {u.isActive ? "Active" : "Blocked"}
                                        </span>
                                    </td>

                                    {/* Joined date */}
                                    <td className="p-4 text-(--text-muted) whitespace-nowrap">
                                        {new Date(u.createdAt).toLocaleDateString("en-US", {
                                            month: "short",
                                            day: "numeric",
                                            year: "numeric",
                                        })}
                                    </td>

                                    {/* Actions */}
                                    <td className="p-4 text-right space-x-1.5 whitespace-nowrap">
                                        <button
                                            onClick={() => handleToggleActive(u.id, u.isActive)}
                                            disabled={isPending || isSelf}
                                            title={
                                                isSelf
                                                    ? "Cannot modify your own account"
                                                    : u.isActive
                                                        ? "Block Account"
                                                        : "Re-activate Account"
                                            }
                                            className={`p-1.5 rounded-lg border transition-all disabled:opacity-40 ${u.isActive
                                                    ? "bg-red-500/10 text-red-600 hover:bg-red-500/20 border-red-500/20"
                                                    : "bg-green-500/10 text-green-600 hover:bg-green-500/20 border-green-500/20"
                                                }`}
                                        >
                                            {u.isActive ? (
                                                <UserMinus size={13} />
                                            ) : (
                                                <UserCheck size={13} />
                                            )}
                                        </button>

                                        <button
                                            onClick={() => handleReverify(u.id)}
                                            disabled={isPending || isSelf}
                                            title={
                                                isSelf
                                                    ? "Cannot reverify your own account"
                                                    : "Force Clerk Reverification"
                                            }
                                            className="p-1.5 rounded-lg border bg-(--bg-secondary) text-(--text-secondary) hover:text-(--text-primary) border-(--border-card) hover:border-(--border-primary) transition-all disabled:opacity-40"
                                        >
                                            <KeyRound size={13} />
                                        </button>
                                    </td>
                                </tr>
                            );
                        })}

                        {users.length === 0 && (
                            <tr>
                                <td
                                    colSpan={5}
                                    className="p-8 text-center text-(--text-muted) italic"
                                >
                                    No users registered.
                                </td>
                            </tr>
                        )}
                    </tbody>
                </table>
            </div>
        </div>
    );
}