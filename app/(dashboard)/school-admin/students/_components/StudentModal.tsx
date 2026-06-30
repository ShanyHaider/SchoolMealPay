"use client";

import { useState, useTransition } from "react";
import { createPortal } from "react-dom";
import { AlertCircle, Loader2 } from "lucide-react";
import { createStudent, updateStudent } from "@/db/actions/admin/Student";
import {
  createStudentSchema,
  updateStudentSchema,
} from "@/lib/validations/validators";
import { AvatarUploader } from "./AvatarUploader";
import { ClassSelector } from "./ClassSelector";
import type { getAllStudents, getAllClasses } from "@/db/queries/Admin";

type Student = Awaited<ReturnType<typeof getAllStudents>>[number];
type Class = Awaited<ReturnType<typeof getAllClasses>>[number];

const inputStyle: React.CSSProperties = {
  background: "var(--bg-secondary)",
  border: "1px solid var(--border-input)",
  borderRadius: 8,
  color: "var(--text-primary)",
  fontSize: 13,
  padding: "8px 12px",
  width: "100%",
  outline: "none",
  fontFamily: "inherit",
};

type FormState = {
  name: string;
  studentCode: string;
  classId: string | undefined;
  imageUrl: string;
  orderingEnabled: boolean;
};

const DEFAULT_FORM: FormState = {
  name: "",
  studentCode: "",
  classId: undefined,
  imageUrl: "",
  orderingEnabled: true,
};

function studentToForm(student: Student): FormState {
  return {
    name: student.name,
    studentCode: student.studentCode,
    classId: student.classId ?? undefined,
    imageUrl: student.imageUrl ?? "",
    orderingEnabled: student.orderingEnabled,
  };
}

interface StudentModalProps {
  student?: Student;
  classes: Class[];
  onClose: () => void;
  onSuccess: (message: string) => void;
  onError: (message: string) => void;
}

