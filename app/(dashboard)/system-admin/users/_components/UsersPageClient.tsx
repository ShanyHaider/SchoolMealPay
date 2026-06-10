"use client";

// app/(dashboard)/system-admin/users/_components/UsersPageClient.tsx

import { useState, useTransition, useCallback } from "react";
import { useRouter, usePathname, useSearchParams } from "next/navigation";
import {
    Search,
    UserCheck,
    UserMinus,
    KeyRound,
    ChevronLeft,
    ChevronRight,
    Users,
    CheckCircle,
    XCircle,
    Shield,
    UtensilsCrossed,
    UserCircle,
    ShieldAlert,
} from "lucide-react";
import { useTransition as useOptimisticTransition } from "react";

import {
    toggleUserStatus,
    triggerClerkReverification,
} from "@/db/actions/SuperAdmin";
import type { PaginatedUsers, UserFilters } from "@/db/queries/SystemAdminUsers";
import { PortalSelect } from "@/components/PortalSelect";
import type { SelectOption } from "@/components/PortalSelect";

// ─── Types ─────────────────────────────────────────────────────────────────

interface UsersPageClientProps {
    initialData: PaginatedUsers;
    initialFilters: {
        search: string;
        role: UserFilters["role"];
        status: UserFilters["status"];
        page: number;
    };
    currentAdminUserId: string;
}

// ─── Badge primitives ───────────────────────────────────────────────────────

function RoleBadge({
    label,
    bg,
    color,
    icon,
}: {
    label: string;
    bg: string;
    color: string;
    icon: React.ReactNode;
}) {
    return (
        <span
            className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded-full text-[11px] font-medium"
            style={{ background: bg, color }}
        >
            {icon}
            {label}
        </span>
    );
}

function StatusBadge({
    label,
    bg,
    color,
    dot,
}: {
    label: string;
    bg: string;
    color: string;
    dot: string;
}) {
    return (
        <span
            className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded-full text-[11px] font-medium"
            style={{ background: bg, color }}
        >
            <span
                className="w-1.5 h-1.5 rounded-full shrink-0"
                style={{ background: dot }}
            />
            {label}
        </span>
    );
}

// ─── PortalSelect option arrays ─────────────────────────────────────────────

const ROLE_OPTIONS: SelectOption[] = [
    {
        value: "all",
        label: "All roles",
        icon: (
            <RoleBadge
                label="All roles"
                bg="rgba(113,113,122,0.1)"
                color="#71717a"
                icon={<Users size={11} />}
            />
        ),
    },
    {
        value: "system_admin",
        label: "System admin",
        icon: (
            <RoleBadge
                label="System admin"
                bg="rgba(239,68,68,0.1)"
                color="#dc2626"
                icon={<ShieldAlert size={11} />}
            />
        ),
    },
    {
        value: "school_admin",
        label: "School admin",
        icon: (
            <RoleBadge
                label="School admin"
                bg="rgba(59,130,246,0.1)"
                color="#2563eb"
                icon={<Shield size={11} />}
            />
        ),
    },
    {
        value: "canteen_staff",
        label: "Canteen staff",
        icon: (
            <RoleBadge
                label="Canteen staff"
                bg="rgba(245,158,11,0.1)"
                color="#d97706"
                icon={<UtensilsCrossed size={11} />}
            />
        ),
    },
    {
        value: "parent",
        label: "Parent",
        icon: (
            <RoleBadge
                label="Parent"
                bg="rgba(139,92,246,0.1)"
                color="#7c3aed"
                icon={<UserCircle size={11} />}
            />
        ),
    },
];

const STATUS_OPTIONS: SelectOption[] = [
    {
        value: "all",
        label: "All statuses",
        icon: (
            <StatusBadge
                label="All statuses"
                bg="rgba(113,113,122,0.1)"
                color="#71717a"
                dot="#71717a"
            />
        ),
    },
    {
        value: "active",
        label: "Active",
        icon: (
            <StatusBadge
                label="Active"
                bg="rgba(34,197,94,0.1)"
                color="#16a34a"
                dot="#22c55e"
            />
        ),
    },
    {
        value: "blocked",
        label: "Blocked",
        icon: (
            <StatusBadge
                label="Blocked"
                bg="rgba(239,68,68,0.1)"
                color="#dc2626"
                dot="#ef4444"
            />
        ),
    },
];

