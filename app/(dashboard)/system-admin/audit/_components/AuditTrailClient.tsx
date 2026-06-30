"use client";

// app/(dashboard)/system-admin/_components/AuditTrailClient.tsx

import { useState, useTransition } from "react";
import { useRouter, usePathname } from "next/navigation";
import {
    FileSpreadsheet,
    ChevronLeft,
    ChevronRight,
    Filter,
    RotateCcw,
    Zap,
    Layers,
} from "lucide-react";
import type { PaginatedAuditLogs } from "@/db/queries/SystemAdminAudit";
import {
    AUDIT_ACTIONS,
    AUDIT_ENTITY_TYPES,
    ACTION_COLOURS,
    DEFAULT_ACTION_COLOUR
} from "@/constants/auditConstants";
import { PortalSelect } from "@/components/PortalSelect";
import type { SelectOption } from "@/components/PortalSelect";

// ─── Action badge colour map ──────────────────────────────────────────────────



function getActionColour(action: string) {
    return ACTION_COLOURS[action] ?? DEFAULT_ACTION_COLOUR;
}

// ─── Badge used as the `icon` prop inside PortalSelect options ────────────────

function ActionDot({ action }: { action: string }) {
    const { dot } = getActionColour(action);
    return (
        <span
            className="inline-block w-2 h-2 rounded-full shrink-0"
            style={{ background: dot }}
        />
    );
}

// ─── Build PortalSelect option arrays ────────────────────────────────────────

function buildActionOptions(): SelectOption[] {
    return AUDIT_ACTIONS.map((a) => ({
        value: a,
        label: a.replace(/_/g, " "),
        icon: <ActionDot action={a} />,
    }));
}

function buildEntityOptions(): SelectOption[] {
    return AUDIT_ENTITY_TYPES.map((t) => ({
        value: t,
        label: t.replace(/_/g, " "),
    }));
}

// ─── Diff renderer ────────────────────────────────────────────────────────────

function DiffCell({
    oldValues,
    newValues,
}: {
    oldValues: unknown;
    newValues: unknown;
}) {
    const [expanded, setExpanded] = useState(false);

    const old = oldValues as Record<string, unknown> | null | undefined;
    const next = newValues as Record<string, unknown> | null | undefined;

    const hasData =
        (old && Object.keys(old).length > 0) ||
        (next && Object.keys(next).length > 0);

    if (!hasData) {
        return <span className="text-(--text-muted) text-[10px] italic">—</span>;
    }

    return (
        <div>
            <button
                onClick={() => setExpanded((v) => !v)}
                className="text-[10px] font-bold text-(--text-secondary) hover:text-(--text-primary) transition-colors underline underline-offset-2"
            >
                {expanded ? "Hide diff" : "View diff"}
            </button>
            {expanded && (
                <div className="mt-1.5 space-y-0.5 font-mono text-[10px] leading-relaxed">
                    {old && Object.keys(old).length > 0 && (
                        <p className="text-red-500 truncate max-w-[200px]">
                            − {JSON.stringify(old)}
                        </p>
                    )}
                    {next && Object.keys(next).length > 0 && (
                        <p className="text-green-500 truncate max-w-[200px]">
                            + {JSON.stringify(next)}
                        </p>
                    )}
                </div>
            )}
        </div>
    );
}

// ─── Filter bar ───────────────────────────────────────────────────────────────

const ACTION_OPTIONS = buildActionOptions();
const ENTITY_OPTIONS = buildEntityOptions();

