"use client";

// app/(dashboard)/system-admin/_components/SchoolSettingsPanel.tsx

import { useState, useTransition } from "react";
import { Sliders, Building2 } from "lucide-react";
import {
    updateSchoolSubscriptionLimit,
    toggleSchoolSubscriptionTier,
} from "@/db/actions/SuperAdmin";

// Tier values the toggle action accepts — parent_pro is included so the full
// DB union assignable here; the UI only offers free / premium_school buttons.
type Tier = "free" | "premium_school" | "parent_pro";

// Accept the full subscription row shape so page.tsx needs no manual mapping.
// Only id, tier, and studentLimit are actually used by this component.
export type SchoolSettingsData = {
    subscription: ({
        id: string;
        tier: Tier;
        studentLimit: number;
    } & Record<string, unknown>) | null;
    profile: {
        name: string;
        email: string | null;
        phone: string | null;
        city: string | null;
    } | null;
};

interface SchoolSettingsPanelProps {
    subscriptionData: SchoolSettingsData;
    currentAdminUserId: string;
    onMessage: (text: string, type: "success" | "error") => void;
}

// The toggle action only supports flipping between these two values.
type ToggleTier = "free" | "premium_school";

const TIER_OPTIONS: { key: ToggleTier; label: string; desc: string }[] = [
    { key: "free", label: "Free", desc: "Student cap enforced" },
    { key: "premium_school", label: "Premium", desc: "Unlimited students" },
];

export function SchoolSettingsPanel({
    subscriptionData,
    currentAdminUserId,
    onMessage,
}: SchoolSettingsPanelProps) {
    const [isPending, startTransition] = useTransition();
    const currentTier = subscriptionData.subscription?.tier ?? "free";
    const isPremium = currentTier === "premium_school";

    const [studentLimitInput, setStudentLimitInput] = useState(
        subscriptionData.subscription?.studentLimit?.toString() ?? "50",
    );

    const handleUpdateLimit = () => {
        const limit = parseInt(studentLimitInput, 10);
        if (isNaN(limit) || limit < 0) {
            onMessage("Student limit must be a positive number.", "error");
            return;
        }
        startTransition(async () => {
            try {
                await updateSchoolSubscriptionLimit(limit, currentAdminUserId);
                onMessage("Student limit updated successfully.", "success");
            } catch (err) {
                const msg = err instanceof Error ? err.message : "Failed to update limit.";
                onMessage(msg, "error");
            }
        });
    };

    const handleToggleTier = (newTier: ToggleTier) => {
        if (newTier === currentTier) return;
        startTransition(async () => {
            try {
                await toggleSchoolSubscriptionTier(newTier, currentAdminUserId);
                const label = newTier === "premium_school" ? "Premium" : "Free";
                onMessage(`School subscription set to ${label}.`, "success");
            } catch (err) {
                const msg = err instanceof Error ? err.message : "Failed to switch tier.";
                onMessage(msg, "error");
            }
        });
    };

    return (
        <div
            className="rounded-2xl border p-5 shadow-sm space-y-5"
            style={{
                background: "var(--bg-card)",
                borderColor: "var(--border-card)",
            }}
        >
            {/* Header */}
            <div className="flex items-start gap-3">
                <div className="p-2 rounded-lg bg-(--bg-secondary) border border-(--border-card)">
                    <Building2 size={15} className="text-(--text-muted)" />
                </div>
                <div>
                    <h3 className="text-sm font-bold text-(--text-primary) uppercase tracking-widest">
                        School Settings
                    </h3>
                    <p className="text-[10px] text-(--text-secondary) mt-0.5">
                        Campus:{" "}
                        <span className="font-bold text-(--text-primary)">
                            {subscriptionData.profile?.name ?? "Main Campus"}
                        </span>
                    </p>
                    {subscriptionData.profile?.city && (
                        <p className="text-[10px] text-(--text-muted)">
                            {subscriptionData.profile.city}
                        </p>
                    )}
                </div>
            </div>

            {/* Divider */}
            <div className="border-t border-(--border-primary)" />

            {/* Student limit */}
            <div className="space-y-2">
                <label className="flex items-center gap-1.5 text-[10px] font-bold text-(--text-secondary) uppercase tracking-wider">
                    <Sliders size={11} />
                    Student Limit
                </label>
                <div className="flex gap-2">
                    <input
                        type="number"
                        min={0}
                        value={studentLimitInput}
                        onChange={(e) => setStudentLimitInput(e.target.value)}
                        disabled={isPremium || isPending}
                        className="flex-1 px-3 py-2 text-xs font-bold rounded-lg border border-(--border-input) bg-(--bg-secondary) text-(--text-primary) outline-none focus:ring-1 focus:ring-(--accent) disabled:opacity-40 transition-all"
                    />
                    <button
                        onClick={handleUpdateLimit}
                        disabled={isPremium || isPending}
                        className="px-4 py-2 rounded-lg bg-black text-white dark:bg-white dark:text-black text-xs font-bold hover:opacity-90 transition-all disabled:opacity-40"
                    >
                        {isPending ? "..." : "Set"}
                    </button>
                </div>
                {isPremium ? (
                    <p className="text-[9px] text-green-500 font-bold uppercase tracking-tight">
                        ✓ Premium — student cap is bypassed
                    </p>
                ) : (
                    <p className="text-[9px] text-(--text-muted)">
                        Free tier enforces this cap. Set to 0 for no limit on premium.
                    </p>
                )}
            </div>

            {/* Divider */}
            <div className="border-t border-(--border-primary)" />

            {/* Tier override */}
            <div className="space-y-2">
                <label className="text-[10px] font-bold text-(--text-secondary) uppercase tracking-wider">
                    Subscription Tier
                </label>
                <div className="grid grid-cols-2 gap-2">
                    {TIER_OPTIONS.map((opt) => {
                        const isActive = currentTier === opt.key;
                        return (
                            <button
                                key={opt.key}
                                onClick={() => handleToggleTier(opt.key)}
                                disabled={isPending}
                                className={`py-2.5 px-3 rounded-lg text-xs font-bold border transition-all text-left space-y-0.5 disabled:opacity-60 ${isActive
                                        ? "bg-black text-white border-black dark:bg-white dark:text-black dark:border-white"
                                        : "bg-(--bg-secondary) text-(--text-secondary) border-(--border-card) hover:border-(--border-primary) hover:text-(--text-primary)"
                                    }`}
                            >
                                <p>{opt.label}</p>
                                <p
                                    className={`text-[9px] font-medium ${isActive ? "opacity-70" : "text-(--text-muted)"
                                        }`}
                                >
                                    {opt.desc}
                                </p>
                            </button>
                        );
                    })}
                </div>
            </div>

            {/* Contact info — read only */}
            {(subscriptionData.profile?.email || subscriptionData.profile?.phone) && (
                <>
                    <div className="border-t border-(--border-primary)" />
                    <div className="space-y-1">
                        <p className="text-[10px] font-bold text-(--text-secondary) uppercase tracking-wider">
                            Contact
                        </p>
                        {subscriptionData.profile.email && (
                            <p className="text-[11px] font-mono text-(--text-muted)">
                                {subscriptionData.profile.email}
                            </p>
                        )}
                        {subscriptionData.profile.phone && (
                            <p className="text-[11px] font-mono text-(--text-muted)">
                                {subscriptionData.profile.phone}
                            </p>
                        )}
                    </div>
                </>
            )}
        </div>
    );
}