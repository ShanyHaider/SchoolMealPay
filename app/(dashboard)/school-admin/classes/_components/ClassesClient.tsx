"use client";

import { useState, useTransition, useRef } from "react";
import { createPortal } from "react-dom";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import {
  createClass,
  deleteClass,
  updateClass,
} from "@/db/actions/admin/Classes";
import {
  createClassSchema,
  updateClassSchema,
  type CreateClassInput,
  type UpdateClassInput,
} from "@/lib/validations/validators";
import type { getAllClasses } from "@/db/queries/Admin";
import {
  Plus,
  Trash2,
  Pencil,
  GraduationCap,
  AlertCircle,
  Loader2,
  Upload,
} from "lucide-react";

import { ConfirmModal } from "@/components/ConfirmModal";
import { ToastContainer, useToast } from "@/components/useToast";

type ClassItem = Awaited<ReturnType<typeof getAllClasses>>[number];

const inputStyle = {
  background: "var(--bg-secondary)",
  border: "1px solid var(--border-input)",
  borderRadius: 8,
  color: "var(--text-primary)",
  fontSize: 14,
  padding: "9px 12px",
  width: "100%",
  outline: "none",
  fontFamily: "inherit",
} as React.CSSProperties;

export function ClassesClient({ classes }: { classes: ClassItem[] }) {
  const [showAdd, setShowAdd] = useState(false);
  const [editingClass, setEditingClass] = useState<ClassItem | null>(null);
  const [deletingClass, setDeletingClass] = useState<ClassItem | null>(null);
  const [isPending, startTransition] = useTransition();
  const [isDeletePending, startDeleteTransition] = useTransition();
  const [serverError, setServerError] = useState<string | null>(null);
  const [isCsvPending, startCsvTransition] = useTransition();
  const fileInputRef = useRef<HTMLInputElement>(null);

  const { toasts, toast, dismiss } = useToast();

  // ── Add form ──────────────────────────────────────────────────────────────
  const {
    register: registerAdd,
    handleSubmit: handleAddSubmit,
    reset: resetAddForm,
    watch: watchAdd,
    formState: { errors: addErrors },
  } = useForm<CreateClassInput>({
    resolver: zodResolver(createClassSchema),
    defaultValues: { grade: "", section: "" },
  });

  // ── Edit form ─────────────────────────────────────────────────────────────
  const {
    register: registerEdit,
    handleSubmit: handleEditSubmit,
    reset: resetEditForm,
    formState: { errors: editErrors, isDirty: isEditDirty },
  } = useForm<UpdateClassInput>({
    resolver: zodResolver(updateClassSchema),
  });

  const canAdd =
    watchAdd("grade").trim().length > 0 &&
    watchAdd("section").trim().length > 0;

  // ── Handlers ──────────────────────────────────────────────────────────────
  const onCreateClass = (data: CreateClassInput) => {
    setServerError(null);
    startTransition(async () => {
      try {
        await createClass(data);
        resetAddForm();
        setShowAdd(false);
        toast(
          `Grade ${data.grade} — Section ${data.section} was added.`,
          "success",
        );
      } catch (err: any) {
        setServerError(
          err?.message ?? "An error occurred while creating the class.",
        );
      }
    });
  };

  const onUpdateClass = (data: UpdateClassInput) => {
    if (!editingClass) return;
    setServerError(null);
    startTransition(async () => {
      try {
        await updateClass(editingClass.id, data);
        resetEditForm({ grade: data.grade, section: data.section });
        setEditingClass(null);
        toast(
          `Grade ${data.grade} — Section ${data.section} was updated.`,
          "success",
        );
      } catch (err: any) {
        setServerError(
          err?.message ?? "An error occurred while updating the class.",
        );
      }
    });
  };

  const confirmDelete = () => {
    if (!deletingClass) return;
    startDeleteTransition(async () => {
      try {
        await deleteClass(deletingClass.id);
        toast(
          `Grade ${deletingClass.grade} — Section ${deletingClass.section} was deleted.`,
          "success",
        );
        setDeletingClass(null);
      } catch (err: any) {
        toast(err?.message ?? "Failed to delete class.", "error");
        setDeletingClass(null);
      }
    });
  };

  const handleCsvUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setServerError(null);
    const reader = new FileReader();
    reader.onload = async (event) => {
      const text = event.target?.result as string;
      if (!text) return;

      const lines = text
        .split(/\r?\n/)
        .map((l) => l.trim())
        .filter(Boolean);

      if (lines.length <= 1) {
        setServerError("Selected CSV file has no class records.");
        return;
      }

      const headers = lines[0]
        .toLowerCase()
        .split(",")
        .map((h) => h.trim().replace(/["']/g, ""));
      const gradeIdx = headers.indexOf("grade");
      const sectionIdx = headers.indexOf("section");

      if (gradeIdx === -1 || sectionIdx === -1) {
        setServerError(
          "CSV file must contain columns labeled 'grade' and 'section'.",
        );
        return;
      }

      startCsvTransition(async () => {
        let successfulCount = 0;
        const compilationErrors: string[] = [];

        for (let i = 1; i < lines.length; i++) {
          const row = lines[i]
            .split(",")
            .map((cell) => cell.trim().replace(/["']/g, ""));
          if (row.length < 2) continue;

          const gradeVal = row[gradeIdx];
          const sectionVal = row[sectionIdx];

          if (!gradeVal || !sectionVal) {
            compilationErrors.push(`Row ${i + 1}: Missing values.`);
            continue;
          }

          try {
            await createClass({ grade: gradeVal, section: sectionVal });
            successfulCount++;
          } catch (err: any) {
            compilationErrors.push(
              `Row ${i + 1}: ${err?.message ?? "Insertion failure"}`,
            );
          }
        }

        if (compilationErrors.length > 0) {
          setServerError(
            `Processed ${successfulCount} classes. Failures:\n${compilationErrors.slice(0, 3).join("; ")}`,
          );
        } else {
          setServerError(null);
          toast(
            successfulCount === 1 ?
              "1 class imported successfully."
            : `${successfulCount} classes imported successfully.`,
            "success",
          );
        }

        if (fileInputRef.current) fileInputRef.current.value = "";
      });
    };
    reader.readAsText(file);
  };

  const startEditing = (cls: ClassItem) => {
    setServerError(null);
    setEditingClass(cls);
    resetEditForm({ grade: cls.grade, section: cls.section });
  };

  // ── Render ────────────────────────────────────────────────────────────────
  return (
    <>
      <div className="space-y-6">
        {/* Toolbar */}
        <div className="flex items-center justify-end gap-2">
          <input
            type="file"
            ref={fileInputRef}
            accept=".csv"
            onChange={handleCsvUpload}
            className="hidden"
            id="class-csv-file"
            disabled={isCsvPending}
          />
          <label
            htmlFor="class-csv-file"
            className="flex items-center gap-2 rounded-lg border px-3 py-2 text-sm font-medium cursor-pointer transition-all hover:bg-(--bg-secondary)"
            style={{
              borderColor: "var(--border-input)",
              color: "var(--text-secondary)",
            }}
          >
            {isCsvPending ?
              <Loader2 size={14} className="animate-spin" />
            : <Upload size={14} />}
            Import CSV
          </label>

          <button
            onClick={() => {
              setServerError(null);
              setShowAdd(true);
            }}
            className="flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-all cursor-pointer"
            style={{
              background: "var(--accent)",
              color: "var(--accent-text)",
              boxShadow: "var(--shadow-btn)",
            }}
          >
            <Plus size={15} /> Add Class
          </button>
        </div>

        {/* Error banner (CSV partial failures only) */}
        {serverError && (
          <div
            className="flex items-start gap-2 p-4 rounded-xl text-sm border"
            style={{
              background: "rgba(239,68,68,0.08)",
              color: "#ef4444",
              borderColor: "rgba(239,68,68,0.15)",
            }}
          >
            <AlertCircle size={16} className="shrink-0 mt-0.5" />
            <span className="whitespace-pre-line">{serverError}</span>
          </div>
        )}

        {/* Empty state */}
        {classes.length === 0 ?
          <div
            className="py-16 text-center rounded-xl border"
            style={{
              background: "var(--bg-card)",
              borderColor: "var(--border-card)",
            }}
          >
            <GraduationCap
              size={32}
              className="mx-auto mb-3 text-(--text-muted)"
            />
            <p className="text-sm text-(--text-secondary)">
              No classes added yet.
            </p>
          </div>
        : <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {classes.map((cls) => (
              <div
                key={cls.id}
                className="p-5 rounded-xl border flex flex-col justify-between transition-all"
                style={{
                  background: "var(--bg-card)",
                  borderColor: "var(--border-card)",
                  boxShadow: "var(--shadow-card)",
                }}
              >
                <div>
                  <div className="flex items-start justify-between mb-3">
                    <div
                      className="flex h-10 w-10 items-center justify-center rounded-xl text-sm font-bold"
                      style={{
                        background: "rgba(139,92,246,0.12)",
                        color: "#8b5cf6",
                      }}
                    >
                      {cls.grade}
                    </div>
                    <div className="flex items-center gap-1">
                      <button
                        onClick={() => startEditing(cls)}
                        disabled={isPending}
                        className="p-1.5 rounded-lg text-(--text-muted) hover:text-(--text-primary) hover:bg-(--bg-secondary) transition-colors cursor-pointer disabled:opacity-50"
                        title="Edit Class"
                      >
                        <Pencil size={14} />
                      </button>
                      <button
                        onClick={() => setDeletingClass(cls)}
                        disabled={isPending}
                        className="p-1.5 rounded-lg text-[#ef4444] hover:bg-red-50 dark:hover:bg-red-950/30 transition-colors cursor-pointer disabled:opacity-50"
                        title="Delete Class"
                      >
                        <Trash2 size={14} />
                      </button>
                    </div>
                  </div>
                  <h3 className="text-base font-semibold text-(--text-primary)">
                    Grade {cls.grade} — Section {cls.section}
                  </h3>
                </div>
                <div className="mt-4 pt-3 border-t border-(--border-primary) flex items-center justify-between">
                  <span className="text-xs text-(--text-muted) font-mono uppercase tracking-wider">
                    ID: {cls.id.slice(0, 8)}...
                  </span>
                  <span className="text-xs font-medium px-2 py-0.5 rounded bg-(--bg-tertiary) text-(--text-secondary)">
                    {cls.studentCount} student
                    {cls.studentCount !== 1 ? "s" : ""}
                  </span>
                </div>
              </div>
            ))}
          </div>
        }
      </div>

      {/* ── Add modal ─────────────────────────────────────────────────────── */}
      {showAdd &&
        createPortal(
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            <div
              className="absolute inset-0 bg-black/50 backdrop-blur-xs"
              onClick={() => !isPending && setShowAdd(false)}
            />
            <form
              onSubmit={handleAddSubmit(onCreateClass)}
              className="relative w-full max-w-md rounded-2xl p-6 z-10 space-y-4 border"
              style={{
                background: "var(--bg-card)",
                borderColor: "var(--border-card)",
                boxShadow: "var(--shadow-card)",
              }}
            >
              <h2 className="text-lg font-semibold text-(--text-primary)">
                Add Class
              </h2>
              <div className="space-y-3">
                <div>
                  <label className="block text-xs font-medium mb-1.5 text-(--text-secondary)">
                    Grade / Year Level <span className="text-red-500">*</span>
                  </label>
                  <input
                    {...registerAdd("grade")}
                    placeholder="e.g. 5, 10, LKG"
                    style={inputStyle}
                    disabled={isPending}
                    autoFocus
                  />
                  {addErrors.grade && (
                    <p className="text-xs text-[#ef4444] mt-1">
                      {addErrors.grade.message}
                    </p>
                  )}
                </div>
                <div>
                  <label className="block text-xs font-medium mb-1.5 text-(--text-secondary)">
                    Section / Stream <span className="text-red-500">*</span>
                  </label>
                  <input
                    {...registerAdd("section")}
                    placeholder="e.g. A, Pink, Medical"
                    style={inputStyle}
                    disabled={isPending}
                  />
                  {addErrors.section && (
                    <p className="text-xs text-[#ef4444] mt-1">
                      {addErrors.section.message}
                    </p>
                  )}
                </div>
              </div>
              <div className="flex gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => {
                    resetAddForm();
                    setShowAdd(false);
                  }}
                  disabled={isPending}
                  className="flex-1 py-2 rounded-lg text-sm font-medium border border-(--border-input) bg-(--bg-tertiary) text-(--text-secondary) cursor-pointer disabled:opacity-50"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isPending || !canAdd}
                  className="flex-1 py-2 rounded-lg text-sm font-medium text-(--accent-text) bg-(--accent) flex items-center justify-center gap-2 cursor-pointer disabled:opacity-50"
                >
                  {isPending && <Loader2 size={14} className="animate-spin" />}
                  {isPending ? "Adding…" : "Add Class"}
                </button>
              </div>
            </form>
          </div>,
          document.body,
        )}

      {/* ── Edit modal ────────────────────────────────────────────────────── */}
      {editingClass &&
        createPortal(
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            <div
              className="absolute inset-0 bg-black/50 backdrop-blur-xs"
              onClick={() => !isPending && setEditingClass(null)}
            />
            <form
              onSubmit={handleEditSubmit(onUpdateClass)}
              className="relative w-full max-w-md rounded-2xl p-6 z-10 space-y-4 border"
              style={{
                background: "var(--bg-card)",
                borderColor: "var(--border-card)",
                boxShadow: "var(--shadow-card)",
              }}
            >
              <div>
                <h2 className="text-lg font-semibold text-(--text-primary)">
                  Edit Class
                </h2>
                <p
                  className="text-xs mt-0.5"
                  style={{ color: "var(--text-muted)" }}
                >
                  Grade {editingClass.grade} — Section {editingClass.section}
                </p>
              </div>

              <div className="space-y-3">
                <div>
                  <label className="block text-xs font-medium mb-1.5 text-(--text-secondary)">
                    Grade / Year Level <span className="text-red-500">*</span>
                  </label>
                  <input
                    {...registerEdit("grade")}
                    placeholder="e.g. 5"
                    style={inputStyle}
                    disabled={isPending}
                    autoFocus
                  />
                  {editErrors.grade && (
                    <p className="text-xs text-[#ef4444] mt-1">
                      {editErrors.grade.message}
                    </p>
                  )}
                </div>
                <div>
                  <label className="block text-xs font-medium mb-1.5 text-(--text-secondary)">
                    Section / Stream <span className="text-red-500">*</span>
                  </label>
                  <input
                    {...registerEdit("section")}
                    placeholder="e.g. A"
                    style={inputStyle}
                    disabled={isPending}
                  />
                  {editErrors.section && (
                    <p className="text-xs text-[#ef4444] mt-1">
                      {editErrors.section.message}
                    </p>
                  )}
                </div>
              </div>

              <div className="flex gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => {
                    resetEditForm();
                    setEditingClass(null);
                  }}
                  disabled={isPending}
                  className="flex-1 py-2 rounded-lg text-sm font-medium border border-(--border-input) bg-(--bg-tertiary) text-(--text-secondary) cursor-pointer disabled:opacity-50"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isPending || !isEditDirty}
                  className="flex-1 py-2 rounded-lg text-sm font-medium text-(--accent-text) bg-(--accent) flex items-center justify-center gap-2 cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {isPending && <Loader2 size={14} className="animate-spin" />}
                  {isPending ? "Saving…" : "Save Changes"}
                </button>
              </div>
            </form>
          </div>,
          document.body,
        )}

      {/* ── Delete confirm modal ──────────────────────────────────────────── */}
      {deletingClass &&
        createPortal(
          <ConfirmModal
            title="Delete class"
            description={`Are you sure you want to delete Grade ${deletingClass.grade} — Section ${deletingClass.section}? Students assigned to this class will be unassigned but not deleted.`}
            isPending={isDeletePending}
            onClose={() => setDeletingClass(null)}
            onConfirm={confirmDelete}
            variant="danger"
            confirmLabel="Delete"
          />,
          document.body,
        )}

      {/* ── Toast container ───────────────────────────────────────────────── */}
      <ToastContainer toasts={toasts} dismiss={dismiss} />
    </>
  );
}
