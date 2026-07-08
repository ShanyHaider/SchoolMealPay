"use server";

import { db } from "@/drizzle/db";
import { mealFeedbackTable } from "@/drizzle/schema";
import { eq } from "drizzle-orm";
import { getFeedbackForSentiment } from "@/db/queries/AdminForecast";
import { fetchFeedbackSentiment } from "@/lib/flaskClient";

export async function generateFeedbackSentiment(canteenId: string) {
  const feedback = await getFeedbackForSentiment(canteenId);
  if (feedback.length === 0) return { results: [], summary: null };

  const data = await fetchFeedbackSentiment(feedback);

  // Persist flags — best-effort only. A transient DB hiccup here shouldn't
  // break the sentiment panel, since the analysis itself already succeeded.
  const flaggedIds = data.results.filter((r) => r.flagged).map((r) => r.id);
  if (flaggedIds.length > 0) {
    try {
      await Promise.all(
        flaggedIds.map((id) =>
          db
            .update(mealFeedbackTable)
            .set({ isFlagged: true })
            .where(eq(mealFeedbackTable.id, id)),
        ),
      );
    } catch (err) {
      console.error(
        "[generateFeedbackSentiment] Failed to persist isFlagged, continuing:",
        err,
      );
    }
  }

  return data;
}
