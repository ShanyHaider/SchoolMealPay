"use client";

import { useEffect, useState, useTransition } from "react";
import { MessageCircle, RefreshCw, AlertTriangle } from "lucide-react";
import { generateFeedbackSentiment } from "@/db/actions/admin/FeedbackSentiment";

export function FeedbackSentimentPanel({ canteenId }: { canteenId: string }) {
  const [data, setData] = useState<Awaited<ReturnType<typeof generateFeedbackSentiment>> | null>(null);
  const [isPending, startTransition] = useTransition();

  function load() {
    startTransition(async () => setData(await generateFeedbackSentiment(canteenId)));
  }
  useEffect(() => { load(); }, []);

  const summary = data?.summary;

  return (
    <div className="bg-(--bg-card) border border-(--border-card) rounded-3xl p-6 space-y-5">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <MessageCircle size={15} className="text-violet-500" />
          <span className="text-xs font-bold uppercase tracking-widest text-(--text-muted)">
            Feedback Sentiment (30d)
          </span>
        </div>
        {!isPending && (
          <button onClick={load} className="text-(--text-muted) hover:text-(--text-primary)">
            <RefreshCw size={13} />
          </button>
        )}
      </div>

      {isPending && <div className="h-24 bg-(--bg-tertiary) rounded-xl animate-pulse" />}

      {!isPending && (!summary) && (
        <p className="text-xs text-(--text-muted)">No feedback comments in this period yet.</p>
      )}

      {!isPending && summary && (
        <>
          <div className="grid grid-cols-3 gap-3">
            <div className="text-center p-3 bg-emerald-50 dark:bg-emerald-500/10 rounded-xl">
              <p className="text-lg font-bold text-emerald-600">{summary.positive}</p>
              <p className="text-[10px] text-(--text-muted) uppercase">Positive</p>
            </div>
            <div className="text-center p-3 bg-(--bg-tertiary) rounded-xl">
              <p className="text-lg font-bold text-(--text-primary)">{summary.neutral}</p>
              <p className="text-[10px] text-(--text-muted) uppercase">Neutral</p>
            </div>
            <div className="text-center p-3 bg-red-50 dark:bg-red-500/10 rounded-xl">
              <p className="text-lg font-bold text-red-600">{summary.negative}</p>
              <p className="text-[10px] text-(--text-muted) uppercase">Negative</p>
            </div>
          </div>

          {summary.topNegativeThemes.length > 0 && (
            <div className="space-y-2 pt-2 border-t border-(--border-card)">
              <div className="flex items-center gap-1.5">
                <AlertTriangle size={12} className="text-amber-500" />
                <p className="text-xs font-bold uppercase tracking-widest text-(--text-muted)">
                  Recurring Complaint Themes
                </p>
              </div>
              <div className="flex gap-1.5 flex-wrap">
                {summary.topNegativeThemes.map((t) => (
                  <span key={t} className="text-[11px] px-2.5 py-1 rounded-full bg-red-50 dark:bg-red-500/10 text-red-600 font-medium">
                    {t}
                  </span>
                ))}
              </div>
            </div>
          )}
        </>
      )}
    </div>
  );
}