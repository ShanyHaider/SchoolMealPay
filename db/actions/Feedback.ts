"use server";

import { db } from "@/drizzle/db";
import { mealFeedbackTable, systemFeedbackTable } from "@/drizzle/schema";
import { eq, and } from "drizzle-orm";
import {
  revalidateMealFeedbackCache,
  revalidateSystemFeedbackCache,
} from "@/lib/cacheRevalidation";

/**
 * Submit a star rating + optional comment for a meal order.
 * Parents rate meals after their child has collected the order.
 * Idempotent — updates if feedback already exists for the same order.
 *
 * Schema columns: orderId, studentId, userId (parent's user id), rating, comment
 * No menuItemId or parentId columns on mealFeedbackTable.
 */
export async function submitMealFeedback(data: {
  orderId: string;
  userId: string; // parent's users.id (not clerkId)
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
}

/**
 * Submit a bug report or feature request from any user.
 *
 * Schema enum for type: "meal" | "system" | "feature_request" | "bug_report"
 */
export async function submitSystemFeedback(data: {
  userId: string;
  type: "meal" | "system" | "feature_request" | "bug_report";
  message: string;
}) {
  await db.insert(systemFeedbackTable).values(data);
  revalidateSystemFeedbackCache(data.userId);
}
