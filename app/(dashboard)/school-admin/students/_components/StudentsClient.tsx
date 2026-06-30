"use client";

import { useRef, useState, useTransition } from "react";
import { Search, Plus, Upload, Loader2, UserPlus } from "lucide-react";
import { createStudent } from "@/db/actions/admin/Student";
import type {
  getAllStudents,
  getPendingParentLinks,
  getAllClasses,
} from "@/db/queries/Admin";
import { StudentRow } from "./StudentRow";
import { StudentModal } from "./StudentModal";
import { PendingLinksPanel } from "./PendingLinksPanel";
import { ServerError, isValidUrl } from "./Shared";
import { useToast, ToastContainer } from "../../../../../components/useToast";

type Student = Awaited<ReturnType<typeof getAllStudents>>[number];
type PendingLink = Awaited<ReturnType<typeof getPendingParentLinks>>[number];
type Class = Awaited<ReturnType<typeof getAllClasses>>[number];

interface StudentsClientProps {
  students: Student[];
  pendingLinks: PendingLink[];
  classes: Class[];
}

export function StudentsClient({
  students,
  pendingLinks,
  classes,
}: StudentsClientProps) {
  const [tab, setTab] = useState<"students" | "pending">("students");
  const [search, setSearch] = useState("");
  const [showAdd, setShowAdd] = useState(false);
  const [editingStudent, setEditingStudent] = useState<Student | null>(null);
  const [csvError, setCsvError] = useState("");
  const [isCsvPending, startCsvTransition] = useTransition();
  const fileInputRef = useRef<HTMLInputElement>(null);

  const { toasts, toast, dismiss } = useToast();

  const filtered = students.filter(
    (s) =>
      s.name.toLowerCase().includes(search.toLowerCase()) ||
      s.studentCode.toLowerCase().includes(search.toLowerCase()) ||
      s.class?.grade?.toLowerCase().includes(search.toLowerCase()),
  );

  const handleCsvUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setCsvError("");
    const reader = new FileReader();

    reader.onload = async (event) => {
      const text = event.target?.result as string;
      if (!text) return;

      const lines = text
        .split(/\r?\n/)
        .map((l) => l.trim())
        .filter(Boolean);

      if (lines.length <= 1) {
        setCsvError("The selected CSV file has no student data records.");
        return;
      }

      const headers = lines[0]
        .toLowerCase()
        .split(",")
        .map((h) => h.trim().replace(/["']/g, ""));

      const nameIdx = headers.indexOf("name");
      const codeIdx = headers.indexOf("studentcode");
      const gradeIdx = headers.indexOf("grade");
      const sectionIdx = headers.indexOf("section");
      const imageIdx = headers.findIndex(
        (h) =>
          h === "imageurl" || h === "image" || h === "avatar" || h === "photo",
      );

      if (nameIdx === -1 || codeIdx === -1) {
        setCsvError("CSV missing required columns: 'name' and 'studentCode'.");
        return;
      }

      startCsvTransition(async () => {
        let successCount = 0;
        const errors: string[] = [];

        for (let i = 1; i < lines.length; i++) {
          const row = lines[i]
            .split(",")
            .map((cell) => cell.trim().replace(/["']/g, ""));

          if (row.length < 2) continue;

          const studentName = row[nameIdx];
          const rawCode = row[codeIdx];

          if (!studentName || !rawCode) {
            errors.push(`Row ${i + 1}: missing required values.`);
            continue;
          }

          const imageUrl =
            imageIdx !== -1 && row[imageIdx] && isValidUrl(row[imageIdx]) ?
              row[imageIdx]
            : null;

          let classId: string | undefined;
          if (gradeIdx !== -1 && sectionIdx !== -1) {
            const matched = classes.find(
              (c) =>
                c.grade.toLowerCase() === row[gradeIdx]?.toLowerCase() &&
                c.section.toLowerCase() === row[sectionIdx]?.toLowerCase(),
            );
            if (matched) classId = matched.id;
          }

          try {
            await createStudent({
              name: studentName,
              studentCode: rawCode.toUpperCase(),
              classId,
              imageUrl,
              allergenIds: [],
            });
            successCount++;
          } catch (err: any) {
            errors.push(
              `Row ${i + 1} (${studentName}): ${err?.message ?? "insertion failed"}`,
            );
          }
        }

        if (errors.length > 0) {
          setCsvError(
            `Imported ${successCount} students. Failures:\n${errors.slice(0, 3).join("; ")}`,
          );
        } else {
          setCsvError("");
          toast(
            successCount === 1 ?
              "1 student imported successfully."
            : `${successCount} students imported successfully.`,
            "success",
          );
        }

        if (fileInputRef.current) fileInputRef.current.value = "";
      });
    };

    reader.readAsText(file);
  };

  return (
    <>
      <div className="space-y-4 max-w-full overflow-hidden">
        {csvError && <ServerError message={csvError} />}

        {/* Tab Controls + Actions Toolbar */}
        <div className="flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
          <div
            className="flex rounded-lg p-1 w-full lg:w-auto"
            style={{ background: "var(--bg-tertiary)" }}
          >
            {(["students", "pending"] as const).map((t) => (
              <button
                key={t}
                onClick={() => setTab(t)}
                className="flex-1 lg:flex-none text-center rounded-md px-4 py-1.5 text-sm font-medium transition-all capitalize cursor-pointer"
                style={{
                  background: tab === t ? "var(--bg-card)" : "transparent",
                  color:
                    tab === t ? "var(--text-primary)" : "var(--text-secondary)",
                  boxShadow: tab === t ? "var(--shadow-card)" : undefined,
                }}
              >
                {t === "pending" ?
                  `Pending (${pendingLinks.length})`
                : "All students"}
              </button>
            ))}
          </div>

          {tab === "students" && (
            <div className="grid grid-cols-1 gap-2 sm:flex sm:items-center sm:w-full lg:w-auto">
              {/* Search */}
              <div
                className="flex items-center gap-2 rounded-lg border px-3 py-1.5 w-full sm:w-64"
                style={{
                  borderColor: "var(--border-input)",
                  background: "var(--bg-secondary)",
                }}
              >
                <Search
                  size={14}
                  className="shrink-0"
                  style={{ color: "var(--text-muted)" }}
                />
                <input
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  placeholder="Search students…"
                  className="bg-transparent text-sm outline-hidden w-full"
                  style={{ color: "var(--text-primary)" }}
                />
              </div>

              {/* Action buttons */}
              <div className="grid grid-cols-2 gap-2 sm:flex sm:items-center">
                <input
                  type="file"
                  ref={fileInputRef}
                  accept=".csv"
                  onChange={handleCsvUpload}
                  className="hidden"
                  id="student-csv-file"
                  disabled={isCsvPending}
                />
                <label
                  htmlFor="student-csv-file"
                  className="flex items-center justify-center gap-2 rounded-lg border px-3 py-2 text-sm font-medium cursor-pointer transition-all hover:bg-(--bg-secondary)"
                  style={{
                    borderColor: "var(--border-input)",
                    color: "var(--text-secondary)",
                  }}
                >
                  {isCsvPending ?
                    <Loader2 size={14} className="animate-spin" />
                  : <Upload size={14} />}
                  <span>Import CSV</span>
                </label>

                <button
                  onClick={() => setShowAdd(true)}
                  className="flex items-center justify-center gap-2 rounded-lg px-4 py-2 text-sm font-medium cursor-pointer"
                  style={{
                    background: "var(--accent)",
                    color: "var(--accent-text)",
                  }}
                >
                  <Plus size={15} /> <span>Add</span>
                </button>
              </div>
            </div>
          )}
        </div>

        {/* Student list */}
        {tab === "students" && (
          <div
            className="rounded-xl border overflow-hidden w-full"
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
                <p
                  className="text-sm"
                  style={{ color: "var(--text-secondary)" }}
                >
                  {search ?
                    "No students match your search."
                  : "No students enrolled yet."}
                </p>
              </div>
            : <div className="w-full">
                {/* Desktop table */}
                <div className="hidden md:block overflow-x-auto">
                  <table className="w-full text-sm">
                    <thead>
                      <tr
                        style={{
                          borderBottom: "1px solid var(--border-primary)",
                        }}
                      >
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
                            className="px-4 py-3 text-left text-xs font-medium tracking-wider"
                            style={{ color: "var(--text-muted)" }}
                          >
                            {h}
                          </th>
                        ))}
                      </tr>
                    </thead>
                    <tbody>
                      {filtered.map((student) => (
                        <StudentRow
                          key={student.id}
                          student={student}
                          classes={classes}
                          toast={toast}
                          viewMode="table"
                          onEdit={setEditingStudent}
                        />
                      ))}
                    </tbody>
                  </table>
                </div>

                {/* Mobile cards */}
                <div
                  className="md:hidden divide-y"
                  style={{ borderColor: "var(--border-primary)" }}
                >
                  {filtered.map((student) => (
                    <StudentRow
                      key={student.id}
                      student={student}
                      classes={classes}
                      toast={toast}
                      viewMode="card"
                      onEdit={setEditingStudent}
                    />
                  ))}
                </div>
              </div>
            }
          </div>
        )}

        {tab === "pending" && (
          <PendingLinksPanel links={pendingLinks} toast={toast} />
        )}
      </div>

      {/* Add modal */}
      {showAdd && (
        <StudentModal
          classes={classes}
          onClose={() => setShowAdd(false)}
          onSuccess={(msg) => {
            toast(msg, "success");
            setShowAdd(false);
          }}
          onError={(msg) => toast(msg, "error")}
        />
      )}

      {/* Edit modal */}
      {editingStudent && (
        <StudentModal
          student={editingStudent}
          classes={classes}
          onClose={() => setEditingStudent(null)}
          onSuccess={(msg) => {
            toast(msg, "success");
            setEditingStudent(null);
          }}
          onError={(msg) => toast(msg, "error")}
        />
      )}

      <ToastContainer toasts={toasts} dismiss={dismiss} />
    </>
  );
}
