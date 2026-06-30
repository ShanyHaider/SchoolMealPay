"use client";

import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { useRouter } from "next/navigation";
import { subscriptionTiers, type BillingCycle } from "@/data/subscriptionTiers";
import { PricingCard, type PricingCardData } from "./PricingCard";

type TargetGroup = "schools" | "parents";

const CARDS: Record<TargetGroup, (PricingCardData & { highlight: boolean; badge: string | null })[]> = {
    schools: [
        { key: "SchoolFree", highlight: false, badge: null, ...subscriptionTiers.SchoolFree },
        { key: "SchoolPremium", highlight: true, badge: "Most Popular", ...subscriptionTiers.SchoolPremium },
    ],
    parents: [
        { key: "ParentFree", highlight: false, badge: null, ...subscriptionTiers.ParentFree },
        { key: "ParentPro", highlight: true, badge: "Recommended", ...subscriptionTiers.ParentPro },
    ],
};

interface Props {
    /** Lock to one role — hides the group toggle. Used in /school-admin and /parent billing pages */
    fixedRole?: TargetGroup;
    /** Show only the paid card — used in BillingPageShell upgrade prompt */
    paidOnly?: boolean;
}

export function PricingCards({ fixedRole, paidOnly = false }: Props) {
    const router = useRouter();
    const [target, setTarget] = useState<TargetGroup>(fixedRole ?? "schools");
    const [cycle, setCycle] = useState<BillingCycle>("monthly");
    const [loadingTier, setLoadingTier] = useState<string | null>(null);

    const showGroupToggle = !fixedRole;
    const cards = paidOnly
        ? CARDS[target].filter((c) => c.monthlyPriceInCents > 0)
        : CARDS[target];

    const handleCheckout = async (tierKey: string, isFree: boolean) => {
        if (isFree) { router.push("/sign-up"); return; }
        setLoadingTier(tierKey);
        try {
            const res = await fetch("/api/stripe/checkout", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ tier: tierKey, cycle }),
            });
            if (
                res.status === 401 ||
                !res.headers.get("content-type")?.includes("application/json")
            ) {
                router.push(`/sign-up?redirect_url=${encodeURIComponent(`/checkout?tier=${tierKey}&cycle=${cycle}`)}`);
                return;
            }
            const data = await res.json();
            if (!res.ok) throw new Error(data.error ?? "Checkout failed");
            if (data.url) window.location.href = data.url;
        } catch (err) {
            console.error("[PricingCards]", err);
            alert("Something went wrong. Please try again.");
        } finally {
            setLoadingTier(null);
        }
    };

    return (
        <div className="space-y-8">
            {/* Toggles */}
            <div className="flex flex-col items-center gap-4">
                {showGroupToggle && (
                    <div className="flex items-center gap-1 p-1.5 rounded-2xl border border-zinc-200 dark:border-zinc-800 bg-zinc-100/80 dark:bg-zinc-900/80">
                        {([
                            { key: "schools" as const, label: "Schools & Canteens" },
                            { key: "parents" as const, label: "Parents & Guardians" },
                        ]).map(({ key, label }) => (
                            <button
                                key={key}
                                onClick={() => setTarget(key)}
                                className={`relative px-5 py-2.5 rounded-xl text-sm font-bold transition-colors ${target === key ? "text-white dark:text-zinc-950" : "text-zinc-500 hover:text-zinc-950 dark:hover:text-white"
                                    }`}
                            >
                                {target === key && (
                                    <motion.div
                                        layoutId="target-pill"
                                        className="absolute inset-0 rounded-xl bg-zinc-950 dark:bg-white"
                                        transition={{ type: "spring", stiffness: 380, damping: 30 }}
                                    />
                                )}
                                <span className="relative z-10">{label}</span>
                            </button>
                        ))}
                    </div>
                )}

                {/* Cycle toggle — always shown */}
                <div className="relative flex items-center gap-1 p-1.5 rounded-2xl border border-zinc-200 dark:border-zinc-800 bg-zinc-100/80 dark:bg-zinc-900/80">
                    {(["monthly", "annual"] as const).map((c) => (
                        <button
                            key={c}
                            onClick={() => setCycle(c)}
                            className={`relative px-5 py-2.5 rounded-xl text-sm font-bold capitalize transition-colors ${cycle === c ? "text-white dark:text-zinc-950" : "text-zinc-500 hover:text-zinc-950 dark:hover:text-white"
                                }`}
                        >
                            {cycle === c && (
                                <motion.div
                                    layoutId="cycle-pill"
                                    className="absolute inset-0 rounded-xl bg-zinc-950 dark:bg-white"
                                    transition={{ type: "spring", stiffness: 380, damping: 30 }}
                                />
                            )}
                            <span className="relative z-10">{c}</span>
                        </button>
                    ))}
                    <div className="absolute -right-16 -top-3 pointer-events-none">
                        <div className="rounded-full bg-emerald-500 px-2.5 py-1 shadow-lg shadow-emerald-500/20">
                            <span className="text-[9px] font-black uppercase tracking-wider text-white">2 mo free</span>
                        </div>
                    </div>
                </div>
            </div>

            {/* Cards */}
            <AnimatePresence mode="wait">
                <motion.div
                    key={target}
                    initial={{ opacity: 0, y: 12 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -8 }}
                    transition={{ duration: 0.25, ease: "easeOut" }}
                    className={`grid gap-6 ${cards.length === 1 ? "max-w-sm mx-auto" : "grid-cols-1 sm:grid-cols-2"}`}
                >
                    {cards.map((card) => (
                        <PricingCard
                            key={card.key}
                            card={card}
                            cycle={cycle}
                            highlight={card.highlight}
                            badge={card.badge}
                            isLoading={loadingTier === card.key}
                            onCheckout={handleCheckout}
                        />
                    ))}
                </motion.div>
            </AnimatePresence>
        </div>
    );
}