import {
  getAllStudents,
  getPendingParentLinks,
  getAllClasses,
} from "@/db/queries/Admin";
import { StudentsClient } from "./_components/StudentsClient";

export default async function StudentsPage() {
  const [students, pendingLinks, classes] = await Promise.all([
    getAllStudents(),
    getPendingParentLinks(),
    getAllClasses(),
  ]);

  return (
    <div className="max-w-7xl mx-auto space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1
            className="text-2xl font-bold tracking-tight"
            style={{ color: "var(--text-primary)" }}
          >
            Students
          </h1>
          <p
            className="text-sm mt-1"
            style={{ color: "var(--text-secondary)" }}
          >
            {students.length} enrolled · {pendingLinks.length} pending parent
            links
          </p>
        </div>
      </div>

      <StudentsClient
        students={students}
        pendingLinks={pendingLinks}
        classes={classes}
      />
    </div>
  );
}
