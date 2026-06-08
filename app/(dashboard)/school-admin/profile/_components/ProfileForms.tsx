"use client";

import { ChevronDown, Building2, School, Calendar, MapPin, Globe, Mail, Phone, Clock, GraduationCap } from "lucide-react";
import { PortalSelect } from "@/components/PortalSelect";
import { ImageUpload } from "./ImageUpload";

// ─── Shared primitives ────────────────────────────────────────────────────────

export const inputCls = "w-full px-3 py-2.5 rounded-xl border text-sm outline-none transition-all focus:ring-2";

export function inputSty(accent?: string): React.CSSProperties {
    return {
        background: "var(--bg-secondary)",
        borderColor: "var(--border-input)",
        color: "var(--text-primary)",
        // @ts-ignore
        "--tw-ring-color": accent ?? "var(--accent)",
    };
}

function Section({ title, subtitle, children }: { title: string; subtitle: string; children: React.ReactNode }) {
    return (
        <div className="rounded-2xl border overflow-hidden"
            style={{ background: "var(--bg-card)", borderColor: "var(--border-card)" }}>
            <div className="px-6 py-4 border-b"
                style={{ borderColor: "var(--border-primary)", background: "var(--bg-secondary)" }}>
                <h2 className="text-sm font-bold" style={{ color: "var(--text-primary)" }}>{title}</h2>
                <p className="text-xs mt-0.5" style={{ color: "var(--text-muted)" }}>{subtitle}</p>
            </div>
            <div className="p-6">{children}</div>
        </div>
    );
}

function Field({ label, icon: Icon, hint, children }: {
    label: string; icon: React.ElementType; hint?: string; children: React.ReactNode;
}) {
    return (
        <div>
            <label className="flex items-center gap-1.5 text-xs font-semibold mb-1.5"
                style={{ color: "var(--text-secondary)" }}>
                <Icon size={11} style={{ color: "var(--text-muted)" }} />
                {label}
                {hint && <span className="ml-1 font-normal" style={{ color: "var(--text-muted)" }}>{hint}</span>}
            </label>
            {children}
        </div>
    );
}

// ─── Constants ────────────────────────────────────────────────────────────────

const SCHOOL_TYPE_OPTIONS = [
    { value: "primary", label: "Primary School", sublabel: "Grades KG – 8" },
    { value: "secondary", label: "Secondary School", sublabel: "Grades 9 – 12" },
    { value: "both", label: "Primary & Secondary", sublabel: "KG – 12" },
];

const TIMEZONE_OPTIONS = [
    "Asia/Karachi", "Asia/Kolkata", "Asia/Dubai", "Asia/Riyadh",
    "Europe/London", "America/New_York", "America/Chicago", "America/Los_Angeles",
].map((tz) => ({ value: tz, label: tz }));

// ─── Props ────────────────────────────────────────────────────────────────────

export interface FormValues {
    name: string;
    address: string;
    city: string;
    logoUrl: string;
    bannerUrl: string;
    email: string;
    phone: string;
    timezone: string;
    primaryColor: string;
    academicYear: string;
    schoolType: "primary" | "secondary" | "both" | "";
}

interface Props {
    form: FormValues;
    update: <K extends keyof FormValues>(key: K, value: FormValues[K]) => void;
    accentColor: string;
}

// ─── Exported component ───────────────────────────────────────────────────────

export function ProfileForms({ form, update, accentColor }: Props) {
    return (
        <div className="space-y-5">

            {/* Identity */}
            <Section title="School Identity" subtitle="Core details displayed across the platform and to parents.">
                <div className="space-y-4">
                    <Field label="School Name" icon={Building2}>
                        <input
                            value={form.name}
                            onChange={(e) => update("name", e.target.value)}
                            placeholder="e.g. Beaconhouse School System"
                            className={inputCls}
                            style={inputSty(accentColor)}
                        />
                    </Field>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                        <Field label="School Type" icon={School} hint="(optional)">
                            <PortalSelect
                                options={SCHOOL_TYPE_OPTIONS}
                                value={form.schoolType || null}
                                onChange={(v) => update("schoolType", (v ?? "") as FormValues["schoolType"])}
                                placeholder="Select type…"
                                noneLabel="No type set"
                            />
                        </Field>

                        <Field label="Academic Year" icon={Calendar} hint="(optional)">
                            <input
                                value={form.academicYear}
                                onChange={(e) => update("academicYear", e.target.value)}
                                placeholder="2025-2026"
                                className={`${inputCls} font-mono`}
                                style={inputSty(accentColor)}
                            />
                        </Field>
                    </div>


                </div>
            </Section>

            {/* Location */}
            <Section title="Location" subtitle="Physical address shown in parent-facing communications.">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <Field label="Street Address" icon={Globe} hint="(optional)">
                        <textarea
                            value={form.address}
                            onChange={(e) => update("address", e.target.value)}
                            placeholder="Street, area"
                            rows={2}
                            className={`${inputCls} resize-none`}
                            style={inputSty(accentColor)}
                        />
                    </Field>
                    <Field label="City" icon={MapPin} hint="(optional)">
                        <input
                            value={form.city}
                            onChange={(e) => update("city", e.target.value)}
                            placeholder="e.g. Lahore"
                            className={inputCls}
                            style={inputSty(accentColor)}
                        />
                    </Field>
                </div>
            </Section>

            {/* Contact */}
            <Section title="Contact Information" subtitle="How parents and staff can reach your school.">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <Field label="Contact Email" icon={Mail} hint="(optional)">
                        <input
                            type="email"
                            value={form.email}
                            onChange={(e) => update("email", e.target.value)}
                            placeholder="admin@school.edu.pk"
                            className={inputCls}
                            style={inputSty(accentColor)}
                        />
                    </Field>
                    <Field label="Contact Phone" icon={Phone} hint="(optional)">
                        <input
                            type="tel"
                            value={form.phone}
                            onChange={(e) => update("phone", e.target.value)}
                            placeholder="+92 300 0000000"
                            className={inputCls}
                            style={inputSty(accentColor)}
                        />
                    </Field>
                </div>
            </Section>

            {/* System */}
            <Section title="System Configuration" subtitle="Timezone used for order scheduling and reporting.">
                <Field label="Timezone" icon={Clock}>
                    <PortalSelect
                        options={TIMEZONE_OPTIONS}
                        value={form.timezone}
                        onChange={(v) => update("timezone", v ?? "Asia/Karachi")}
                        placeholder="Select timezone…"
                    />
                </Field>
            </Section>
        </div>
    );
}