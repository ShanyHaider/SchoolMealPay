"use client";

import { useState, useTransition } from "react";
import { createPortal } from "react-dom";
import { Pencil, Trash2, User } from "lucide-react";
import { deleteStudent } from "@/db/actions/admin/Student";
import type { getAllStudents, getAllClasses } from "@/db/queries/Admin";
import { ConfirmModal } from "../../../../../components/ConfirmModal";
import { ALLERGEN_COLORS } from "./Shared";

type Student = Awaited<ReturnType<typeof getAllStudents>>[number];
type Class = Awaited<ReturnType<typeof getAllClasses>>[number];

interface StudentRowProps {
    student: Student;
    classes: Class[];
    toast: (message: string, type?: "success" | "error" | "warning") => void;
    onEdit: (student: Student) => void;
    viewMode?: "table" | "card";
}

export function StudentRow({ student, classes, toast, onEdit, viewMode = "table" }: StudentRowProps) {
    const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
    const [isPending, startTransition] = useTransition();

    const confirmDelete = () => {
        startTransition(async () => {
            try {
                await deleteStudent(student.id);
                toast(`${student.name} was deleted.`, "success");
                setShowDeleteConfirm(false);
            } catch {
                toast("Failed to delete student. Please try again.", "error");
                setShowDeleteConfirm(false);
            }
        });
    };

    const approvedParents = student.parentLinks?.filter((l) => l.status === "approved") ?? [];

    const avatarElement = student.imageUrl ? (
        <img
            src={student.imageUrl}
            alt={student.name}
            className="h-11 w-11 shrink-0 rounded-full object-cover border"
            style={{ borderColor: "var(--border-primary)" }}
            onError={(e) => { (e.target as HTMLImageElement).style.display = "none"; }}
        />
    ) : (
        <div
            className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full"
            style={{ background: "var(--bg-tertiary)", color: "var(--text-muted)" }}
        >
            <User size={18} />
        </div>
    );

    // ── Mobile card ───────────────────────────────────────────────────────────

    if (viewMode === "card") {
        return (
            <>
                <div className="flex flex-col px-5 py-6 space-y-5 bg-transparent transition-colors hover:bg-[var(--bg-secondary)] w-full">
                    {/* Header: identity + actions */}
                    <div className="flex items-center justify-between gap-2">
                        <div className="flex items-center gap-3.5 min-w-0">
                            {avatarElement}
                            <div className="min-w-0">
                                <h4 className="font-bold text-base truncate" style={{ color: "var(--text-primary)" }}>
                                    {student.name}
                                </h4>
                                <p className="text-xs mt-1 truncate" style={{ color: "var(--text-secondary)" }}>
                                    {student.class
                                        ? `Grade ${student.class.grade} — ${student.class.section}`
                                        : "No Class Assigned"}
                                </p>
                            </div>
                        </div>
                        <div className="flex items-center gap-1.5 shrink-0">
                            <button
                                onClick={() => onEdit(student)}
                                className="rounded-xl p-2.5 transition-colors hover:bg-[var(--bg-tertiary)] border"
                                style={{ borderColor: "var(--border-input)", color: "var(--text-muted)" }}
                            >
                                <Pencil size={15} />
                            </button>
                            <button
                                onClick={() => setShowDeleteConfirm(true)}
                                className="rounded-xl p-2.5 transition-colors hover:bg-red-500/10 border"
                                style={{ borderColor: "var(--border-input)" }}
                            >
                                <Trash2 size={15} style={{ color: "#ef4444" }} />
                            </button>
                        </div>
                    </div>

                    {/* Info grid */}
                    <div className="grid grid-cols-12 gap-y-1 gap-x-4 pt-1 text-xs">
                        <div className="col-span-4 flex flex-col gap-1">
                            <span className="text-[10px] font-bold uppercase tracking-wider" style={{ color: "var(--text-muted)" }}>
                                Code
                            </span>
                            <span className="font-mono text-sm font-medium" style={{ color: "var(--text-primary)" }}>
                                {student.studentCode}
                            </span>
                        </div>
                        <div className="col-span-4 flex flex-col gap-1">
                            <span className="text-[10px] font-bold uppercase tracking-wider" style={{ color: "var(--text-muted)" }}>
                                Ordering
                            </span>
                            <span
                                className="inline-block rounded-md px-2 py-0.5 text-[10px] font-extrabold tracking-wider w-fit"
                                style={
                                    student.orderingEnabled
                                        ? { background: "rgba(34,197,94,0.12)", color: "#22c55e" }
                                        : { background: "rgba(239,68,68,0.12)", color: "#ef4444" }
                                }
                            >
                                {student.orderingEnabled ? "ACTIVE" : "DISABLED"}
                            </span>
                        </div>
                        <div className="col-span-4 flex flex-col gap-1">
                            <span className="text-[10px] font-bold uppercase tracking-wider" style={{ color: "var(--text-muted)" }}>
                                Parents
                            </span>
                            <span className="text-sm font-medium" style={{ color: "var(--text-secondary)" }}>
                                {approvedParents.length > 0 ? `${approvedParents.length} Linked` : "None"}
                            </span>
                        </div>
                    </div>

                    {/* Allergens */}
                    {student.allergens && student.allergens.length > 0 && (
                        <div className="pt-3.5 border-t flex flex-wrap items-center gap-2" style={{ borderColor: "var(--border-primary)" }}>
                            <span className="text-[10px] font-bold uppercase tracking-wider shrink-0 mr-1" style={{ color: "var(--text-muted)" }}>
                                Allergens:
                            </span>
                            <div className="flex flex-wrap gap-1.5">
                                {student.allergens.map((a) => (
                                    <span
                                        key={a.id}
                                        className="rounded-md px-2 py-0.5 text-[10px] font-semibold capitalize"
                                        style={{
                                            background: `${ALLERGEN_COLORS[a.allergen] ?? "#6b7280"}15`,
                                            color: ALLERGEN_COLORS[a.allergen] ?? "#6b7280",
                                        }}
                                    >
                                        {a.allergen}
                                    </span>
                                ))}
                            </div>
                        </div>
                    )}
                </div>

                {showDeleteConfirm && createPortal(
                    <ConfirmModal
                        title="Delete student profile"
                        description={`Are you sure you want to delete ${student.name}?`}
                        isPending={isPending}
                        onClose={() => setShowDeleteConfirm(false)}
                        onConfirm={confirmDelete}
                        variant="danger"
                        confirmLabel="Delete"
                    />,
                    document.body,
                )}
            </>
        );
    }

    // ── Desktop table row ─────────────────────────────────────────────────────

    return (
        <>
            <tr
                className="transition-colors hover:bg-[var(--bg-secondary)]"
                style={{ borderBottom: "1px solid var(--border-primary)" }}
            >
                <td className="px-4 py-3">
                    <div className="flex items-center gap-3">
                        {avatarElement}
                        <span className="font-medium text-sm" style={{ color: "var(--text-primary)" }}>
                            {student.name}
                        </span>
                    </div>
                </td>

                <td className="px-4 py-3">
                    <span
                        className="font-mono text-xs px-2 py-0.5 rounded"
                        style={{ background: "var(--bg-tertiary)", color: "var(--text-secondary)" }}
                    >
                        {student.studentCode}
                    </span>
                </td>

                <td className="px-4 py-3 text-sm" style={{ color: "var(--text-secondary)" }}>
                    {student.class
                        ? `Grade ${student.class.grade} — ${student.class.section}`
                        : <span style={{ color: "var(--text-muted)" }}>—</span>}
                </td>

                <td className="px-4 py-3">
                    <div className="flex flex-wrap gap-1">
                        {student.allergens?.length ? (
                            <>
                                {student.allergens.slice(0, 3).map((a) => (
                                    <span
                                        key={a.id}
                                        className="rounded px-1.5 py-0.5 text-xs font-medium capitalize"
                                        style={{
                                            background: `${ALLERGEN_COLORS[a.allergen] ?? "#6b7280"}20`,
                                            color: ALLERGEN_COLORS[a.allergen] ?? "#6b7280",
                                        }}
                                    >
                                        {a.allergen}
                                    </span>
                                ))}
                                {student.allergens.length > 3 && (
                                    <span className="text-xs" style={{ color: "var(--text-muted)" }}>
                                        +{student.allergens.length - 3}
                                    </span>
                                )}
                            </>
                        ) : (
                            <span style={{ color: "var(--text-muted)" }}>—</span>
                        )}
                    </div>
                </td>

                <td className="px-4 py-3 text-sm" style={{ color: "var(--text-secondary)" }}>
                    {approvedParents.length > 0
                        ? `${approvedParents.length} linked`
                        : <span style={{ color: "var(--text-muted)" }}>None</span>}
                </td>

                <td className="px-4 py-3">
                    <span
                        className="rounded-full px-2 py-0.5 text-xs font-medium"
                        style={
                            student.orderingEnabled
                                ? { background: "rgba(34,197,94,0.12)", color: "#22c55e" }
                                : { background: "rgba(239,68,68,0.12)", color: "#ef4444" }
                        }
                    >
                        {student.orderingEnabled ? "Enabled" : "Disabled"}
                    </span>
                </td>

                <td className="px-4 py-3">
                    <div className="flex items-center gap-1">
                        <button
                            onClick={() => onEdit(student)}
                            className="rounded-lg p-1.5 transition-colors hover:bg-[var(--bg-tertiary)]"
                            title="Edit student"
                            style={{ color: "var(--text-muted)" }}
                        >
                            <Pencil size={13} />
                        </button>
                        <button
                            onClick={() => setShowDeleteConfirm(true)}
                            className="rounded-lg p-1.5 transition-colors hover:bg-red-500/10"
                            title="Delete student"
                        >
                            <Trash2 size={13} style={{ color: "#ef4444" }} />
                        </button>
                    </div>
                </td>
            </tr>

            {showDeleteConfirm && createPortal(
                <ConfirmModal
                    title="Delete student profile"
                    description={`Are you sure you want to delete ${student.name}? All historical links, profiles, and configuration will be permanently removed.`}
                    isPending={isPending}
                    onClose={() => setShowDeleteConfirm(false)}
                    onConfirm={confirmDelete}
                    variant="danger"
                    confirmLabel="Delete"
                />,
                document.body,
            )}
        </>
    );
}