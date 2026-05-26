"use client";

import { useState, useTransition } from "react";
import { createClass, deleteClass, updateClass } from "@/db/actions/Admin";
import {
  Plus,
  Trash2,
  Pencil,
  GraduationCap,
  AlertCircle,
  Check,
  X,
} from "lucide-react";

export function ClassesClient({ classes }: { classes: any[] }) {
  const [isPending, startTransition] = useTransition();
  const [showAdd, setShowAdd] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [form, setForm] = useState({ grade: "", section: "" });
  const [editForm, setEditForm] = useState({ grade: "", section: "" });
  const [error, setError] = useState("");

  const inputStyle = {
    background: "var(--bg-secondary)",
    border: "1px solid var(--border-input)",
    borderRadius: 8,
    color: "var(--text-primary)",
    fontSize: 13,
    padding: "8px 12px",
    width: "100%",
    outline: "none",
    fontFamily: "inherit",
  } as React.CSSProperties;

  const handleCreate = () => {
    if (!form.grade.trim() || !form.section.trim()) {
      setError("Grade and section are required.");
      return;
    }
    setError("");
    startTransition(async () => {
      await createClass({
        grade: form.grade.trim(),
        section: form.section.trim(),
      });
      setForm({ grade: "", section: "" });
      setShowAdd(false);
    });
  };

  const startEdit = (cls: any) => {
    setEditingId(cls.id);
    setEditForm({ grade: cls.grade, section: cls.section });
  };

  const handleUpdate = (id: string) => {
    startTransition(async () => {
      await updateClass(id, {
        grade: editForm.grade,
        section: editForm.section,
      });
      setEditingId(null);
    });
  };

  const handleDelete = (id: string) => {
    if (
      !confirm(
        "Delete this class? Students in this class will lose their class assignment.",
      )
    )
      return;
    startTransition(async () => {
      await deleteClass(id);
    });
  };

  return (
    <div className="space-y-4">
      <div className="flex justify-end">
        <button
          onClick={() => setShowAdd(true)}
          className="flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium"
          style={{
            background: "var(--accent)",
            color: "var(--accent-text)",
            boxShadow: "var(--shadow-btn)",
          }}
        >
          <Plus size={15} />
          Add Class
        </button>
      </div>

      {/* Add modal */}
      {showAdd && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div
            className="absolute inset-0"
            style={{ background: "rgba(0,0,0,0.5)" }}
            onClick={() => {
              setShowAdd(false);
              setError("");
            }}
          />
          <div
            className="relative w-full max-w-sm rounded-2xl p-6 z-10"
            style={{
              background: "var(--bg-card)",
              border: "1px solid var(--border-card)",
              boxShadow: "var(--shadow-card)",
            }}
          >
            <h2
              className="text-lg font-semibold mb-4"
              style={{ color: "var(--text-primary)" }}
            >
              New Class
            </h2>
            {error && (
              <div
                className="flex items-center gap-2 p-3 rounded-lg mb-3 text-xs"
                style={{ background: "rgba(239,68,68,0.1)", color: "#ef4444" }}
              >
                <AlertCircle size={13} /> {error}
              </div>
            )}
            <div className="space-y-3">
              {[
                { key: "grade", label: "Grade *", placeholder: "e.g. 5" },
                { key: "section", label: "Section *", placeholder: "e.g. A" },
              ].map(({ key, label, placeholder }) => (
                <div key={key}>
                  <label
                    className="block text-xs font-medium mb-1.5"
                    style={{ color: "var(--text-secondary)" }}
                  >
                    {label}
                  </label>
                  <input
                    value={form[key as keyof typeof form]}
                    onChange={(e) =>
                      setForm({ ...form, [key]: e.target.value })
                    }
                    placeholder={placeholder}
                    style={inputStyle}
                  />
                </div>
              ))}
            </div>
            <div className="flex gap-2 mt-4">
              <button
                onClick={() => {
                  setShowAdd(false);
                  setError("");
                }}
                className="flex-1 py-2 rounded-lg text-sm font-medium"
                style={{
                  background: "var(--bg-tertiary)",
                  color: "var(--text-secondary)",
                  border: "1px solid var(--border-input)",
                }}
              >
                Cancel
              </button>
              <button
                onClick={handleCreate}
                disabled={isPending}
                className="flex-1 py-2 rounded-lg text-sm font-medium disabled:opacity-50"
                style={{
                  background: "var(--accent)",
                  color: "var(--accent-text)",
                }}
              >
                {isPending ? "Adding..." : "Add Class"}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Classes grid */}
      {classes.length === 0 ?
        <div
          className="rounded-xl border py-16 text-center"
          style={{
            background: "var(--bg-card)",
            borderColor: "var(--border-card)",
          }}
        >
          <GraduationCap
            size={32}
            className="mx-auto mb-3"
            style={{ color: "var(--text-muted)" }}
          />
          <p className="text-sm" style={{ color: "var(--text-muted)" }}>
            No classes yet. Add your first class.
          </p>
        </div>
      : <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {classes.map((cls) => (
            <div
              key={cls.id}
              className="rounded-xl border p-4 transition-all"
              style={{
                background: "var(--bg-card)",
                borderColor: "var(--border-card)",
                boxShadow: "var(--shadow-card)",
              }}
            >
              {editingId === cls.id ?
                <div className="space-y-2">
                  <input
                    value={editForm.grade}
                    onChange={(e) =>
                      setEditForm({ ...editForm, grade: e.target.value })
                    }
                    placeholder="Grade"
                    style={{ ...inputStyle, fontSize: 12 }}
                  />
                  <input
                    value={editForm.section}
                    onChange={(e) =>
                      setEditForm({ ...editForm, section: e.target.value })
                    }
                    placeholder="Section"
                    style={{ ...inputStyle, fontSize: 12 }}
                  />
                  <div className="flex gap-2 mt-2">
                    <button
                      onClick={() => handleUpdate(cls.id)}
                      disabled={isPending}
                      className="flex-1 flex items-center justify-center gap-1 py-1.5 rounded-lg text-xs font-medium disabled:opacity-50"
                      style={{
                        background: "rgba(34,197,94,0.12)",
                        color: "#22c55e",
                      }}
                    >
                      <Check size={12} /> Save
                    </button>
                    <button
                      onClick={() => setEditingId(null)}
                      className="flex-1 flex items-center justify-center gap-1 py-1.5 rounded-lg text-xs font-medium"
                      style={{
                        background: "var(--bg-tertiary)",
                        color: "var(--text-secondary)",
                      }}
                    >
                      <X size={12} /> Cancel
                    </button>
                  </div>
                </div>
              : <>
                  <div className="flex items-start justify-between mb-3">
                    <div
                      className="w-10 h-10 rounded-lg flex items-center justify-center text-sm font-bold"
                      style={{
                        background: "rgba(139,92,246,0.12)",
                        color: "#8b5cf6",
                      }}
                    >
                      {cls.grade}
                    </div>
                    <div className="flex gap-1">
                      <button
                        onClick={() => startEdit(cls)}
                        className="p-1.5 rounded-lg transition-colors"
                        style={{ color: "var(--text-muted)" }}
                      >
                        <Pencil size={13} />
                      </button>
                      <button
                        onClick={() => handleDelete(cls.id)}
                        className="p-1.5 rounded-lg transition-colors"
                        style={{ color: "#ef4444" }}
                      >
                        <Trash2 size={13} />
                      </button>
                    </div>
                  </div>
                  <h3
                    className="font-semibold text-sm"
                    style={{ color: "var(--text-primary)" }}
                  >
                    Grade {cls.grade} — Section {cls.section}
                  </h3>

                  <p
                    className="text-xs mt-3"
                    style={{ color: "var(--text-muted)" }}
                  >
                    {cls.studentCount} student
                    {cls.studentCount !== 1 ? "s" : ""}
                  </p>
                </>
              }
            </div>
          ))}
        </div>
      }
    </div>
  );
}
