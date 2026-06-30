"use client";

import { useRef, useState, useTransition } from "react";
import { Building2, Users, UtensilsCrossed, GraduationCap, Sparkles, MapPin, Calendar, Camera, X } from "lucide-react";
import { upsertSchoolProfile } from "@/db/actions/admin/SchoolProfile";
import type { schoolProfileTable } from "@/drizzle/schema";
import { ProfileForms, type FormValues } from "./ProfileForms";
import { BrandPanel } from "./BrandPanel";
import { CompletionPanel } from "./CompletionPanel";
import { SaveBar } from "./SaveBar";
import { ImageUpload } from "./ImageUpload";

type SchoolProfile = typeof schoolProfileTable.$inferSelect | null;

interface Props {
    school: SchoolProfile;
    stats: { studentCount: number; canteenCount: number; classCount: number };
    studentLimit: number;
    tier: string;
}

function isValidHex(v: string) { return /^#[0-9A-Fa-f]{6}$/.test(v); }

function StatCard({ icon: Icon, label, value, sub, color }: {
    icon: React.ElementType; label: string; value: string | number; sub?: string; color: string;
}) {
    return (
        <div className="flex items-center gap-3.5 rounded-xl border p-4"
            style={{ background: "var(--bg-card)", borderColor: "var(--border-card)" }}>
            <div className="w-10 h-10 rounded-xl flex items-center justify-center shrink-0"
                style={{ background: `${color}18`, color }}>
                <Icon size={18} />
            </div>
            <div className="min-w-0">
                <p className="text-xl font-black tracking-tight" style={{ color: "var(--text-primary)" }}>{value}</p>
                <p className="text-xs font-medium" style={{ color: "var(--text-muted)" }}>{label}</p>
                {sub && <p className="text-[10px] mt-0.5" style={{ color: "var(--text-muted)" }}>{sub}</p>}
            </div>
        </div>
    );
}

const SCHOOL_TYPES = [
    { value: "primary", label: "Primary School" },
    { value: "secondary", label: "Secondary School" },
    { value: "both", label: "Primary & Secondary" },
];

export function SchoolProfileClient({ school, stats, studentLimit, tier }: Props) {
    const [isPending, startTransition] = useTransition();
    const [saved, setSaved] = useState(false);
    const [error, setError] = useState("");

    const isPremium = tier === "premium_school";

    const [isDirty, setIsDirty] = useState(false);

    const [form, setForm] = useState<FormValues>({
        name: school?.name ?? "",
        address: school?.address ?? "",
        city: school?.city ?? "",
        logoUrl: school?.logoUrl ?? "",
        bannerUrl: school?.bannerUrl ?? "",
        email: school?.email ?? "",
        phone: school?.phone ?? "",
        timezone: school?.timezone ?? "Asia/Karachi",
        primaryColor: school?.primaryColor ?? "#3b82f6",
        academicYear: school?.academicYear ?? "",
        schoolType: (school?.schoolType ?? "") as FormValues["schoolType"],
    });

    function update<K extends keyof FormValues>(key: K, value: FormValues[K]) {
        setForm((f) => ({ ...f, [key]: value }));
        setIsDirty(true);  // ← add this
        setSaved(false);
        setError("");
    }

    function handleSave() {
        if (!form.name.trim()) { setError("School name is required."); return; }
        startTransition(async () => {
            try {
                await upsertSchoolProfile({
                    name: form.name.trim(),
                    address: form.address || null,
                    city: form.city || null,
                    logoUrl: form.logoUrl || null,
                    bannerUrl: form.bannerUrl || null,
                    email: form.email || null,
                    phone: form.phone || null,
                    timezone: form.timezone,
                    primaryColor: isValidHex(form.primaryColor) ? form.primaryColor : null,
                    academicYear: form.academicYear || null,
                    schoolType: (form.schoolType || null) as "primary" | "secondary" | "both" | null,
                });
                setSaved(true);
                setIsDirty(false);  // ← reset after save
                setTimeout(() => setSaved(false), 3000);
            } catch (err: any) {
                setError(err?.message ?? "Failed to save. Please try again.");
            }
        });
    }

    const liveColor = isValidHex(form.primaryColor) ? form.primaryColor : "#3b82f6";

    return (
        <div className="max-w-7xl mx-auto space-y-6">

            {/* Header */}
            <div>
                <h1 className="text-2xl font-bold tracking-tight" style={{ color: "var(--text-primary)" }}>
                    School Profile
                </h1>
                <p className="text-sm mt-1" style={{ color: "var(--text-secondary)" }}>
                    Manage your school's identity, contact details, and system configuration.
                </p>
            </div>

            {/* Hero banner */}
            <div className="relative rounded-2xl overflow-hidden"
                style={{ background: "var(--bg-card)", border: "1px solid var(--border-card)" }}>

                {/* Banner upload zone — replaces the static gradient */}
                <div className="h-36 w-full">
                    <div><ImageUpload
                        variant="banner"
                        value={form.bannerUrl}
                        onChange={(url) => update("bannerUrl", url)}
                        accentColor={liveColor}
                    /></div>

                </div>

                {/* Logo + name row */}
                <div className="px-6 pb-5">
                    <div className="flex items-end gap-5 -mt-10">

                        {/* Logo upload — replaces static circle */}
                        <div className="relative -mt-10 shrink-0">
                            <ImageUpload
                                variant="avatar"
                                value={form.logoUrl}
                                onChange={(url) => update("logoUrl", url)}
                                accentColor={liveColor}
                            />
                        </div>

                        {/* School info — unchanged */}
                        <div className="pb-1 min-w-0 flex-1">
                            <h2 className="text-xl font-black truncate pt-3" style={{ color: "var(--text-primary)" }}>
                                {form.name || "Your School Name"}
                            </h2>
                            <div className="flex flex-wrap items-center gap-3 mt-1">
                                {(form.city || form.address) && (
                                    <span className="flex items-center gap-1 text-xs" style={{ color: "var(--text-muted)" }}>
                                        <MapPin size={11} />{[form.city, form.address].filter(Boolean).join(", ")}
                                    </span>
                                )}
                                {form.academicYear && (
                                    <span className="flex items-center gap-1 text-xs" style={{ color: "var(--text-muted)" }}>
                                        <Calendar size={11} />{form.academicYear}
                                    </span>
                                )}
                                {form.schoolType && (
                                    <span className="text-[10px] font-bold px-2 py-0.5 rounded-full"
                                        style={{ background: `${liveColor}20`, color: liveColor }}>
                                        {SCHOOL_TYPES.find((t) => t.value === form.schoolType)?.label}
                                    </span>
                                )}
                            </div>
                        </div>
                    </div>
                </div>
            </div>

            {/* Stats */}
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
                <StatCard icon={Users} label="Students"
                    value={isPremium ? "Unlimited" : `${stats.studentCount} / ${studentLimit}`}
                    sub={isPremium ? `${stats.studentCount} enrolled` : undefined} color="#3b82f6" />
                <StatCard icon={UtensilsCrossed} label="Canteens" value={stats.canteenCount} color="#f59e0b" />
                <StatCard icon={GraduationCap} label="Classes" value={stats.classCount} color="#22c55e" />
                <StatCard icon={Sparkles} label="Plan"
                    value={isPremium ? "Premium" : "Free"}
                    sub={isPremium ? "All features unlocked" : "Upgrade for more"}
                    color={isPremium ? "#f59e0b" : "#6b7280"} />
            </div>

            {/* Two-column layout */}
            <div className="grid grid-cols-1 xl:grid-cols-3 gap-5">
                <div className="xl:col-span-2">
                    <ProfileForms form={form} update={update} accentColor={liveColor} />
                </div>
                <div className="space-y-5">
                    <BrandPanel
                        primaryColor={form.primaryColor}
                        name={form.name}
                        logoUrl={form.logoUrl}
                        onChange={(c) => update("primaryColor", c)}
                    />
                    <CompletionPanel form={form} accentColor={liveColor} />
                </div>
            </div>

            <SaveBar
                isPending={isPending}
                saved={saved}
                error={error}
                isNew={!school}
                isDirty={isDirty}
                accentColor={liveColor}
                onSave={handleSave}
            />
        </div>
    );
}