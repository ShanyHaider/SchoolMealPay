"use client";

import { useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import {
    Wallet,
    Plus,
    Minus,
    ArrowUpRight,
    ArrowDownLeft,
    RotateCcw,
    TrendingUp,
    TrendingDown,
    Users,
    Calendar,
    CheckCircle2,
    XCircle,
    Clock,
    Banknote,
    ShoppingBag,
    X,
} from "lucide-react";
import { createWalletTopupSession } from "@/server/actions/stripe";
import { useToast, ToastContainer } from "@/components/useToast";
import type { WalletTransaction, StudentSpending } from "@/db/queries/Wallets";

// ─── Constants ─────────────────────────────────────────────────────────────────

const TOPUP_PRESETS = [500, 1000, 2000, 5000];

// ─── Types ─────────────────────────────────────────────────────────────────────

interface WalletStats {
    monthSpent: number;
    monthTopups: number;
    weekSpent: number;
    txCount: number;
}

interface WalletClientProps {
    parentId: string;
    balance: number;
    transactions: WalletTransaction[];
    studentSpending: StudentSpending[];
    stats: WalletStats;
    redirectStatus: string | null;
}

// ─── Helpers ───────────────────────────────────────────────────────────────────

function fmt(amount: number) {
    return `PKR ${Math.round(amount).toLocaleString()}`;
}

function txIcon(type: WalletTransaction["transactionType"]) {
    if (type === "wallet_topup")
        return <ArrowDownLeft size={14} className="text-green-500" />;
    if (type === "refund")
        return <RotateCcw size={14} className="text-blue-500" />;
    return <ArrowUpRight size={14} className="text-red-400" />;
}

function txColor(type: WalletTransaction["transactionType"]) {
    if (type === "wallet_topup") return "text-green-500";
    if (type === "refund") return "text-blue-500";
    return "text-red-400";
}

function txSign(type: WalletTransaction["transactionType"]) {
    return type === "purchase" ? "−" : "+";
}

function statusBadge(status: WalletTransaction["status"]) {
    const map: Record<
        WalletTransaction["status"],
        { label: string; cls: string; icon: React.ReactNode }
    > = {
        success: {
            label: "Success",
            cls: "bg-green-500/10 text-green-600 border-green-500/20",
            icon: <CheckCircle2 size={10} />,
        },
        pending: {
            label: "Pending",
            cls: "bg-amber-500/10 text-amber-600 border-amber-500/20",
            icon: <Clock size={10} />,
        },
        failed: {
            label: "Failed",
            cls: "bg-red-500/10 text-red-500 border-red-500/20",
            icon: <XCircle size={10} />,
        },
        refunded: {
            label: "Refunded",
            cls: "bg-blue-500/10 text-blue-500 border-blue-500/20",
            icon: <RotateCcw size={10} />,
        },
    };
    const s = map[status];
    return (
        <span
            className={`inline-flex items-center gap-1 text-[10px] font-bold px-2 py-0.5 rounded-lg border ${s.cls}`}
        >
            {s.icon} {s.label}
        </span>
    );
}

function formatDate(date: Date | string | null) {
    if (!date) return "—";
    return new Date(date).toLocaleDateString("en-PK", {
        day: "numeric",
        month: "short",
        year: "numeric",
    });
}

// ─── Top-up Modal ──────────────────────────────────────────────────────────────

function TopupModal({
    onClose,
    onSubmit,
    loading,
}: {
    onClose: () => void;
    onSubmit: (amount: number) => void;
    loading: boolean;
}) {
    const [amount, setAmount] = useState<number | "">(1000);

    const parsed = typeof amount === "number" ? amount : 0;
    const isValid = parsed >= 100 && parsed <= 100000;

    return (
        <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-4">
            {/* Backdrop */}
            <div
                className="absolute inset-0 bg-black/40 backdrop-blur-sm"
                onClick={onClose}
            />

            {/* Sheet */}
            <div className="relative w-full max-w-sm bg-(--bg-card) border border-(--border-card) rounded-3xl shadow-2xl p-6 flex flex-col gap-5 z-10">
                {/* Header */}
                <div className="flex items-start justify-between">
                    <div>
                        <h2 className="text-lg font-bold text-(--text-primary)">
                            Top Up Wallet
                        </h2>
                        <p className="text-xs text-(--text-muted) mt-0.5 font-medium">
                            Funds are added instantly after payment
                        </p>
                    </div>
                    <button
                        onClick={onClose}
                        className="w-8 h-8 rounded-xl flex items-center justify-center hover:bg-(--bg-secondary) text-(--text-muted) transition-colors"
                    >
                        <X size={16} />
                    </button>
                </div>

                {/* Preset buttons */}
                <div className="grid grid-cols-4 gap-2">
                    {TOPUP_PRESETS.map((preset) => (
                        <button
                            key={preset}
                            onClick={() => setAmount(preset)}
                            className={`py-2.5 rounded-xl text-xs font-bold border transition-all active:scale-95 ${amount === preset
                                ? "bg-(--text-primary) text-(--bg-primary) border-(--text-primary)"
                                : "bg-(--bg-secondary) text-(--text-secondary) border-(--border-card) hover:border-(--text-primary)/30"
                                }`}
                        >
                            {preset >= 1000 ? `${preset / 1000}k` : preset}
                        </button>
                    ))}
                </div>

                {/* Custom amount input */}
                <div className="flex flex-col gap-1.5">
                    <label className="text-[10px] font-bold text-(--text-muted) uppercase tracking-widest">
                        Custom Amount (PKR)
                    </label>
                    <div className="flex items-center gap-3 px-4 py-3 bg-(--bg-secondary) rounded-xl border border-(--border-card) focus-within:border-(--text-primary)/40 transition-colors">
                        <span className="text-sm font-bold text-(--text-muted) shrink-0">
                            PKR
                        </span>
                        <input
                            type="number"
                            min={100}
                            max={100000}
                            value={amount}
                            onChange={(e) =>
                                setAmount(e.target.value === "" ? "" : Number(e.target.value))
                            }
                            className="flex-1 bg-transparent text-sm font-bold text-(--text-primary) outline-none min-w-0"
                            placeholder="Enter amount"
                        />
                        <div className="flex flex-col gap-0.5 shrink-0">
                            <button
                                onClick={() =>
                                    setAmount((v) =>
                                        Math.min((typeof v === "number" ? v : 0) + 100, 100000),
                                    )
                                }
                                className="w-5 h-4 flex items-center justify-center text-(--text-muted) hover:text-(--text-primary) transition-colors"
                            >
                                <Plus size={10} />
                            </button>
                            <button
                                onClick={() =>
                                    setAmount((v) =>
                                        Math.max((typeof v === "number" ? v : 0) - 100, 100),
                                    )
                                }
                                className="w-5 h-4 flex items-center justify-center text-(--text-muted) hover:text-(--text-primary) transition-colors"
                            >
                                <Minus size={10} />
                            </button>
                        </div>
                    </div>
                    {!isValid && parsed > 0 && (
                        <p className="text-[10px] text-red-400 font-medium">
                            Amount must be between PKR 100 and PKR 100,000
                        </p>
                    )}
                </div>

                {/* Summary */}
                {isValid && (
                    <div className="flex items-center justify-between px-4 py-3 bg-green-500/5 border border-green-500/15 rounded-xl">
                        <span className="text-xs font-bold text-(--text-muted)">
                            You will add
                        </span>
                        <span className="text-base font-bold text-green-600">
                            {fmt(parsed)}
                        </span>
                    </div>
                )}

                {/* CTA */}
                <button
                    onClick={() => isValid && onSubmit(parsed)}
                    disabled={!isValid || loading}
                    className={`w-full py-3.5 rounded-xl font-bold text-xs uppercase tracking-widest transition-all active:scale-95 ${isValid && !loading
                        ? "bg-(--text-primary) text-(--bg-primary) hover:opacity-90"
                        : "bg-(--bg-secondary) text-(--text-muted) cursor-not-allowed"
                        }`}
                >
                    {loading ? "Redirecting to Stripe…" : `Pay ${isValid ? fmt(parsed) : ""}`}
                </button>

                <p className="text-center text-[9px] text-(--text-muted) font-medium uppercase tracking-wide">
                    Secured by Stripe · No card details stored
                </p>
            </div>
        </div>
    );
}

// ─── Main Component ────────────────────────────────────────────────────────────

export function WalletClient({
    parentId,
    balance,
    transactions,
    studentSpending,
    stats,
    redirectStatus,
}: WalletClientProps) {
    const router = useRouter();
    const { toasts, toast, dismiss } = useToast();
    const [showTopup, setShowTopup] = useState(false);
    const [topupLoading, setTopupLoading] = useState(false);
    const [activeTab, setActiveTab] = useState<"history" | "breakdown">(
        "history",
    );
    const statusHandled = useRef(false);

    // Handle redirect back from Stripe — fire once only (Strict Mode guard)
    useEffect(() => {
        if (!redirectStatus || statusHandled.current) return;
        statusHandled.current = true;

        if (redirectStatus === "success") {
            toast("Wallet topped up successfully! Your balance has been updated.", "success");
            router.replace("/parent/wallet");
            // Webhook processes async — refresh after 5s to show updated balance
            setTimeout(() => router.refresh(), 5000);
        } else if (redirectStatus === "cancelled") {
            toast("Top-up cancelled. No charge was made.", "warning");
            router.replace("/parent/wallet");
        }
    }, [redirectStatus]); // eslint-disable-line react-hooks/exhaustive-deps

    async function handleTopup(amount: number) {
        setTopupLoading(true);
        try {
            const url = await createWalletTopupSession(amount);
            window.location.href = url;
        } catch (e: any) {
            toast(e?.message ?? "Failed to start top-up. Please try again.", "error");
            setTopupLoading(false);
        }
    }

    const isLowBalance = balance < 500;

    return (
        <>
            <div className="flex flex-col gap-8 max-w-5xl">

                {/* ── Hero row ─────────────────────────────────────────────────── */}
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">

                    {/* Balance card — spans 2 cols */}
                    <div className="lg:col-span-2 relative overflow-hidden bg-(--bg-card) border border-(--border-card) rounded-2xl p-6 shadow-sm flex flex-col justify-between gap-6">
                        <div className="absolute -right-8 -top-8 w-40 h-40 rounded-full bg-(--text-primary)/3 pointer-events-none" />

                        <div className="flex items-start justify-between">
                            <div>
                                <p className="text-[10px] font-bold text-(--text-muted) uppercase tracking-[0.2em]">
                                    Wallet Balance
                                </p>
                                <p
                                    className={`text-4xl font-bold mt-2 tracking-tight ${isLowBalance ? "text-red-500" : "text-(--text-primary)"
                                        }`}
                                >
                                    {fmt(balance)}
                                </p>
                                {isLowBalance && (
                                    <p className="text-xs text-red-400 font-medium mt-1">
                                        Low balance — top up to keep ordering
                                    </p>
                                )}
                            </div>
                            <div className="w-12 h-12 rounded-2xl bg-(--bg-secondary) border border-(--border-card) flex items-center justify-center shrink-0">
                                <Wallet size={22} className="text-(--text-primary)" />
                            </div>
                        </div>

                        <button
                            onClick={() => setShowTopup(true)}
                            className="flex items-center justify-center gap-2 w-full py-3 rounded-xl bg-(--text-primary) text-(--bg-primary) text-xs font-bold uppercase tracking-widest hover:opacity-90 transition-all active:scale-95"
                        >
                            <Plus size={14} /> Top Up Wallet
                        </button>
                    </div>

                    {/* This week */}
                    <div className="bg-(--bg-card) border border-(--border-card) rounded-2xl p-5 shadow-sm flex flex-col gap-3">
                        <div className="flex items-center justify-between">
                            <p className="text-[10px] font-bold text-(--text-muted) uppercase tracking-[0.2em]">
                                This Week
                            </p>
                            <TrendingDown size={14} className="text-red-400" />
                        </div>
                        <p className="text-2xl font-bold text-(--text-primary)">
                            {fmt(stats.weekSpent)}
                        </p>
                        <p className="text-xs text-(--text-muted) font-medium">
                            spent on meals
                        </p>
                    </div>

                    {/* This month */}
                    <div className="bg-(--bg-card) border border-(--border-card) rounded-2xl p-5 shadow-sm flex flex-col gap-3">
                        <div className="flex items-center justify-between">
                            <p className="text-[10px] font-bold text-(--text-muted) uppercase tracking-[0.2em]">
                                This Month
                            </p>
                            <TrendingUp size={14} className="text-green-500" />
                        </div>
                        <p className="text-2xl font-bold text-(--text-primary)">
                            {fmt(stats.monthSpent)}
                        </p>
                        <p className="text-xs text-(--text-muted) font-medium">
                            {stats.txCount} transaction{stats.txCount !== 1 ? "s" : ""} ·{" "}
                            {fmt(stats.monthTopups)} topped up
                        </p>
                    </div>
                </div>

                {/* ── Tabs card ─────────────────────────────────────────────────── */}
                <div className="bg-(--bg-card) border border-(--border-card) rounded-2xl shadow-sm overflow-hidden">

                    {/* Tab bar */}
                    <div className="flex border-b border-(--border-card)">
                        {(["history", "breakdown"] as const).map((tab) => (
                            <button
                                key={tab}
                                onClick={() => setActiveTab(tab)}
                                className={`flex-1 flex items-center justify-center gap-2 py-4 text-xs font-bold uppercase tracking-widest transition-colors ${activeTab === tab
                                    ? "text-(--text-primary) border-b-2 border-(--text-primary) -mb-px"
                                    : "text-(--text-muted) hover:text-(--text-secondary)"
                                    }`}
                            >
                                {tab === "history" ? (
                                    <>
                                        <Banknote size={14} /> Transaction History
                                    </>
                                ) : (
                                    <>
                                        <Users size={14} /> Per-Student Spending
                                    </>
                                )}
                            </button>
                        ))}
                    </div>

                    {/* ── Transaction History ──────────────────────────────────── */}
                    {activeTab === "history" && (
                        <div className="divide-y divide-(--border-card)">
                            {transactions.length === 0 ? (
                                <div className="flex flex-col items-center justify-center py-16 text-(--text-muted)">
                                    <ShoppingBag size={36} className="opacity-10 mb-3" />
                                    <p className="text-sm font-medium italic">
                                        No transactions yet
                                    </p>
                                </div>
                            ) : (
                                transactions.map((tx) => (
                                    <div
                                        key={tx.id}
                                        className="flex items-center gap-4 px-6 py-4 hover:bg-(--bg-secondary) transition-colors"
                                    >
                                        {/* Type icon */}
                                        <div className="w-9 h-9 rounded-xl bg-(--bg-secondary) border border-(--border-card) flex items-center justify-center shrink-0">
                                            {txIcon(tx.transactionType)}
                                        </div>

                                        {/* Label + meta */}
                                        <div className="flex-1 min-w-0">
                                            <p className="text-sm font-bold text-(--text-primary) truncate">
                                                {tx.transactionType === "wallet_topup"
                                                    ? "Wallet Top-up"
                                                    : tx.transactionType === "refund"
                                                        ? "Refund"
                                                        : `Meal Order${tx.studentName ? ` — ${tx.studentName}` : ""}`}
                                            </p>
                                            <div className="flex items-center gap-2 mt-0.5 flex-wrap">
                                                <span className="text-[10px] font-medium text-(--text-muted)">
                                                    {formatDate(tx.processedAt ?? tx.createdAt)}
                                                </span>
                                                {tx.orderDate && (
                                                    <>
                                                        <span className="text-(--text-muted) opacity-30">
                                                            ·
                                                        </span>
                                                        <span className="flex items-center gap-1 text-[10px] text-(--text-muted)">
                                                            <Calendar size={9} /> {tx.orderDate}
                                                        </span>
                                                    </>
                                                )}
                                            </div>
                                        </div>

                                        {/* Amount + status */}
                                        <div className="text-right shrink-0 flex flex-col items-end gap-1.5">
                                            <span
                                                className={`text-sm font-bold tabular-nums ${txColor(tx.transactionType)}`}
                                            >
                                                {txSign(tx.transactionType)} PKR{" "}
                                                {Math.round(parseFloat(tx.amount)).toLocaleString()}
                                            </span>
                                            {statusBadge(tx.status)}
                                        </div>
                                    </div>
                                ))
                            )}
                        </div>
                    )}

                    {/* ── Per-Student Breakdown ──────────────────────────────── */}
                    {activeTab === "breakdown" && (
                        <div className="divide-y divide-(--border-card)">
                            {studentSpending.length === 0 ? (
                                <div className="flex flex-col items-center justify-center py-16 text-(--text-muted)">
                                    <Users size={36} className="opacity-10 mb-3" />
                                    <p className="text-sm font-medium italic">
                                        No spending data for the last 30 days
                                    </p>
                                </div>
                            ) : (
                                <>
                                    <div className="px-6 py-3 bg-(--bg-secondary)">
                                        <p className="text-[10px] font-bold text-(--text-muted) uppercase tracking-widest">
                                            Last 30 days
                                        </p>
                                    </div>

                                    {studentSpending.map((s) => {
                                        const maxSpend = Math.max(
                                            ...studentSpending.map((x) => x.totalSpent),
                                        );
                                        const pct =
                                            maxSpend > 0 ? (s.totalSpent / maxSpend) * 100 : 0;

                                        return (
                                            <div key={s.studentId} className="px-6 py-5">
                                                <div className="flex items-center justify-between mb-3">
                                                    <div className="flex items-center gap-3">
                                                        <div className="w-8 h-8 rounded-xl bg-(--bg-secondary) border border-(--border-card) flex items-center justify-center text-xs font-bold text-(--text-muted)">
                                                            {s.studentName.charAt(0).toUpperCase()}
                                                        </div>
                                                        <div>
                                                            <p className="text-sm font-bold text-(--text-primary)">
                                                                {s.studentName}
                                                            </p>
                                                            <p className="text-[10px] text-(--text-muted) font-medium">
                                                                {s.orderCount} order
                                                                {s.orderCount !== 1 ? "s" : ""}
                                                                {s.lastOrderDate
                                                                    ? ` · Last: ${s.lastOrderDate}`
                                                                    : ""}
                                                            </p>
                                                        </div>
                                                    </div>
                                                    <span className="text-base font-bold text-(--text-primary) tabular-nums">
                                                        {fmt(s.totalSpent)}
                                                    </span>
                                                </div>

                                                {/* Proportional bar */}
                                                <div className="h-1.5 bg-(--bg-secondary) rounded-full overflow-hidden">
                                                    <div
                                                        className="h-full bg-(--text-primary) rounded-full transition-all duration-500"
                                                        style={{ width: `${pct}%` }}
                                                    />
                                                </div>
                                            </div>
                                        );
                                    })}

                                    {/* Total row */}
                                    <div className="flex items-center justify-between px-6 py-4 bg-(--bg-secondary)">
                                        <span className="text-xs font-bold text-(--text-muted) uppercase tracking-widest">
                                            Total (30 days)
                                        </span>
                                        <span className="text-base font-bold text-(--text-primary) tabular-nums">
                                            {fmt(
                                                studentSpending.reduce((s, r) => s + r.totalSpent, 0),
                                            )}
                                        </span>
                                    </div>
                                </>
                            )}
                        </div>
                    )}
                </div>
            </div>

            {/* Top-up Modal */}
            {showTopup && (
                <TopupModal
                    onClose={() => setShowTopup(false)}
                    onSubmit={handleTopup}
                    loading={topupLoading}
                />
            )}

            <ToastContainer toasts={toasts} dismiss={dismiss} />
        </>
    );
}