// ─── Table role / status styles (unchanged) ─────────────────────────────────

const ROLE_STYLES: Record<string, { bg: string; color: string }> = {
    system_admin: { bg: "rgba(239,68,68,0.1)", color: "#ef4444" },
    school_admin: { bg: "rgba(59,130,246,0.1)", color: "#3b82f6" },
    canteen_staff: { bg: "rgba(245,158,11,0.1)", color: "#f59e0b" },
    parent: { bg: "rgba(139,92,246,0.1)", color: "#8b5cf6" },
};

// ─── Toast banner ───────────────────────────────────────────────────────────

function ToastBanner({
    message,
}: {
    message: { type: "success" | "error"; text: string } | null;
}) {
    if (!message) return null;
    const isSuccess = message.type === "success";
    return (
        <div
            className="flex items-center gap-3 p-4 rounded-xl border animate-in fade-in-0 duration-300"
            style={{
                background: isSuccess ? "rgba(34,197,94,0.08)" : "rgba(239,68,68,0.08)",
                borderColor: isSuccess ? "rgba(34,197,94,0.2)" : "rgba(239,68,68,0.2)",
                color: isSuccess ? "#22c55e" : "#ef4444",
            }}
        >
            {isSuccess ? <CheckCircle size={16} /> : <XCircle size={16} />}
            <span className="text-sm font-medium">{message.text}</span>
        </div>
    );
}

// ─── Component ──────────────────────────────────────────────────────────────

