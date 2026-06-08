// app/(dashboard)/school-admin/students/page.tsx

import { auth } from "@clerk/nextjs/server";
import { redirect } from "next/navigation";
import { getUserFromDb } from "@/features/users/queries";
import {
  getAllStudents,
  getPendingParentLinks,
  getAllClasses,
} from "@/db/queries/Admin";
import { StudentsClient } from "./_components/StudentsClient";

export default async function StudentsPage() {
  // Role guard — layout handles school_admin check, but belt-and-suspenders
  // here ensures direct URL access is also protected
  const { userId } = await auth();
  if (!userId) redirect("/sign-in");

  const dbUser = await getUserFromDb(userId);
  if (!dbUser || dbUser.role !== "school_admin") redirect("/");

  const [students, pendingLinks, classes] = await Promise.all([
    getAllStudents(),
    getPendingParentLinks(),
    getAllClasses(),
  ]);

  return (
    <div className="max-w-7xl mx-auto space-y-6">
      <div>
        <h1
          className="text-2xl font-bold tracking-tight"
          style={{ color: "var(--text-primary)" }}
        >
          Students
        </h1>
        <p className="text-sm mt-1" style={{ color: "var(--text-secondary)" }}>
          {students.length} enrolled
          {pendingLinks.length > 0 && (
            <span style={{ color: "#ef4444" }}>
              {" "}· {pendingLinks.length} pending parent link
              {pendingLinks.length !== 1 ? "s" : ""}
            </span>
          )}
        </p>
      </div>

      <StudentsClient
        students={students}
        pendingLinks={pendingLinks}
        classes={classes}
      />
    </div>
  );
}