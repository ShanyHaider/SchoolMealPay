"use server";

import { db } from "@/drizzle/db";
import {
  parentChildLinksTable,
  studentsTable,
  usersTable,
} from "@/drizzle/schema";
import { eq, and } from "drizzle-orm";
import { assertRole } from "@/lib/guards/serverGuards";
import {
  revalidateParentChildLinkCache,
} from "@/lib/cacheRevalidation";
import { notify } from "@/lib/notification/notify";
import { PushEvents } from "@/lib/notification/webpush";

// ─── Parent Link Approvals ─────────────────────────────────────────────────────

export async function resolveParentLink(
  linkId: string,
  decision: "approved" | "rejected",
) {
  await assertRole(["school_admin"]);

  if (!linkId || !["approved", "rejected"].includes(decision)) {
    throw new Error("Invalid link resolution parameters.");
  }

  const link = await db.query.parentChildLinksTable.findFirst({
    where: eq(parentChildLinksTable.id, linkId),
  });
  if (!link) return;

  await db
    .update(parentChildLinksTable)
    .set({ status: decision })
    .where(eq(parentChildLinksTable.id, linkId));

  revalidateParentChildLinkCache(link.parentId, link.studentId);

  // Fetch student name for notification copy
  const student = await db.query.studentsTable.findFirst({
    where: eq(studentsTable.id, link.studentId),
    columns: { name: true },
  });
  const studentName = student?.name ?? "the student";

  // Notify the parent of the outcome
  notify({
    userId: link.parentId,
    type: `parent_link_${decision}`,
    event:
      decision === "approved"
        ? PushEvents.linkApproved(studentName)
        : PushEvents.linkRejected(studentName),
  }).catch(console.error);
}

// ─── School Admin: notify when a parent requests a link ───────────────────────
// Called from Students.ts after requestParentChildLink / requestParentChildLinkByCode
// so the school admin sees pending requests in real time.

export async function notifyAdminLinkRequested(
  parentId: string,
  studentId: string,
) {
  const [parent, student, adminUsers] = await Promise.all([
    db.query.usersTable.findFirst({
      where: eq(usersTable.id, parentId),
      columns: { name: true },
    }),
    db.query.studentsTable.findFirst({
      where: eq(studentsTable.id, studentId),
      columns: { name: true },
    }),
    db.query.usersTable.findMany({
      // Single-tenant: all school_admin users receive the notification
      where: eq(usersTable.role, "school_admin"),
      columns: { id: true },
    }),
  ]);

  const parentName = parent?.name ?? "A parent";
  const studentName = student?.name ?? "a student";

  await Promise.all(
    adminUsers.map((admin) =>
      notify({
        userId: admin.id,
        type: "parent_link_requested",
        event: PushEvents.admin.linkRequested(parentName, studentName),
      }).catch(console.error),
    ),
  );
}