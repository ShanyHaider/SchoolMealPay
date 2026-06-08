"use client";

import { useRef, useState, useTransition } from "react";
import { Building2, Users, UtensilsCrossed, GraduationCap, Sparkles, MapPin, Calendar, Camera, X } from "lucide-react";
import { upsertSchoolProfile } from "@/db/actions/admin/SchoolProfile";
import type { schoolProfileTable } from "@/drizzle/schema";
import { ProfileForms, type FormValues } from "./ProfileForms";
import { BrandPanel } from "./BrandPanel";
import { CompletionPanel } from "./CompletionPanel";
import { SaveBar } from "./SaveBar";

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
    const logoInputRef = useRef<HTMLInputElement>(null);
    const bannerInputRef = useRef<HTMLInputElement>(null);

    const [form, setForm] = useState<FormValues>({
        name: school?.name ?? "",
        address: school?.address ?? "",
        city: school?.city ?? "",
        logoUrl: school?.logoUrl ?? "",
        bannerUrl: "", // add bannerUrl to your DB schema when ready
        email: school?.email ?? "",
        phone: school?.phone ?? "",
        timezone: school?.timezone ?? "Asia/Karachi",
        primaryColor: school?.primaryColor ?? "#3b82f6",
        academicYear: school?.academicYear ?? "",
        schoolType: (school?.schoolType ?? "") as FormValues["schoolType"],
    });

    function update<K extends keyof FormValues>(key: K, value: FormValues[K]) {
        setForm((f) => ({ ...f, [key]: value }));
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
                    email: form.email || null,
                    phone: form.phone || null,
                    timezone: form.timezone,
                    primaryColor: isValidHex(form.primaryColor) ? form.primaryColor : null,
                    academicYear: form.academicYear || null,
                    schoolType: (form.schoolType || null) as "primary" | "secondary" | "both" | null,
                });
                setSaved(true);
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
                <div className="relative h-36 w-full group cursor-pointer"
                    onClick={() => bannerInputRef.current?.click()}
                    style={{
                        background: form.bannerUrl
                            ? "transparent"
                            : `linear-gradient(135deg, ${liveColor}cc 0%, ${liveColor}66 60%, ${liveColor}22 100%)`,
                    }}>
                    {form.bannerUrl && (
                        <img src={form.bannerUrl} alt="" className="w-full h-full object-cover" />
                    )}
                    {/* Hover overlay */}
                    <div className="absolute inset-0 flex items-center justify-center gap-2 opacity-0 group-hover:opacity-100 transition-opacity"
                        style={{ background: "rgba(0,0,0,0.35)" }}>
                        <Camera size={16} color="#fff" />
                        <span className="text-xs font-semibold text-white">
                            {form.bannerUrl ? "Change banner" : "Upload banner"}
                        </span>
                    </div>
                    {/* Clear banner */}
                    {form.bannerUrl && (
                        <button type="button"
                            onClick={(e) => { e.stopPropagation(); update("bannerUrl", ""); }}
                            className="absolute top-2 right-2 w-6 h-6 rounded-full flex items-center justify-center z-10"
                            style={{ background: "rgba(0,0,0,0.55)" }}>
                            <X size={11} color="#fff" />
                        </button>
                    )}
                    <input ref={bannerInputRef} type="file" accept="image/*" className="hidden"
                        onChange={(e) => { const f = e.target.files?.[0]; if (f) update("bannerUrl", URL.createObjectURL(f)); e.target.value = ""; }} />
                </div>

                {/* Logo + name row */}
                <div className="px-6 pb-5">
                    <div className="flex items-end gap-5 -mt-10">

                        {/* Logo upload — replaces static circle */}
                        <div className="relative w-20 h-20 rounded-2xl border-4 overflow-hidden shrink-0 flex items-center justify-center shadow-lg group cursor-pointer"
                            style={{ borderColor: "var(--bg-card)", background: form.logoUrl ? "transparent" : `${liveColor}20` }}
                            onClick={() => logoInputRef.current?.click()}>
                            {form.logoUrl
                                ? <img src={form.logoUrl} alt="School logo" className="w-full h-full object-cover"
                                    onError={(e) => { (e.target as HTMLImageElement).style.display = "none"; }} />
                                : <Building2 size={28} style={{ color: liveColor }} />}
                            {/* Hover overlay */}
                            <div className="absolute inset-0 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity rounded-2xl"
                                style={{ background: "rgba(0,0,0,0.45)" }}>
                                <Camera size={14} color="#fff" />
                            </div>
                            {/* Clear logo */}
                            {form.logoUrl && (
                                <button type="button"
                                    onClick={(e) => { e.stopPropagation(); update("logoUrl", ""); }}
                                    className="absolute top-0.5 right-0.5 w-5 h-5 rounded-full flex items-center justify-center z-10 opacity-0 group-hover:opacity-100 transition-opacity"
                                    style={{ background: "rgba(0,0,0,0.6)" }}>
                                    <X size={9} color="#fff" />
                                </button>
                            )}
                            <input ref={logoInputRef} type="file" accept="image/*" className="hidden"
                                onChange={(e) => { const f = e.target.files?.[0]; if (f) update("logoUrl", URL.createObjectURL(f)); e.target.value = ""; }} />
                        </div>

                        {/* School info — unchanged */}
                        <div className="pb-1 min-w-0 flex-1">
                            <h2 className="text-xl font-black truncate" style={{ color: "var(--text-primary)" }}>
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
                accentColor={liveColor}
                onSave={handleSave}
            />
        </div>
    );
}