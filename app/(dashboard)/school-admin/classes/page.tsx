// app/(dashboard)/school-admin/classes/page.tsx

import { auth } from "@clerk/nextjs/server";
import { redirect } from "next/navigation";
import { getUserFromDb } from "@/features/users/queries";
import { getAllClasses } from "@/db/queries/Admin";
import { ClassesClient } from "./_components/ClassesClient";

export default async function ClassesPage() {
  const { userId } = await auth();
  if (!userId) redirect("/sign-in");

  const dbUser = await getUserFromDb(userId);
  if (!dbUser || dbUser.role !== "school_admin") redirect("/");

  const classes = await getAllClasses();

  return (
    <div className="max-w-6xl mx-auto space-y-6">
      <div>
        <h1
          className="text-2xl font-bold tracking-tight"
          style={{ color: "var(--text-primary)" }}
        >
          Classes
        </h1>
        <p className="text-sm mt-1" style={{ color: "var(--text-secondary)" }}>
          Manage grades and sections. Students are assigned to classes.
        </p>
      </div>
      <ClassesClient classes={classes} />
    </div>
  );
}