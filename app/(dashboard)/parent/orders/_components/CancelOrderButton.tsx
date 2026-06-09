"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { XCircle, Loader2, AlertTriangle } from "lucide-react";
import { cancelOrder } from "@/db/actions/Orders";

interface CancelOrderButtonProps {
    orderId: string;
    parentId: string;
    studentId: string;
    canteenId: string;
}

export function CancelOrderButton({
    orderId,
    parentId,
    studentId,
    canteenId,
}: CancelOrderButtonProps) {
    const [showModal, setShowModal] = useState(false);
    const [isPending, startTransition] = useTransition();
    const [error, setError] = useState<string | null>(null);
    const router = useRouter();

    function handleConfirm() {
        setError(null);
        startTransition(async () => {
            try {
                await cancelOrder(orderId, parentId, studentId, canteenId);
                setShowModal(false);
                router.refresh();
            } catch {
                setError("Failed to cancel order. Please try again.");
            }
        });
    }

    return (
        <>
            <button
                onClick={() => setShowModal(true)}
                className="flex items-center gap-2 px-4 py-2 border border-red-200 text-red-600 dark:border-red-800 dark:text-red-400 rounded-lg text-sm font-medium hover:bg-red-50 dark:hover:bg-red-900/20 transition-colors"
            >
                <XCircle size={16} />
                Cancel Order
            </button>

            {showModal && (
                <div
                    className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm p-4"
                    onClick={() => !isPending && setShowModal(false)}
                >
                    <div
                        className="bg-(--bg-card) border border-(--border-card) rounded-2xl shadow-xl w-full max-w-sm p-6 flex flex-col gap-5"
                        onClick={(e) => e.stopPropagation()}
                    >
                        {/* Icon + heading */}
                        <div className="flex flex-col items-center gap-3 text-center">
                            <div className="w-12 h-12 rounded-full bg-red-100 dark:bg-red-900/30 flex items-center justify-center">
                                <AlertTriangle size={22} className="text-red-600 dark:text-red-400" />
                            </div>
                            <div>
                                <p className="text-base font-semibold text-(--text-primary)">
                                    Cancel this order?
                                </p>
                                <p className="text-sm text-(--text-secondary) mt-1">
                                    This can't be undone. The order will be marked as cancelled
                                    and your wallet will be refunded.
                                </p>
                            </div>
                        </div>

                        {error && (
                            <p className="text-xs text-red-600 dark:text-red-400 text-center bg-red-50 dark:bg-red-900/20 px-3 py-2 rounded-lg">
                                {error}
                            </p>
                        )}

                        {/* Actions */}
                        <div className="flex gap-3">
                            <button
                                onClick={() => setShowModal(false)}
                                disabled={isPending}
                                className="flex-1 px-4 py-2 bg-(--bg-tertiary) text-(--text-secondary) rounded-lg text-sm font-medium hover:text-(--text-primary) transition-colors disabled:opacity-40"
                            >
                                Keep order
                            </button>
                            <button
                                onClick={handleConfirm}
                                disabled={isPending}
                                className="flex-1 flex items-center justify-center gap-2 px-4 py-2 bg-red-600 text-white rounded-lg text-sm font-medium hover:bg-red-700 transition-colors disabled:opacity-60"
                            >
                                {isPending && <Loader2 size={14} className="animate-spin" />}
                                {isPending ? "Cancelling…" : "Yes, cancel"}
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </>
    );
}