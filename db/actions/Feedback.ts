"use server";

import { db } from "@/drizzle/db";
import {
  mealFeedbackTable,
  systemFeedbackTable,
  studentsTable,
  usersTable,
} from "@/drizzle/schema";
import { eq } from "drizzle-orm";
import {
  revalidateMealFeedbackCache,
  revalidateSystemFeedbackCache,
} from "@/lib/cacheRevalidation";
import { notify } from "@/lib/notification/notify";
import { PushEvents } from "@/lib/notification/webpush";

// ── Helpers ────────────────────────────────────────────────────────────────────

async function getSchoolAdminIds(): Promise<string[]> {
  const admins = await db.query.usersTable.findMany({
    where: eq(usersTable.role, "school_admin"),
    columns: { id: true },
  });
  return admins.map((a) => a.id);
}

// ── submitMealFeedback ─────────────────────────────────────────────────────────

export async function submitMealFeedback(data: {
  orderId: string;
  userId: string;
  studentId: string;
  rating: 1 | 2 | 3 | 4 | 5;
  comment?: string;
}) {
  const existing = await db.query.mealFeedbackTable.findFirst({
    where: eq(mealFeedbackTable.orderId, data.orderId),
  });

  if (existing) {
    await db
      .update(mealFeedbackTable)
      .set({ rating: data.rating, comment: data.comment ?? null })
      .where(eq(mealFeedbackTable.id, existing.id));
  } else {
    await db.insert(mealFeedbackTable).values({
      orderId: data.orderId,
      userId: data.userId,
      studentId: data.studentId,
      rating: data.rating,
      comment: data.comment,
    });
  }

  revalidateMealFeedbackCache(data.orderId, data.studentId);

  // Alert school admins for low ratings (1 or 2 stars)
  if (data.rating <= 2) {
    const [adminIds, student] = await Promise.all([
      getSchoolAdminIds(),
      db.query.studentsTable.findFirst({
        where: eq(studentsTable.id, data.studentId),
        columns: { name: true },
      }),
    ]);

    const studentName = student?.name ?? "A student";

    await Promise.all(
      adminIds.map((id) =>
        notify({
          userId: id,
          type: "low_rating_feedback",
          event: PushEvents.admin.lowRatingFeedback(studentName, data.rating),
        }).catch(console.error),
      ),
    );
  }
}

// ── submitSystemFeedback ───────────────────────────────────────────────────────

export async function submitSystemFeedback(data: {
  userId: string;
  type: "meal" | "system" | "feature_request" | "bug_report";
  message: string;
}) {
  await db.insert(systemFeedbackTable).values(data);
  revalidateSystemFeedbackCache(data.userId);

  // Notify all school admins — bug reports and feature requests need attention
  const adminIds = await getSchoolAdminIds();

  await Promise.all(
    adminIds.map((id) =>
      notify({
        userId: id,
        type: "system_feedback_submitted",
        event: PushEvents.admin.systemFeedbackSubmitted(data.type),
        // In-app only for feature_request/meal; push for bug_report and system
        channels:
          data.type === "bug_report" || data.type === "system"
            ? ["in_app", "push"]
            : ["in_app"],
      }).catch(console.error),
    ),
  );
}