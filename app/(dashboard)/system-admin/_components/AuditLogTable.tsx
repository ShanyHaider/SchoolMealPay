// app/(dashboard)/system-admin/_components/AuditLogTable.tsx

import { FileSpreadsheet } from "lucide-react";

export type AuditLogRow = {
    id: string;
    action: string;
    entityType: string;
    entityId: string | null;
    oldValues: unknown;
    newValues: unknown;
    ipAddress: string | null;
    createdAt: Date;
    user: { name: string; email: string } | null;
};

interface AuditLogTableProps {
    auditLogs: AuditLogRow[];
    /** When true, renders in a compact preview style (for the overview page). */
    preview?: boolean;
}

export function AuditLogTable({ auditLogs, preview = false }: AuditLogTableProps) {
    const rows = preview ? auditLogs.slice(0, 5) : auditLogs;

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
                <div className="flex items-center gap-2">
                    <FileSpreadsheet size={15} className="text-(--text-muted)" />
                    <div>
                        <h3 className="text-sm font-bold text-(--text-primary) uppercase tracking-widest">
                            {preview ? "Recent Audit Events" : "System Audit Trail"}
                        </h3>
                        <p className="text-[10px] text-(--text-secondary) mt-0.5">
                            {preview
                                ? "Last 5 administrative actions"
                                : "Immutable log of all administrative changes across the system."}
                        </p>
                    </div>
                </div>
                {!preview && (
                    <span className="px-2.5 py-1 rounded-md text-[10px] font-bold bg-(--bg-secondary) text-(--text-secondary) border border-(--border-card)">
                        {auditLogs.length} entries
                    </span>
                )}
            </div>

            {/* Table */}
            <div className="overflow-x-auto">
                <table className="w-full text-left text-xs border-collapse">
                    <thead>
                        <tr className="bg-(--bg-secondary) border-b border-(--border-primary) text-(--text-secondary) uppercase tracking-wider font-bold">
                            <th className="p-4">Action</th>
                            <th className="p-4">Entity</th>
                            <th className="p-4">User</th>
                            {!preview && (
                                <>
                                    <th className="p-4">Changes</th>
                                    <th className="p-4">IP Address</th>
                                </>
                            )}
                            <th className="p-4">Timestamp</th>
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-(--border-primary) font-medium text-(--text-secondary)">
                        {rows.map((log) => (
                            <tr
                                key={log.id}
                                className="hover:bg-black/5 dark:hover:bg-white/5 transition-colors"
                            >
                                {/* Action badge */}
                                <td className="p-4">
                                    <span className="px-2 py-0.5 rounded text-[10px] font-bold uppercase bg-amber-500/10 text-amber-600 border border-amber-500/20">
                                        {log.action.replace(/_/g, " ")}
                                    </span>
                                </td>

                                {/* Entity type + id */}
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

                                {/* Changes diff — only in full view */}
                                {!preview && (
                                    <>
                                        <td className="p-4 max-w-xs font-mono text-[10px] leading-tight">
                                            <div className="space-y-0.5">
                                                <p className="text-red-500 truncate">
                                                    - {JSON.stringify(log.oldValues ?? {})}
                                                </p>
                                                <p className="text-green-500 truncate">
                                                    + {JSON.stringify(log.newValues ?? {})}
                                                </p>
                                            </div>
                                        </td>
                                        <td className="p-4 font-mono text-[11px]">
                                            {log.ipAddress ?? "local"}
                                        </td>
                                    </>
                                )}

                                {/* Timestamp */}
                                <td className="p-4 whitespace-nowrap text-(--text-muted)">
                                    {new Date(log.createdAt).toLocaleString("en-US", {
                                        month: "short",
                                        day: "numeric",
                                        hour: "2-digit",
                                        minute: "2-digit",
                                    })}
                                </td>
                            </tr>
                        ))}

                        {rows.length === 0 && (
                            <tr>
                                <td
                                    colSpan={preview ? 4 : 6}
                                    className="p-8 text-center text-(--text-muted) italic"
                                >
                                    No audit events recorded.
                                </td>
                            </tr>
                        )}
                    </tbody>
                </table>
            </div>
        </div>
    );
}