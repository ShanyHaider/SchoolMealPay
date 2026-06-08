"use client";

import { useState, useTransition } from "react";
import { Star, Loader2, CheckCircle2 } from "lucide-react";
import { submitMealFeedback } from "@/db/actions/Feedback";

interface FeedbackWidgetProps {
    orderId: string;
    studentId: string;
    userId: string;
    existing?: {
        rating: number;
        comment?: string | null;
    } | null;
}

export function FeedbackWidget({
    orderId,
    studentId,
    userId,
    existing,
}: FeedbackWidgetProps) {
    const [rating, setRating] = useState<number>(existing?.rating ?? 0);
    const [hovered, setHovered] = useState<number>(0);
    const [comment, setComment] = useState(existing?.comment ?? "");
    const [submitted, setSubmitted] = useState(!!existing);
    const [isPending, startTransition] = useTransition();

    function handleSubmit() {
        if (rating === 0) return;
        startTransition(async () => {
            await submitMealFeedback({
                orderId,
                studentId,
                userId,
                rating: rating as 1 | 2 | 3 | 4 | 5,
                comment: comment.trim() || undefined,
            });
            setSubmitted(true);
        });
    }

    if (submitted && !isPending) {
        return (
            <div className="p-5 bg-(--bg-card) border border-(--border-card) rounded-xl shadow-(--shadow-card)">
                <div className="flex items-center gap-3">
                    <CheckCircle2 size={20} className="text-green-500 shrink-0" />
                    <div>
                        <p className="text-sm font-medium text-(--text-primary)">
                            Thanks for your feedback!
                        </p>
                        <div className="flex gap-0.5 mt-1">
                            {[1, 2, 3, 4, 5].map((s) => (
                                <Star
                                    key={s}
                                    size={14}
                                    className={
                                        s <= rating
                                            ? "fill-amber-400 text-amber-400"
                                            : "text-(--border-card)"
                                    }
                                />
                            ))}
                        </div>
                    </div>
                    <button
                        onClick={() => setSubmitted(false)}
                        className="ml-auto text-xs text-(--text-muted) hover:text-(--text-secondary) transition-colors"
                    >
                        Edit
                    </button>
                </div>
            </div>
        );
    }

    return (
        <div className="p-5 bg-(--bg-card) border border-(--border-card) rounded-xl shadow-(--shadow-card) flex flex-col gap-4">
            <div>
                <p className="text-xs font-semibold text-(--text-muted) uppercase tracking-wider">
                    Rate this meal
                </p>
                <p className="text-xs text-(--text-muted) mt-0.5">
                    How did your child enjoy it?
                </p>
            </div>

            {/* Stars */}
            <div className="flex gap-1">
                {[1, 2, 3, 4, 5].map((s) => (
                    <button
                        key={s}
                        onMouseEnter={() => setHovered(s)}
                        onMouseLeave={() => setHovered(0)}
                        onClick={() => setRating(s)}
                        className="p-1 rounded transition-transform hover:scale-110 active:scale-95"
                    >
                        <Star
                            size={28}
                            className={`transition-colors ${s <= (hovered || rating)
                                ? "fill-amber-400 text-amber-400"
                                : "text-(--border-card)"
                                }`}
                        />
                    </button>
                ))}
            </div>

            {/* Comment */}
            {rating > 0 && (
                <textarea
                    value={comment}
                    onChange={(e) => setComment(e.target.value)}
                    placeholder="Any comments? (optional)"
                    rows={3}
                    maxLength={500}
                    className="w-full text-sm bg-(--bg-tertiary) border border-(--border-card) rounded-lg px-3 py-2 text-(--text-primary) placeholder:text-(--text-muted) resize-none focus:outline-none focus:border-(--border-primary) transition-colors"
                />
            )}

            {/* Submit */}
            <button
                onClick={handleSubmit}
                disabled={rating === 0 || isPending}
                className="flex items-center justify-center gap-2 px-4 py-2 bg-(--accent) text-(--accent-text) rounded-lg text-sm font-medium hover:bg-(--accent-hover) transition-colors disabled:opacity-40 disabled:cursor-not-allowed self-start"
            >
                {isPending && <Loader2 size={15} className="animate-spin" />}
                {isPending ? "Submitting…" : "Submit feedback"}
            </button>
        </div>
    );
}