function FilterBar({
    action,
    entityType,
    onFilter,
    onReset,
    isPending,
}: {
    action: string;
    entityType: string;
    onFilter: (action: string, entityType: string) => void;
    onReset: () => void;
    isPending: boolean;
}) {
    const [localAction, setLocalAction] = useState(action);
    const [localEntityType, setLocalEntityType] = useState(entityType);

    const hasFilter = !!action || !!entityType;

    return (
        <div
            className="rounded-2xl border p-4 shadow-sm flex flex-wrap gap-3 items-end"
            style={{
                background: "var(--bg-card)",
                borderColor: "var(--border-card)",
            }}
        >
            {/* Action filter */}
            <div className="flex-1 min-w-[200px]">
                <PortalSelect
                    label="Action"
                    options={ACTION_OPTIONS}
                    value={localAction || null}
                    onChange={(v) => setLocalAction(v ?? "")}
                    placeholder="All actions"
                    noneLabel="All actions"
                    triggerIcon={<Zap size={13} />}
                    disabled={isPending}
                    compact
                />
            </div>

            {/* Entity type filter */}
            <div className="flex-1 min-w-[180px]">
                <PortalSelect
                    label="Entity Type"
                    options={ENTITY_OPTIONS}
                    value={localEntityType || null}
                    onChange={(v) => setLocalEntityType(v ?? "")}
                    placeholder="All entities"
                    noneLabel="All entities"
                    triggerIcon={<Layers size={13} />}
                    disabled={isPending}
                    compact
                />
            </div>

            {/* Apply */}
            <button
                onClick={() => onFilter(localAction, localEntityType)}
                disabled={isPending}
                className="flex items-center gap-1.5 px-4 py-2 rounded-lg bg-black text-white dark:bg-white dark:text-black text-xs font-bold hover:opacity-90 transition-all disabled:opacity-50"
            >
                <Filter size={11} />
                Apply
            </button>

            {/* Reset */}
            {hasFilter && (
                <button
                    onClick={() => {
                        setLocalAction("");
                        setLocalEntityType("");
                        onReset();
                    }}
                    disabled={isPending}
                    className="flex items-center gap-1.5 px-3 py-2 rounded-lg border border-(--border-card) bg-(--bg-secondary) text-(--text-secondary) hover:text-(--text-primary) text-xs font-bold transition-all disabled:opacity-50"
                >
                    <RotateCcw size={11} />
                    Reset
                </button>
            )}
        </div>
    );
}

// ─── Pagination controls ──────────────────────────────────────────────────────

function Pagination({
    page,
    totalPages,
    total,
    pageSize,
    onPage,
    isPending,
}: {
    page: number;
    totalPages: number;
    total: number;
    pageSize: number;
    onPage: (p: number) => void;
    isPending: boolean;
}) {
    const from = (page - 1) * pageSize + 1;
    const to = Math.min(page * pageSize, total);

    return (
        <div className="flex items-center justify-between px-5 py-3 border-t border-(--border-primary)">
            <p className="text-[10px] text-(--text-muted) font-medium">
                Showing {from}–{to} of {total} entries
            </p>
            <div className="flex items-center gap-1">
                <button
                    onClick={() => onPage(page - 1)}
                    disabled={page <= 1 || isPending}
                    className="p-1.5 rounded-lg border border-(--border-card) bg-(--bg-secondary) text-(--text-secondary) hover:text-(--text-primary) transition-all disabled:opacity-40"
                >
                    <ChevronLeft size={13} />
                </button>
                <span className="px-3 py-1 text-[11px] font-bold text-(--text-primary)">
                    {page} / {totalPages}
                </span>
                <button
                    onClick={() => onPage(page + 1)}
                    disabled={page >= totalPages || isPending}
                    className="p-1.5 rounded-lg border border-(--border-card) bg-(--bg-secondary) text-(--text-secondary) hover:text-(--text-primary) transition-all disabled:opacity-40"
                >
                    <ChevronRight size={13} />
                </button>
            </div>
        </div>
    );
}

// ─── Main component ───────────────────────────────────────────────────────────

interface AuditTrailClientProps {
    initialData: PaginatedAuditLogs;
    currentAdminUserId: string;
    initialAction?: string;
    initialEntityType?: string;
}

