"use client";

import { useState, useTransition } from "react";
import {
  createStudent,
  deleteStudent,
  updateStudent,
  resolveParentLink,
} from "@/db/actions/Admin";
import {
  Search,
  Plus,
  Trash2,
  CheckCircle,
  XCircle,
  ChevronDown,
  UserPlus,
  AlertCircle,
} from "lucide-react";

const ALLERGEN_COLORS: Record<string, string> = {
  nuts: "#f59e0b",
  gluten: "#f97316",
  dairy: "#3b82f6",
  eggs: "#eab308",
  soy: "#84cc16",
  shellfish: "#06b6d4",
  fish: "#6366f1",
};

export function StudentsClient({
  students,
  pendingLinks,
  classes,
}: {
  students: any[];
  pendingLinks: any[];
  classes: any[];
}) {
  const [tab, setTab] = useState<"students" | "pending">("students");
  const [search, setSearch] = useState("");
  const [showAdd, setShowAdd] = useState(false);
  const [isPending, startTransition] = useTransition();

  // Add student form state
  const [form, setForm] = useState({
    name: "",
    studentCode: "",
    classId: "",
  });
  const [formError, setFormError] = useState("");

  const filtered = students.filter(
    (s) =>
      s.name.toLowerCase().includes(search.toLowerCase()) ||
      s.studentCode.toLowerCase().includes(search.toLowerCase()) ||
      s.class?.grade?.toLowerCase().includes(search.toLowerCase()),
  );

  const handleAddStudent = () => {
    if (!form.name.trim() || !form.studentCode.trim()) {
      setFormError("Name and student code are required.");
      return;
    }
    setFormError("");
    startTransition(async () => {
      await createStudent({
        name: form.name.trim(),
        studentCode: form.studentCode.trim(),
        classId: form.classId || undefined,
      });
      setForm({ name: "", studentCode: "", classId: "" });
      setShowAdd(false);
    });
  };

  const handleDelete = (id: string) => {
    if (!confirm("Delete this student? This cannot be undone.")) return;
    startTransition(async () => {
      await deleteStudent(id);
    });
  };

  const handleResolveLink = (id: string, decision: "approved" | "rejected") => {
    startTransition(async () => {
      await resolveParentLink(id, decision);
    });
  };

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

  const selectStyle = {
    ...inputStyle,
    cursor: "pointer",
  };

  return (
    <div className="space-y-4">
      {/* Tabs + controls */}
      <div className="flex flex-col sm:flex-row sm:items-center gap-3">
        <div
          className="flex rounded-lg p-1 gap-1"
          style={{ background: "var(--bg-pill)" }}
        >
          {(["students", "pending"] as const).map((t) => (
            <button
              key={t}
              onClick={() => setTab(t)}
              className="px-4 py-1.5 rounded-md text-sm font-medium transition-all capitalize"
              style={{
                background: tab === t ? "var(--bg-pill-active)" : "transparent",
                color:
                  tab === t ? "var(--text-primary)" : "var(--text-secondary)",
                boxShadow: tab === t ? "var(--shadow-pill)" : undefined,
              }}
            >
              {t === "pending" ?
                `Pending Links (${pendingLinks.length})`
              : "All Students"}
            </button>
          ))}
        </div>

        <div className="flex items-center gap-2 ml-auto">
          {tab === "students" && (
            <>
              <div className="relative">
                <Search
                  size={14}
                  className="absolute left-3 top-1/2 -translate-y-1/2"
                  style={{ color: "var(--text-muted)" }}
                />
                <input
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  placeholder="Search students..."
                  className="pl-9 pr-4 py-2 text-sm rounded-lg"
                  style={{
                    background: "var(--bg-secondary)",
                    border: "1px solid var(--border-input)",
                    color: "var(--text-primary)",
                    outline: "none",
                    width: 220,
                  }}
                />
              </div>
              <button
                onClick={() => setShowAdd(true)}
                className="flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-all"
                style={{
                  background: "var(--accent)",
                  color: "var(--accent-text)",
                  boxShadow: "var(--shadow-btn)",
                }}
              >
                <Plus size={15} />
                Add Student
              </button>
            </>
          )}
        </div>
      </div>

      {/* Add student modal */}
      {showAdd && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div
            className="absolute inset-0"
            style={{ background: "rgba(0,0,0,0.5)" }}
            onClick={() => setShowAdd(false)}
          />
          <div
            className="relative w-full max-w-md rounded-2xl p-6 z-10"
            style={{
              background: "var(--bg-card)",
              border: "1px solid var(--border-card)",
              boxShadow: "var(--shadow-card)",
            }}
          >
            <h2
              className="text-lg font-semibold mb-5"
              style={{ color: "var(--text-primary)" }}
            >
              Add Student
            </h2>
            {formError && (
              <div
                className="flex items-center gap-2 p-3 rounded-lg mb-4 text-sm"
                style={{ background: "rgba(239,68,68,0.1)", color: "#ef4444" }}
              >
                <AlertCircle size={14} /> {formError}
              </div>
            )}
            <div className="space-y-3">
              <div>
                <label
                  className="block text-xs font-medium mb-1.5"
                  style={{ color: "var(--text-secondary)" }}
                >
                  Full Name *
                </label>
                <input
                  value={form.name}
                  onChange={(e) => setForm({ ...form, name: e.target.value })}
                  placeholder="e.g. Ahmed Khan"
                  style={inputStyle}
                />
              </div>
              <div>
                <label
                  className="block text-xs font-medium mb-1.5"
                  style={{ color: "var(--text-secondary)" }}
                >
                  Student Code *
                </label>
                <input
                  value={form.studentCode}
                  onChange={(e) =>
                    setForm({ ...form, studentCode: e.target.value })
                  }
                  placeholder="e.g. STU-2024-001"
                  style={inputStyle}
                />
              </div>
              <div>
                <label
                  className="block text-xs font-medium mb-1.5"
                  style={{ color: "var(--text-secondary)" }}
                >
                  Class (optional)
                </label>
                <select
                  value={form.classId}
                  onChange={(e) =>
                    setForm({ ...form, classId: e.target.value })
                  }
                  style={selectStyle}
                >
                  <option value="">No class assigned</option>
                  {classes.map((cls) => (
                    <option key={cls.id} value={cls.id}>
                      Grade {cls.grade} — Section {cls.section}
                    </option>
                  ))}
                </select>
              </div>
            </div>
            <div className="flex gap-2 mt-5">
              <button
                onClick={() => {
                  setShowAdd(false);
                  setFormError("");
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
                onClick={handleAddStudent}
                disabled={isPending}
                className="flex-1 py-2 rounded-lg text-sm font-medium disabled:opacity-50 transition-all"
                style={{
                  background: "var(--accent)",
                  color: "var(--accent-text)",
                }}
              >
                {isPending ? "Adding..." : "Add Student"}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Students list */}
      {tab === "students" && (
        <div
          className="rounded-xl border overflow-hidden"
          style={{
            background: "var(--bg-card)",
            borderColor: "var(--border-card)",
            boxShadow: "var(--shadow-card)",
          }}
        >
          {filtered.length === 0 ?
            <div className="py-16 text-center">
              <UserPlus
                size={32}
                className="mx-auto mb-3"
                style={{ color: "var(--text-muted)" }}
              />
              <p className="text-sm" style={{ color: "var(--text-secondary)" }}>
                {search ?
                  "No students match your search."
                : "No students enrolled yet."}
              </p>
            </div>
          : <table className="w-full text-sm">
              <thead>
                <tr style={{ borderBottom: "1px solid var(--border-primary)" }}>
                  {[
                    "Student",
                    "Code",
                    "Class",
                    "Allergens",
                    "Parents",
                    "Ordering",
                    "",
                  ].map((h) => (
                    <th
                      key={h}
                      className="px-4 py-3 text-left text-xs font-medium"
                      style={{ color: "var(--text-muted)" }}
                    >
                      {h}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {filtered.map((student, i) => (
                  <tr
                    key={student.id}
                    className="transition-colors hover:bg-(--bg-secondary)"
                    style={{
                      borderBottom:
                        i < filtered.length - 1 ?
                          "1px solid var(--border-primary)"
                        : undefined,
                    }}
                  >
                    <td className="px-4 py-3">
                      <div
                        className="font-medium"
                        style={{ color: "var(--text-primary)" }}
                      >
                        {student.name}
                      </div>
                    </td>
                    <td className="px-4 py-3">
                      <span
                        className="font-mono text-xs px-2 py-0.5 rounded"
                        style={{
                          background: "var(--bg-tertiary)",
                          color: "var(--text-secondary)",
                        }}
                      >
                        {student.studentCode}
                      </span>
                    </td>
                    <td
                      className="px-4 py-3"
                      style={{ color: "var(--text-secondary)" }}
                    >
                      {student.class ?
                        `Grade ${student.class.grade} — ${student.class.section}`
                      : "—"}
                    </td>
                    <td className="px-4 py-3">
                      <div className="flex flex-wrap gap-1">
                        {student.allergens?.length > 0 ?
                          student.allergens.slice(0, 3).map((a: any) => (
                            <span
                              key={a.allergen}
                              className="px-1.5 py-0.5 rounded text-xs font-medium capitalize"
                              style={{
                                background: `${ALLERGEN_COLORS[a.allergen] ?? "#6b7280"}20`,
                                color: ALLERGEN_COLORS[a.allergen] ?? "#6b7280",
                              }}
                            >
                              {a.allergen}
                            </span>
                          ))
                        : <span style={{ color: "var(--text-muted)" }}>—</span>}
                        {student.allergens?.length > 3 && (
                          <span
                            className="text-xs"
                            style={{ color: "var(--text-muted)" }}
                          >
                            +{student.allergens.length - 3}
                          </span>
                        )}
                      </div>
                    </td>
                    <td
                      className="px-4 py-3"
                      style={{ color: "var(--text-secondary)" }}
                    >
                      {student.parentLinks?.filter(
                        (l: any) => l.status === "approved",
                      ).length ?? 0}{" "}
                      linked
                    </td>
                    <td className="px-4 py-3">
                      <span
                        className="px-2 py-0.5 rounded-full text-xs font-medium"
                        style={
                          student.orderingEnabled ?
                            {
                              background: "rgba(34,197,94,0.12)",
                              color: "#22c55e",
                            }
                          : {
                              background: "rgba(239,68,68,0.12)",
                              color: "#ef4444",
                            }
                        }
                      >
                        {student.orderingEnabled ? "Enabled" : "Disabled"}
                      </span>
                    </td>
                    <td className="px-4 py-3">
                      <button
                        onClick={() => handleDelete(student.id)}
                        className="p-1.5 rounded-lg transition-colors hover:bg-red-50"
                        title="Delete student"
                      >
                        <Trash2 size={14} style={{ color: "#ef4444" }} />
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          }
        </div>
      )}

      {/* Pending links tab */}
      {tab === "pending" && (
        <div
          className="rounded-xl border overflow-hidden"
          style={{
            background: "var(--bg-card)",
            borderColor: "var(--border-card)",
            boxShadow: "var(--shadow-card)",
          }}
        >
          {pendingLinks.length === 0 ?
            <div className="py-16 text-center">
              <CheckCircle
                size={32}
                className="mx-auto mb-3"
                style={{ color: "#22c55e" }}
              />
              <p className="text-sm" style={{ color: "var(--text-muted)" }}>
                No pending link requests.
              </p>
            </div>
          : <div
              className="divide-y"
              style={{ borderColor: "var(--border-primary)" }}
            >
              {pendingLinks.map((link) => (
                <div
                  key={link.id}
                  className="px-5 py-4 flex items-center justify-between gap-4"
                >
                  <div className="flex items-center gap-4">
                    <div
                      className="w-9 h-9 rounded-full flex items-center justify-center text-sm font-bold flex-shrink-0"
                      style={{
                        background: "var(--bg-tertiary)",
                        color: "var(--text-secondary)",
                      }}
                    >
                      {link.parent?.name?.[0]?.toUpperCase() ?? "P"}
                    </div>
                    <div>
                      <p
                        className="text-sm font-medium"
                        style={{ color: "var(--text-primary)" }}
                      >
                        {link.parent?.name}
                        <span
                          className="ml-2 font-normal"
                          style={{ color: "var(--text-muted)" }}
                        >
                          wants to link to
                        </span>{" "}
                        {link.student?.name}
                      </p>
                      <p
                        className="text-xs"
                        style={{ color: "var(--text-muted)" }}
                      >
                        {link.parent?.email} · Student code:{" "}
                        <span className="font-mono">
                          {link.student?.studentCode}
                        </span>
                      </p>
                    </div>
                  </div>
                  <div className="flex gap-2 flex-shrink-0">
                    <button
                      onClick={() => handleResolveLink(link.id, "approved")}
                      disabled={isPending}
                      className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium disabled:opacity-50 transition-all"
                      style={{
                        background: "rgba(34,197,94,0.12)",
                        color: "#22c55e",
                        border: "1px solid rgba(34,197,94,0.2)",
                      }}
                    >
                      <CheckCircle size={13} />
                      Approve
                    </button>
                    <button
                      onClick={() => handleResolveLink(link.id, "rejected")}
                      disabled={isPending}
                      className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium disabled:opacity-50 transition-all"
                      style={{
                        background: "rgba(239,68,68,0.12)",
                        color: "#ef4444",
                        border: "1px solid rgba(239,68,68,0.2)",
                      }}
                    >
                      <XCircle size={13} />
                      Reject
                    </button>
                  </div>
                </div>
              ))}
            </div>
          }
        </div>
      )}
    </div>
  );
}
