import { currentUser } from "@clerk/nextjs/server";
import { redirect, notFound } from "next/navigation";
import { getOrderById } from "@/db/queries/Orders";
import { getUserFromDb } from "@/features/users/queries";
import Link from "next/link";
import {
    ArrowLeft,
    ShoppingBag,
    CalendarDays,
    Hash,
    QrCode,
    Receipt,
} from "lucide-react";
import { FeedbackWidget } from "../_components/FeedbackWidget";
import { CancelOrderButton } from "../_components/CancelOrderButton";

const STATUS_CONFIG = {
    pending: {
        label: "Pending",
        bg: "bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400",
    },
    preparing: {
        label: "Preparing",
        bg: "bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400",
    },
    ready: {
        label: "Ready",
        bg: "bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400",
    },
    delivered: {
        label: "Collected",
        bg: "bg-(--bg-tertiary) text-(--text-muted)",
    },
    cancelled: {
        label: "Cancelled",
        bg: "bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400",
    },
} as const;

const STATUS_STEPS = ["pending", "preparing", "ready", "delivered"] as const;

export default async function OrderDetailPage({
    params,
}: {
    params: Promise<{ orderId: string }>;
}) {
    const { orderId } = await params;

    const clerkUser = await currentUser();
    if (!clerkUser) redirect("/sign-in");
    const dbUser = await getUserFromDb(clerkUser.id);
    if (!dbUser) redirect("/sign-in");

    const order = await getOrderById(orderId);
    if (!order || order.parentId !== dbUser.id) notFound();

    const status = (order.status ?? "pending") as keyof typeof STATUS_CONFIG;
    const config = STATUS_CONFIG[status] ?? STATUS_CONFIG.pending;
    const isCancelled = status === "cancelled";

    const currentStep = STATUS_STEPS.indexOf(
        status as (typeof STATUS_STEPS)[number],
    );

    const formattedDate = new Date(order.orderDate).toLocaleDateString("en-US", {
        weekday: "long",
        year: "numeric",
        month: "long",
        day: "numeric",
    });

    const subtotal = order.orderItems.reduce((sum, item) => {
        const price = parseFloat(item.menuItem?.price ?? "0");
        return sum + price * item.quantity;
    }, 0);

    const total = parseFloat(order.totalAmount);

    return (
        <div className="flex flex-col gap-6 max-w-6xl mx-auto">
            {/* Back + Header */}
            <div>
                <Link
                    href="/parent/orders"
                    className="inline-flex items-center gap-1.5 text-sm text-(--text-secondary) hover:text-(--text-primary) transition-colors mb-4"
                >
                    <ArrowLeft size={16} />
                    Back to Orders
                </Link>

                <div className="flex items-start justify-between gap-4">
                    <div>
                        <h1 className="text-2xl font-semibold text-(--text-primary) tracking-tight">
                            Order Details
                        </h1>
                        <p className="text-sm text-(--text-muted) mt-1 font-mono">
                            #{order.id.slice(0, 8).toUpperCase()}
                        </p>
                    </div>
                    <span
                        className={`text-[10px] px-2.5 py-1 rounded-full font-bold uppercase tracking-wider shrink-0 ${config.bg}`}
                    >
                        {config.label}
                    </span>
                </div>
            </div>

            {/* Progress tracker */}
            {!isCancelled && (
                <div className="p-5 bg-(--bg-card) border border-(--border-card) rounded-xl shadow-(--shadow-card)">
                    <p className="text-xs font-semibold text-(--text-muted) uppercase tracking-wider mb-4">
                        Order Progress
                    </p>
                    <div className="flex items-center gap-0">
                        {STATUS_STEPS.map((step, idx) => {
                            const stepConfig = STATUS_CONFIG[step];
                            const isCompleted = currentStep >= idx;
                            const isLast = idx === STATUS_STEPS.length - 1;

                            return (
                                <div key={step} className="flex items-center flex-1 last:flex-none">
                                    <div className="flex flex-col items-center gap-1.5">
                                        <div
                                            className={`w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold transition-colors ${isCompleted
                                                    ? "bg-(--accent) text-(--accent-text)"
                                                    : "bg-(--bg-tertiary) text-(--text-muted)"
                                                }`}
                                        >
                                            {idx + 1}
                                        </div>
                                        <span
                                            className={`text-[10px] font-medium whitespace-nowrap ${isCompleted
                                                    ? "text-(--text-primary)"
                                                    : "text-(--text-muted)"
                                                }`}
                                        >
                                            {stepConfig.label}
                                        </span>
                                    </div>
                                    {!isLast && (
                                        <div
                                            className={`h-0.5 flex-1 mb-5 mx-1 rounded-full transition-colors ${currentStep > idx
                                                    ? "bg-(--accent)"
                                                    : "bg-(--border-card)"
                                                }`}
                                        />
                                    )}
                                </div>
                            );
                        })}
                    </div>
                </div>
            )}

            {/* Order Info */}
            <div className="p-5 bg-(--bg-card) border border-(--border-card) rounded-xl shadow-(--shadow-card) flex flex-col gap-3">
                <p className="text-xs font-semibold text-(--text-muted) uppercase tracking-wider">
                    Order Info
                </p>
                <div className="flex items-center gap-3 text-sm">
                    <CalendarDays size={16} className="text-(--text-muted) shrink-0" />
                    <span className="text-(--text-secondary)">Date</span>
                    <span className="ml-auto font-medium text-(--text-primary)">
                        {formattedDate}
                    </span>
                </div>
                <div className="h-px bg-(--border-card)" />
                <div className="flex items-center gap-3 text-sm">
                    <Hash size={16} className="text-(--text-muted) shrink-0" />
                    <span className="text-(--text-secondary)">Order ID</span>
                    <span className="ml-auto font-mono text-xs text-(--text-muted)">
                        {order.id.slice(0, 8).toUpperCase()}
                    </span>
                </div>
                {order.qrCode && (
                    <>
                        <div className="h-px bg-(--border-card)" />
                        <div className="flex items-center gap-3 text-sm">
                            <QrCode size={16} className="text-(--text-muted) shrink-0" />
                            <span className="text-(--text-secondary)">QR Code</span>
                            <span
                                className={`ml-auto text-xs font-semibold px-2 py-0.5 rounded-full ${order.qrUsed
                                        ? "bg-(--bg-tertiary) text-(--text-muted)"
                                        : "bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400"
                                    }`}
                            >
                                {order.qrUsed ? "Used" : "Valid"}
                            </span>
                        </div>
                    </>
                )}
            </div>

            {/* Items */}
            <div className="p-5 bg-(--bg-card) border border-(--border-card) rounded-xl shadow-(--shadow-card) flex flex-col gap-3">
                <p className="text-xs font-semibold text-(--text-muted) uppercase tracking-wider">
                    Items
                </p>
                {order.orderItems.map((item) => (
                    <div key={item.id} className="flex items-center gap-3">
                        <div className="w-9 h-9 rounded-lg bg-(--bg-tertiary) flex items-center justify-center shrink-0">
                            <ShoppingBag size={16} className="text-(--text-muted)" />
                        </div>
                        <div className="flex-1 min-w-0">
                            <p className="text-sm font-medium text-(--text-primary) truncate">
                                {item.menuItem?.name ?? "Item"}
                            </p>
                            <p className="text-xs text-(--text-muted)">
                                PKR {parseFloat(item.menuItem?.price ?? "0").toFixed(0)} each
                            </p>
                        </div>
                        <div className="text-right shrink-0">
                            <p className="text-sm font-semibold text-(--text-primary)">
                                PKR{" "}
                                {(
                                    parseFloat(item.menuItem?.price ?? "0") * item.quantity
                                ).toFixed(0)}
                            </p>
                            <p className="text-xs text-(--text-muted)">× {item.quantity}</p>
                        </div>
                    </div>
                ))}
            </div>

            {/* Summary */}
            <div className="p-5 bg-(--bg-card) border border-(--border-card) rounded-xl shadow-(--shadow-card) flex flex-col gap-3">
                <div className="flex items-center gap-2 mb-1">
                    <Receipt size={15} className="text-(--text-muted)" />
                    <p className="text-xs font-semibold text-(--text-muted) uppercase tracking-wider">
                        Summary
                    </p>
                </div>
                <div className="flex justify-between text-sm">
                    <span className="text-(--text-secondary)">Subtotal</span>
                    <span className="text-(--text-primary) font-medium">
                        PKR {subtotal.toFixed(0)}
                    </span>
                </div>
                <div className="h-px bg-(--border-card)" />
                <div className="flex justify-between text-sm font-semibold">
                    <span className="text-(--text-primary)">Total</span>
                    <span className="text-(--text-primary)">PKR {total.toFixed(0)}</span>
                </div>
            </div>

            {/* Cancel — only for pending orders */}
            {status === "pending" && (
                <div className="flex justify-end">
                    <CancelOrderButton
                        orderId={order.id}
                        parentId={order.parentId}
                        studentId={order.studentId}
                        canteenId={order.canteenId}
                    />
                </div>
            )}

            {/* Feedback — only for delivered orders */}
            {status === "delivered" && (
                <FeedbackWidget
                    orderId={order.id}
                    studentId={order.studentId}
                    userId={dbUser.id}
                    existing={order.mealFeedback ?? null}
                />
            )}
        </div>
    );
}