export function AuditTrailClient({
    initialData,
    currentAdminUserId,
    initialAction = "",
    initialEntityType = "",
}: AuditTrailClientProps) {
    const router = useRouter();
    const pathname = usePathname();
    const [isPending, startTransition] = useTransition();

    const navigateTo = (page: number, action: string, entityType: string) => {
        const params = new URLSearchParams();
        if (page > 1) params.set("page", page.toString());
        if (action) params.set("action", action);
        if (entityType) params.set("entityType", entityType);
        const qs = params.toString();
        startTransition(() => {
            router.push(`${pathname}${qs ? `?${qs}` : ""}`);
        });
    };

    const handleFilter = (action: string, entityType: string) => {
        navigateTo(1, action, entityType);
    };

    const handleReset = () => {
        startTransition(() => {
            router.push(pathname);
        });
    };

    const handlePage = (p: number) => {
        navigateTo(p, initialAction, initialEntityType);
    };

    const { logs, total, page, pageSize, totalPages } = initialData;

    return (
        <div className="space-y-4">
            {/* Filter bar */}
            <FilterBar
                action={initialAction}
                entityType={initialEntityType}
                onFilter={handleFilter}
                onReset={handleReset}
                isPending={isPending}
            />

            {/* Table card */}
            <div
                className="rounded-2xl border overflow-hidden shadow-sm"
                style={{
                    background: "var(--bg-card)",
                    borderColor: "var(--border-card)",
                    opacity: isPending ? 0.6 : 1,
                    transition: "opacity 150ms",
                }}
            >
                {/* Header */}
                <div className="p-5 border-b border-(--border-primary) flex items-center justify-between">
                    <div className="flex items-center gap-2">
                        <FileSpreadsheet size={15} className="text-(--text-muted)" />
                        <div>
                            <h3 className="text-sm font-bold text-(--text-primary) uppercase tracking-widest">
                                System Audit Trail
                            </h3>
                            <p className="text-[10px] text-(--text-secondary) mt-0.5">
                                Immutable record of all administrative changes across the system.
                            </p>
                        </div>
                    </div>
                    <span className="px-2.5 py-1 rounded-md text-[10px] font-bold bg-(--bg-secondary) text-(--text-secondary) border border-(--border-card)">
                        {total} entries
                    </span>
                </div>

                {/* Table */}
                <div className="overflow-x-auto">
                    <table className="w-full text-left text-xs border-collapse">
                        <thead>
                            <tr className="bg-(--bg-secondary) border-b border-(--border-primary) text-(--text-secondary) uppercase tracking-wider font-bold">
                                <th className="p-4">Action</th>
                                <th className="p-4">Entity</th>
                                <th className="p-4">Actor</th>
                                <th className="p-4">Changes</th>
                                <th className="p-4">IP Address</th>
                                <th className="p-4">Timestamp</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-(--border-primary) font-medium text-(--text-secondary)">
                            {logs.map((log) => {
                                const colour = getActionColour(log.action);
                                return (
                                    <tr
                                        key={log.id}
                                        className="hover:bg-black/5 dark:hover:bg-white/5 transition-colors"
                                    >
                                        {/* Action */}
                                        <td className="p-4">
                                            <span
                                                className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded text-[10px] font-bold uppercase"
                                                style={{
                                                    background: colour.bg,
                                                    color: colour.color,
                                                    border: `1px solid ${colour.border}`,
                                                }}
                                            >
                                                <span
                                                    className="w-1.5 h-1.5 rounded-full shrink-0"
                                                    style={{ background: colour.dot }}
                                                />
                                                {log.action.replace(/_/g, " ")}
                                            </span>
                                        </td>

                                        {/* Entity */}
                                        <td className="p-4">
                                            <p className="text-(--text-primary) font-mono leading-none">
                                                {log.entityType}
                                            </p>
                                            {log.entityId && (
                                                <p className="text-[9px] text-(--text-muted) font-mono truncate mt-0.5 max-w-[120px]">
                                                    {log.entityId}
                                                </p>
                                            )}
                                        </td>

                                        {/* Actor */}
                                        <td className="p-4">
                                            <p className="font-bold text-(--text-primary)">
                                                {log.user?.name ?? "System"}
                                            </p>
                                            {log.user?.email && (
                                                <p className="text-[10px] text-(--text-muted) font-mono">
                                                    {log.user.email}
                                                </p>
                                            )}
                                        </td>

                                        {/* Diff */}
                                        <td className="p-4 max-w-[220px]">
                                            <DiffCell
                                                oldValues={log.oldValues}
                                                newValues={log.newValues}
                                            />
                                        </td>

                                        {/* IP */}
                                        <td className="p-4 font-mono text-[11px] text-(--text-muted)">
                                            {log.ipAddress ?? "—"}
                                        </td>

                                        {/* Timestamp */}
                                        <td className="p-4 whitespace-nowrap text-(--text-muted)">
                                            {new Date(log.createdAt).toLocaleString("en-US", {
                                                month: "short",
                                                day: "numeric",
                                                year: "numeric",
                                                hour: "2-digit",
                                                minute: "2-digit",
                                            })}
                                        </td>
                                    </tr>
                                );
                            })}

                            {logs.length === 0 && (
                                <tr>
                                    <td
                                        colSpan={6}
                                        className="p-10 text-center text-(--text-muted) italic"
                                    >
                                        No audit events match the current filters.
                                    </td>
                                </tr>
                            )}
                        </tbody>
                    </table>
                </div>

                {/* Pagination */}
                {total > pageSize && (
                    <Pagination
                        page={page}
                        totalPages={totalPages}
                        total={total}
                        pageSize={pageSize}
                        onPage={handlePage}
                        isPending={isPending}
                    />
                )}
            </div>
        </div>
    );
}