export function UsersPageClient({
    initialData,
    initialFilters,
    currentAdminUserId,
}: UsersPageClientProps) {
    const router = useRouter();
    const pathname = usePathname();
    const searchParams = useSearchParams();

    const [message, setMessage] = useState<{
        type: "success" | "error";
        text: string;
    } | null>(null);
    const [actionPending, startActionTransition] = useTransition();
    const [filterPending, startFilterTransition] = useOptimisticTransition();

    const [search, setSearch] = useState(initialFilters.search);
    const [role, setRole] = useState<UserFilters["role"]>(initialFilters.role);
    const [status, setStatus] = useState<UserFilters["status"]>(initialFilters.status);

    const showMessage = (text: string, type: "success" | "error") => {
        setMessage({ type, text });
        setTimeout(() => setMessage(null), 5000);
    };

    const pushFilters = useCallback(
        (
            overrides: Partial<{
                search: string;
                role: UserFilters["role"];
                status: UserFilters["status"];
                page: number;
            }>,
        ) => {
            const params = new URLSearchParams(searchParams.toString());

            const next = {
                search: overrides.search ?? search,
                role: overrides.role ?? role,
                status: overrides.status ?? status,
                page: overrides.page ?? 1,
            };

            if (next.search) params.set("search", next.search);
            else params.delete("search");

            if (next.role && next.role !== "all") params.set("role", next.role);
            else params.delete("role");

            if (next.status && next.status !== "all") params.set("status", next.status);
            else params.delete("status");

            if (next.page > 1) params.set("page", String(next.page));
            else params.delete("page");

            startFilterTransition(() => {
                router.push(`${pathname}?${params.toString()}`);
            });
        },
        [search, role, status, pathname, router, searchParams],
    );

    const handleSearchSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        pushFilters({ search });
    };

    const handleRoleChange = (val: string | undefined) => {
        const v = (val ?? "all") as UserFilters["role"];
        setRole(v);
        pushFilters({ role: v });
    };

    const handleStatusChange = (val: string | undefined) => {
        const v = (val ?? "all") as UserFilters["status"];
        setStatus(v);
        pushFilters({ status: v });
    };

    const handlePageChange = (newPage: number) => {
        pushFilters({ page: newPage });
    };

    // ── Actions ────────────────────────────────────────────────────────────

    const handleToggleActive = (userId: string, currentActive: boolean) => {
        startActionTransition(async () => {
            try {
                await toggleUserStatus(userId, !currentActive, currentAdminUserId);
                showMessage(
                    currentActive ? "Account blocked." : "Account reactivated.",
                    "success",
                );
                router.refresh();
            } catch (err) {
                showMessage(
                    err instanceof Error ? err.message : "Failed to update status.",
                    "error",
                );
            }
        });
    };

    const handleReverify = (userId: string) => {
        startActionTransition(async () => {
            try {
                await triggerClerkReverification(userId, currentAdminUserId);
                showMessage("Session revoked — reverification triggered.", "success");
            } catch (err) {
                showMessage(
                    err instanceof Error ? err.message : "Failed to trigger reverification.",
                    "error",
                );
            }
        });
    };

    const { users, total, page, totalPages } = initialData;
    const isPending = actionPending || filterPending;

    return (
        <div className="space-y-5">
            {/* Page header */}
            <div>
                <h1
                    className="text-2xl font-bold tracking-tight"
                    style={{ color: "var(--text-primary)" }}
                >
                    User Ledger
                </h1>
                <p className="text-sm mt-1" style={{ color: "var(--text-secondary)" }}>
                    All registered accounts across the platform.
                </p>
            </div>

            <ToastBanner message={message} />

            {/* Filter toolbar */}
            <div
                className="rounded-2xl border p-4 shadow-sm"
                style={{
                    background: "var(--bg-card)",
                    borderColor: "var(--border-card)",
                }}
            >
                <div className="flex flex-col sm:flex-row gap-3 items-end">
                    {/* Search */}
                    <form onSubmit={handleSearchSubmit} className="flex-1 relative">
                        <Search
                            size={14}
                            className="absolute left-3 top-1/2 -translate-y-1/2 text-(--text-muted) pointer-events-none"
                        />
                        <input
                            type="text"
                            value={search}
                            onChange={(e) => setSearch(e.target.value)}
                            placeholder="Search name or email…"
                            className="w-full pl-8 pr-4 py-2 text-xs rounded-lg border border-(--border-input) bg-(--bg-secondary) text-(--text-primary) placeholder:text-(--text-muted) outline-none focus:ring-1 focus:ring-(--accent) transition-all"
                        />
                    </form>

                    {/* Role filter */}
                    <div className="w-full sm:w-48">
                        <PortalSelect
                            options={ROLE_OPTIONS}
                            value={role === "all" ? null : role}
                            onChange={handleRoleChange}
                            placeholder="All roles"
                            disabled={isPending}
                            compact
                        />
                    </div>

                    {/* Status filter */}
                    <div className="w-full sm:w-40">
                        <PortalSelect
                            options={STATUS_OPTIONS}
                            value={status === "all" ? null : status}
                            onChange={handleStatusChange}
                            placeholder="All statuses"
                            disabled={isPending}
                            compact
                        />
                    </div>
                </div>
            </div>

            {/* Table */}
            <div
                className="rounded-2xl border overflow-hidden shadow-sm"
                style={{
                    background: "var(--bg-card)",
                    borderColor: "var(--border-card)",
                    opacity: isPending ? 0.6 : 1,
                    transition: "opacity 150ms ease",
                }}
            >
                {/* Header */}
                <div className="p-5 border-b border-(--border-primary) flex items-center justify-between">
                    <div className="flex items-center gap-2">
                        <Users size={15} className="text-(--text-muted)" />
                        <div>
                            <h3 className="text-sm font-bold text-(--text-primary) uppercase tracking-widest">
                                All Users
                            </h3>
                            <p className="text-[10px] text-(--text-secondary) mt-0.5">
                                Manage accounts, block logins, and force session resets.
                            </p>
                        </div>
                    </div>
                    <span className="px-2.5 py-1 rounded-md text-[10px] font-bold bg-(--bg-secondary) text-(--text-secondary) border border-(--border-card)">
                        {total.toLocaleString()} registered
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
                                <th className="p-4">Phone</th>
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
                                            <div className="flex items-center gap-2.5">
                                                <div
                                                    className="w-7 h-7 rounded-lg flex items-center justify-center text-[10px] font-black shrink-0"
                                                    style={{
                                                        background: roleStyle.bg,
                                                        color: roleStyle.color,
                                                    }}
                                                >
                                                    {u.name
                                                        .split(" ")
                                                        .map((n) => n[0])
                                                        .join("")
                                                        .toUpperCase()
                                                        .slice(0, 2)}
                                                </div>
                                                <div>
                                                    <p className="font-bold text-(--text-primary) flex items-center gap-1.5">
                                                        {u.name}
                                                        {isSelf && (
                                                            <span className="text-[9px] font-bold px-1.5 py-0.5 rounded bg-(--bg-secondary) border border-(--border-card) text-(--text-muted) uppercase tracking-wider">
                                                                You
                                                            </span>
                                                        )}
                                                    </p>
                                                    <p className="text-[10px] text-(--text-muted) font-mono">
                                                        {u.email}
                                                    </p>
                                                </div>
                                            </div>
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

                                        {/* Status */}
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

                                        {/* Phone */}
                                        <td className="p-4 font-mono text-[10px] text-(--text-muted)">
                                            {u.phone ?? "—"}
                                        </td>

                                        {/* Joined */}
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
                                                disabled={actionPending || isSelf}
                                                title={
                                                    isSelf
                                                        ? "Cannot modify your own account"
                                                        : u.isActive
                                                            ? "Block account"
                                                            : "Reactivate account"
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
                                                disabled={actionPending || isSelf}
                                                title={
                                                    isSelf
                                                        ? "Cannot reverify your own account"
                                                        : "Force Clerk reverification"
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
                                        colSpan={6}
                                        className="p-12 text-center text-(--text-muted) italic"
                                    >
                                        No users match the current filters.
                                    </td>
                                </tr>
                            )}
                        </tbody>
                    </table>
                </div>

                {/* Pagination */}
                {totalPages > 1 && (
                    <div className="p-4 border-t border-(--border-primary) flex items-center justify-between">
                        <p className="text-[11px] text-(--text-muted) font-medium">
                            Page {page} of {totalPages} —{" "}
                            <span className="text-(--text-secondary)">{total.toLocaleString()} total</span>
                        </p>

                        <div className="flex items-center gap-1.5">
                            <button
                                onClick={() => handlePageChange(page - 1)}
                                disabled={page <= 1 || isPending}
                                className="p-1.5 rounded-lg border border-(--border-card) bg-(--bg-secondary) text-(--text-secondary) hover:text-(--text-primary) hover:border-(--border-primary) disabled:opacity-40 transition-all"
                            >
                                <ChevronLeft size={14} />
                            </button>

                            {Array.from({ length: Math.min(totalPages, 7) }, (_, i) => {
                                let pageNum: number;
                                if (totalPages <= 7) {
                                    pageNum = i + 1;
                                } else if (page <= 4) {
                                    pageNum = i + 1;
                                } else if (page >= totalPages - 3) {
                                    pageNum = totalPages - 6 + i;
                                } else {
                                    pageNum = page - 3 + i;
                                }

                                return (
                                    <button
                                        key={pageNum}
                                        onClick={() => handlePageChange(pageNum)}
                                        disabled={isPending}
                                        className={`min-w-[28px] h-7 px-1.5 rounded-lg text-[11px] font-bold border transition-all disabled:opacity-60 ${pageNum === page
                                                ? "bg-black text-white border-black dark:bg-white dark:text-black dark:border-white"
                                                : "bg-(--bg-secondary) text-(--text-secondary) border-(--border-card) hover:border-(--border-primary) hover:text-(--text-primary)"
                                            }`}
                                    >
                                        {pageNum}
                                    </button>
                                );
                            })}

                            <button
                                onClick={() => handlePageChange(page + 1)}
                                disabled={page >= totalPages || isPending}
                                className="p-1.5 rounded-lg border border-(--border-card) bg-(--bg-secondary) text-(--text-secondary) hover:text-(--text-primary) hover:border-(--border-primary) disabled:opacity-40 transition-all"
                            >
                                <ChevronRight size={14} />
                            </button>
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
}