export function StudentModal({
  student,
  classes,
  onClose,
  onSuccess,
  onError,
}: StudentModalProps) {
  const isEditing = student !== undefined;

  const [form, setForm] = useState<FormState>(
    isEditing ? studentToForm(student) : DEFAULT_FORM,
  );
  const [initialForm] = useState<FormState>(
    isEditing ? studentToForm(student) : DEFAULT_FORM,
  );

  const [formError, setFormError] = useState("");
  const [isPending, startTransition] = useTransition();

  const isDirty = JSON.stringify(form) !== JSON.stringify(initialForm);
  const canSubmit =
    isEditing ?
      form.name.trim().length > 0 && isDirty
    : form.name.trim().length > 0 && form.studentCode.trim().length > 0;

  const handleSubmit = () => {
    if (isEditing) {
      const result = updateStudentSchema.safeParse({
        name: form.name.trim(),
        classId: form.classId || undefined,
        imageUrl: form.imageUrl || null,
        orderingEnabled: form.orderingEnabled,
      });
      if (!result.success) {
        setFormError(result.error.issues[0]?.message ?? "Validation failed.");
        return;
      }
      setFormError("");
      startTransition(async () => {
        try {
          await updateStudent(student.id, result.data);
          onSuccess(`${form.name.trim()} was updated successfully.`);
          onClose();
        } catch (err: any) {
          onError(err?.message ?? "Failed to update student.");
        }
      });
    } else {
      const result = createStudentSchema.safeParse({
        name: form.name.trim(),
        studentCode: form.studentCode.trim().toUpperCase(),
        classId: form.classId || undefined,
        imageUrl: form.imageUrl || null,
        allergenIds: [],
      });
      if (!result.success) {
        setFormError(result.error.issues[0]?.message ?? "Validation failed.");
        return;
      }
      setFormError("");
      startTransition(async () => {
        try {
          await createStudent(result.data);
          onSuccess(`${form.name.trim()} was added successfully.`);
          onClose();
        } catch (err: any) {
          onError(err?.message ?? "Failed to add student.");
        }
      });
    }
  };

  const handleClose = () => {
    if (!isPending) onClose();
  };

  return createPortal(
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div
        className="absolute inset-0"
        style={{ background: "rgba(0,0,0,0.5)" }}
        onClick={handleClose}
      />

      <div
        className="relative w-full max-w-md rounded-2xl p-6 z-10 overflow-y-auto max-h-[90vh]"
        style={{
          background: "var(--bg-card)",
          border: "1px solid var(--border-card)",
          boxShadow: "var(--shadow-card)",
        }}
      >
        <div className="mb-5">
          <h2
            className="text-lg font-semibold"
            style={{ color: "var(--text-primary)" }}
          >
            {isEditing ? "Edit student" : "Add student"}
          </h2>
          {isEditing && (
            <p
              className="text-xs mt-0.5"
              style={{ color: "var(--text-muted)" }}
            >
              {student.name} ·{" "}
              <span className="font-mono">{student.studentCode}</span>
            </p>
          )}
        </div>

        {formError && (
          <div
            className="flex items-center gap-2 p-3 rounded-lg mb-4 text-sm"
            style={{ background: "rgba(239,68,68,0.1)", color: "#ef4444" }}
          >
            <AlertCircle size={14} className="shrink-0" />
            {formError}
          </div>
        )}

        <div className="space-y-4">
          {/* Avatar */}
          <div>
            <label
              className="block text-xs font-medium mb-1.5"
              style={{ color: "var(--text-secondary)" }}
            >
              Profile photo
            </label>
            <AvatarUploader
              value={form.imageUrl}
              onChange={(val) => setForm({ ...form, imageUrl: val })}
              onError={setFormError}
            />
          </div>

          {/* Name */}
          <div>
            <label
              className="block text-xs font-medium mb-1.5"
              style={{ color: "var(--text-secondary)" }}
            >
              Full name <span className="text-red-500">*</span>
            </label>
            <input
              value={form.name}
              onChange={(e) => setForm({ ...form, name: e.target.value })}
              placeholder="e.g. Ahmed Khan"
              style={inputStyle}
              disabled={isPending}
              autoFocus
            />
          </div>

          {/* Student code — add mode only */}
          {!isEditing && (
            <div>
              <label
                className="block text-xs font-medium mb-1.5"
                style={{ color: "var(--text-secondary)" }}
              >
                Student code <span className="text-red-500">*</span>
              </label>
              <input
                value={form.studentCode}
                onChange={(e) =>
                  setForm({ ...form, studentCode: e.target.value })
                }
                placeholder="STU-2026-001"
                style={{ ...inputStyle, fontFamily: "monospace" }}
                disabled={isPending}
              />
            </div>
          )}

          {/* Class */}
          <ClassSelector
            classes={classes}
            value={form.classId ?? undefined}
            onChange={(value) =>
              setForm({ ...form, classId: value ?? undefined })
            }
            label={isEditing ? "Class assignment" : "Class"}
            optional={!isEditing}
          />

          {/* Ordering enabled — edit mode only */}
          {isEditing && (
            <label
              className="flex cursor-pointer items-center gap-3 rounded-lg border p-3 transition-colors hover:bg-(--bg-tertiary)"
              style={{
                borderColor: "var(--border-input)",
                background: "var(--bg-secondary)",
              }}
            >
              <input
                type="checkbox"
                checked={form.orderingEnabled}
                onChange={(e) =>
                  setForm({ ...form, orderingEnabled: e.target.checked })
                }
                className="accent-(--accent) h-4 w-4 shrink-0"
                disabled={isPending}
              />
              <div>
                <p
                  className="text-sm font-medium"
                  style={{ color: "var(--text-primary)" }}
                >
                  Ordering enabled
                </p>
                <p className="text-xs" style={{ color: "var(--text-muted)" }}>
                  Allow meal placements for this profile
                </p>
              </div>
            </label>
          )}
        </div>

        {/* Actions */}
        <div className="flex gap-2 mt-5">
          <button
            onClick={handleClose}
            disabled={isPending}
            className="flex-1 py-2 rounded-lg text-sm font-medium disabled:opacity-50"
            style={{
              background: "var(--bg-tertiary)",
              color: "var(--text-secondary)",
              border: "1px solid var(--border-input)",
            }}
          >
            Cancel
          </button>
          <button
            onClick={handleSubmit}
            disabled={isPending || !canSubmit}
            className="flex-1 py-2 rounded-lg text-sm font-medium flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
            style={{ background: "var(--accent)", color: "var(--accent-text)" }}
          >
            {isPending && <Loader2 size={14} className="animate-spin" />}
            {isPending ?
              isEditing ?
                "Saving…"
              : "Adding…"
            : isEditing ?
              "Save changes"
            : "Add student"}
          </button>
        </div>
      </div>
    </div>,
    document.body,
  );
}
