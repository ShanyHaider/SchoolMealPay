"use client";

import { useState, useTransition } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import Link from "next/link";
import {
    ShieldAlert,
    CreditCard,
    FileText,
    Stethoscope,
    ArrowLeft,
    Save,
    CheckCircle2,
    ExternalLink,
    GraduationCap,
    Ban,
    User,
} from "lucide-react";
import { upsertChildProfile, setStudentAllergens } from "@/db/actions/Students";
import { ToastContainer, useToast } from "@/components/useToast";
import { profileSchema } from "@/lib/validations/childProfile";

// ─── Constants ─────────────────────────────────────────────────────────────────

const ALL_ALLERGENS = [
    "nuts",
    "gluten",
    "dairy",
    "eggs",
    "soy",
    "shellfish",
    "fish",
    "sesame",
] as const;

type Allergen = (typeof ALL_ALLERGENS)[number];

const ALLERGEN_ICONS: Record<Allergen, string> = {
    nuts: "🥜",
    gluten: "🌾",
    dairy: "🥛",
    eggs: "🥚",
    soy: "🫘",
    shellfish: "🦐",
    fish: "🐟",
    sesame: "⚪",
};

// ─── Types ─────────────────────────────────────────────────────────────────────

type ProfileForm = z.infer<typeof profileSchema>;

interface StudentData {
    id: string;
    name: string;
    studentCode: string;
    imageUrl?: string | null;                          // ← added for avatar
    orderingEnabled?: boolean;                         // ← added for status dot
    class?: { grade: string; section: string } | null;
    allergens: { allergen: Allergen }[];
    childProfile?: {
        dailySpendingLimit?: string | null;
        weeklySpendingLimit?: string | null;
        dietaryPreferences?: string | null;
        medicalNotes?: string | null;
    } | null;
}

interface BlockedItem {
    id: string;
    menuItemId: string;
    menuItem?: { name: string } | null;
}

interface Props {
    student: StudentData;
    blockedItems: BlockedItem[];
}

// ─── Component ─────────────────────────────────────────────────────────────────

export function ChildProfileClient({ student, blockedItems }: Props) {
    const { toasts, toast, dismiss } = useToast();
    const originalAllergens = student.allergens.map((a) => a.allergen).sort().join(",");
    const [selectedAllergens, setSelectedAllergens] = useState<Set<Allergen>>(
        new Set(student.allergens.map((a) => a.allergen)),
    );
    const [savedAllergenKey, setSavedAllergenKey] = useState(originalAllergens);
    const [allergensPending, startAllergenTransition] = useTransition();

    const isAllergensDirty =
        [...selectedAllergens].sort().join(",") !== savedAllergenKey;

    const {
        register,
        handleSubmit,
        formState: { errors, isDirty, isSubmitting },
        reset,
    } = useForm<ProfileForm>({
        resolver: zodResolver(profileSchema),
        defaultValues: {
            dailyLimit: student.childProfile?.dailySpendingLimit ?? "",
            weeklyLimit: student.childProfile?.weeklySpendingLimit ?? "",
            dietary: student.childProfile?.dietaryPreferences ?? "",
            medical: student.childProfile?.medicalNotes ?? "",
        },
    });

    // ── Profile submit ──────────────────────────────────────────────────────────

    async function onProfileSubmit(data: ProfileForm) {
        try {
            await upsertChildProfile({
                studentId: student.id,
                dailySpendingLimit: data.dailyLimit || null,
                weeklySpendingLimit: data.weeklyLimit || null,
                dietaryPreferences: data.dietary || null,
                medicalNotes: data.medical || null,
            });
            reset(data);
            toast("Profile saved successfully", "success");
        } catch {
            toast("Failed to save profile. Please try again.", "error");
        }
    }

    // ── Allergen toggle ─────────────────────────────────────────────────────────

    function toggleAllergen(allergen: Allergen) {
        setSelectedAllergens((prev) => {
            const next = new Set(prev);
            next.has(allergen) ? next.delete(allergen) : next.add(allergen);
            return next;
        });
    }

    function saveAllergens() {
        startAllergenTransition(async () => {
            try {
                await setStudentAllergens(student.id, [...selectedAllergens]);
                setSavedAllergenKey([...selectedAllergens].sort().join(","));
                toast("Allergens updated", "success");
            } catch {
                toast("Failed to update allergens", "error");
            }
        });
    }

    // ─── Derived ────────────────────────────────────────────────────────────────

    const initials = student.name
        .split(" ")
        .map((n) => n[0])
        .join("")
        .toUpperCase()
        .slice(0, 2);

    const classLabel = student.class
        ? `Grade ${student.class.grade} · Section ${student.class.section}`
        : null;

    // ─── Render ─────────────────────────────────────────────────────────────────

    return (
        <>
            <div className="flex flex-col gap-6 max-w-6xl mx-auto w-full">

                {/* ── Page header ── */}
                <div className="flex items-center gap-3">
                    <Link
                        href="/parent/children"
                        className="w-9 h-9 flex items-center justify-center rounded-xl bg-(--bg-secondary) text-(--text-secondary) hover:bg-(--bg-tertiary) hover:text-(--text-primary) transition-colors shrink-0 border border-(--border-card)"
                    >
                        <ArrowLeft size={15} />
                    </Link>
                    <div className="min-w-0">
                        <h1 className="text-lg font-bold text-(--text-primary) leading-tight truncate">
                            Child Profile
                        </h1>
                        <p className="text-xs text-(--text-muted) mt-0.5">
                            Manage settings, allergens &amp; spending limits
                        </p>
                    </div>
                </div>

                {/* ── Student identity card ── */}
                <div
                    className="rounded-2xl border p-5 flex items-center gap-4"
                    style={{
                        background: "var(--bg-card)",
                        borderColor: "var(--border-card)",
                        boxShadow: "var(--shadow-card)",
                    }}
                >
                    {/* ── Avatar with status dot ── */}
                    <div className="relative shrink-0 self-start md:self-center">
                        <div className="w-16 h-16 rounded-2xl bg-blue-500/10 flex items-center justify-center text-xl font-bold text-blue-600 overflow-hidden border border-blue-500/20">
                            {student.imageUrl ? (
                                <img
                                    src={student.imageUrl}
                                    alt={student.name}
                                    className="w-full h-full object-cover"
                                />
                            ) : (
                                initials
                            )}
                        </div>
                        <div
                            className={`absolute -bottom-1 -right-1 w-5 h-5 rounded-full border-4 border-(--bg-card) ${student.orderingEnabled ? "bg-green-500" : "bg-gray-400"
                                }`}
                        />
                    </div>

                    {/* Info */}
                    <div className="flex-1 min-w-0">
                        <p className="text-base font-bold text-(--text-primary) truncate leading-snug">
                            {student.name}
                        </p>
                        <div className="flex flex-wrap items-center gap-x-3 gap-y-1 mt-1.5">
                            {classLabel && (
                                <span className="flex items-center gap-1 text-xs text-(--text-secondary)">
                                    <GraduationCap size={11} className="text-(--text-muted)" />
                                    {classLabel}
                                </span>
                            )}
                            <span className="flex items-center gap-1 text-xs text-(--text-muted) font-mono">
                                <User size={11} />
                                {student.studentCode}
                            </span>
                        </div>
                    </div>

                    {/* Stats */}
                    <div className="hidden sm:flex items-center gap-3 shrink-0">
                        <Stat
                            label="Allergens"
                            value={selectedAllergens.size}
                            color={selectedAllergens.size > 0 ? "#ef4444" : undefined}
                        />
                        <div className="w-px h-8 bg-(--border-card)" />
                        <Stat label="Blocked" value={blockedItems.length} />
                    </div>
                </div>

                {/* ── Spending limits ── */}
                <Section
                    icon={<CreditCard size={15} />}
                    title="Spending limits"
                    subtitle="Set daily and weekly caps on canteen purchases."
                >
                    <form onSubmit={handleSubmit(onProfileSubmit)} className="flex flex-col gap-5">
                        <div className="grid grid-cols-2 gap-4">
                            <Field
                                label="Daily limit"
                                hint="Leave blank for unlimited"
                                error={errors.dailyLimit?.message}
                            >
                                <PrefixInput prefix="PKR">
                                    <input
                                        {...register("dailyLimit")}
                                        type="number"
                                        step="1"
                                        min="0"
                                        placeholder="No limit"
                                        className={inputCls(!!errors.dailyLimit)}
                                        style={{ paddingLeft: "3.25rem" }}
                                    />
                                </PrefixInput>
                            </Field>

                            <Field
                                label="Weekly limit"
                                hint="Leave blank for unlimited"
                                error={errors.weeklyLimit?.message}
                            >
                                <PrefixInput prefix="PKR">
                                    <input
                                        {...register("weeklyLimit")}
                                        type="number"
                                        step="1"
                                        min="0"
                                        placeholder="No limit"
                                        className={inputCls(!!errors.weeklyLimit)}
                                        style={{ paddingLeft: "3.25rem" }}
                                    />
                                </PrefixInput>
                            </Field>
                        </div>

                        <Field
                            label="Dietary preferences"
                            icon={<FileText size={12} />}
                            error={errors.dietary?.message}
                        >
                            <input
                                {...register("dietary")}
                                type="text"
                                placeholder="e.g. vegetarian, halal, kosher..."
                                className={inputCls(!!errors.dietary)}
                            />
                        </Field>

                        <Field
                            label="Medical notes"
                            icon={<Stethoscope size={12} />}
                            error={errors.medical?.message}
                        >
                            <textarea
                                {...register("medical")}
                                rows={3}
                                placeholder="Any conditions canteen staff should be aware of..."
                                className={`${inputCls(!!errors.medical)} resize-none`}
                            />
                        </Field>

                        <FormFooter isDirty={isDirty}>
                            <button
                                type="submit"
                                disabled={isSubmitting || !isDirty}
                                className="flex items-center gap-2 px-4 py-2 bg-(--accent) text-(--accent-text) rounded-lg text-sm font-semibold hover:bg-(--accent-hover) transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                            >
                                {isSubmitting ? (
                                    <Spinner />
                                ) : (
                                    <Save size={13} />
                                )}
                                Save profile
                            </button>
                        </FormFooter>
                    </form>
                </Section>

                {/* ── Allergens ── */}
                <Section
                    icon={<ShieldAlert size={15} />}
                    title="Allergens"
                    subtitle="Canteen staff are alerted when a flagged item is ordered."
                >
                    <div className="grid grid-cols-4 sm:grid-cols-8 gap-2">
                        {ALL_ALLERGENS.map((allergen) => {
                            const active = selectedAllergens.has(allergen);
                            return (
                                <button
                                    key={allergen}
                                    type="button"
                                    onClick={() => toggleAllergen(allergen)}
                                    className={`relative flex flex-col items-center gap-1.5 p-3 rounded-xl border text-sm font-semibold transition-all ${active
                                        ? "border-red-500/40 bg-red-500/10 text-red-500"
                                        : "border-(--border-card) bg-(--bg-secondary) text-(--text-secondary) hover:border-(--border-primary) hover:text-(--text-primary)"
                                        }`}
                                >
                                    <span className="text-xl leading-none">{ALLERGEN_ICONS[allergen]}</span>
                                    <span className="capitalize text-[10px] leading-none">{allergen}</span>
                                    {active && (
                                        <span className="absolute -top-1.5 -right-1.5 w-4 h-4 rounded-full bg-red-500 flex items-center justify-center">
                                            <CheckCircle2 size={10} className="text-white" />
                                        </span>
                                    )}
                                </button>
                            );
                        })}
                    </div>

                    <FormFooter
                        customLeft={
                            <p className="text-xs text-(--text-muted)">
                                {isAllergensDirty
                                    ? <span className="text-amber-500 font-medium">Unsaved changes</span>
                                    : selectedAllergens.size === 0
                                        ? "No allergens selected"
                                        : `${selectedAllergens.size} allergen${selectedAllergens.size > 1 ? "s" : ""} flagged`}
                            </p>
                        }
                    >
                        <button
                            type="button"
                            onClick={saveAllergens}
                            disabled={allergensPending || !isAllergensDirty}
                            className="flex items-center gap-2 px-4 py-2 bg-(--accent) text-(--accent-text) rounded-lg text-sm font-semibold hover:bg-(--accent-hover) transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                        >
                            {allergensPending ? <Spinner /> : <Save size={13} />}
                            Save allergens
                        </button>
                    </FormFooter>
                </Section>

                {/* ── Blocked items ── */}
                {blockedItems.length > 0 && (
                    <Section
                        icon={<Ban size={15} />}
                        title="Blocked items"
                        subtitle="Items this child is not allowed to order."
                        badge={blockedItems.length}
                    >
                        <div className="flex flex-col gap-2">
                            {blockedItems.map((item) => (
                                <div
                                    key={item.id}
                                    className="flex items-center justify-between px-3.5 py-2.5 rounded-xl bg-(--bg-secondary) border border-(--border-card)"
                                >
                                    <div className="flex items-center gap-2.5 min-w-0">
                                        <span
                                            className="w-6 h-6 rounded-lg flex items-center justify-center shrink-0"
                                            style={{ background: "rgba(239,68,68,0.1)" }}
                                        >
                                            <Ban size={12} style={{ color: "#ef4444" }} />
                                        </span>
                                        <span className="text-sm font-medium text-(--text-primary) truncate">
                                            {item.menuItem?.name ?? "Unknown item"}
                                        </span>
                                    </div>
                                    <Link
                                        href={`/parent/spending?unblock=${item.menuItemId}&student=${student.id}`}
                                        className="flex items-center gap-1 text-xs text-blue-500 hover:text-blue-400 font-semibold transition-colors shrink-0 ml-3"
                                    >
                                        Unblock
                                        <ExternalLink size={10} />
                                    </Link>
                                </div>
                            ))}
                        </div>
                    </Section>
                )}
            </div>

            <ToastContainer toasts={toasts} dismiss={dismiss} />
        </>
    );
}

// ─── Sub-components ────────────────────────────────────────────────────────────

function Section({
    icon,
    title,
    subtitle,
    badge,
    children,
}: {
    icon: React.ReactNode;
    title: string;
    subtitle?: string;
    badge?: number;
    children: React.ReactNode;
}) {
    return (
        <div
            className="rounded-2xl border p-5 flex flex-col gap-4"
            style={{
                background: "var(--bg-card)",
                borderColor: "var(--border-card)",
                boxShadow: "var(--shadow-card)",
            }}
        >
            <div className="flex items-start justify-between gap-2">
                <div className="flex items-start gap-2.5">
                    <span className="mt-0.5 text-(--text-muted)">{icon}</span>
                    <div>
                        <h2 className="text-sm font-bold text-(--text-primary)">{title}</h2>
                        {subtitle && (
                            <p className="text-xs text-(--text-secondary) mt-0.5">{subtitle}</p>
                        )}
                    </div>
                </div>
                {badge != null && badge > 0 && (
                    <span
                        className="text-xs font-semibold px-2 py-0.5 rounded-full shrink-0"
                        style={{
                            background: "rgba(239,68,68,0.1)",
                            color: "#ef4444",
                        }}
                    >
                        {badge}
                    </span>
                )}
            </div>
            {children}
        </div>
    );
}

function Field({
    label,
    icon,
    hint,
    error,
    children,
}: {
    label: string;
    icon?: React.ReactNode;
    hint?: string;
    error?: string;
    children: React.ReactNode;
}) {
    return (
        <div className="flex flex-col gap-1.5">
            <label className="flex items-center gap-1.5 text-xs font-semibold text-(--text-secondary) uppercase tracking-wider">
                {icon}
                {label}
            </label>
            {children}
            {error ? (
                <p className="text-xs text-red-500 font-medium">{error}</p>
            ) : hint ? (
                <p className="text-xs text-(--text-muted)">{hint}</p>
            ) : null}
        </div>
    );
}

function PrefixInput({ prefix, children }: { prefix: string; children: React.ReactNode }) {
    return (
        <div className="relative">
            <span className="absolute left-3 top-1/2 -translate-y-1/2 text-xs font-semibold text-(--text-muted) pointer-events-none tracking-wide">
                {prefix}
            </span>
            {children}
        </div>
    );
}

function FormFooter({
    isDirty,
    customLeft,
    children,
}: {
    isDirty?: boolean;
    customLeft?: React.ReactNode;
    children: React.ReactNode;
}) {
    return (
        <div className="flex items-center justify-between pt-3 border-t border-(--border-card)">
            {customLeft ?? (
                isDirty ? (
                    <p className="text-xs text-amber-500 font-medium">Unsaved changes</p>
                ) : (
                    <span />
                )
            )}
            {children}
        </div>
    );
}

function Stat({
    label,
    value,
    color,
}: {
    label: string;
    value: number;
    color?: string;
}) {
    return (
        <div className="flex flex-col items-center gap-0.5">
            <span
                className="text-lg font-bold leading-none"
                style={{ color: color ?? "var(--text-primary)" }}
            >
                {value}
            </span>
            <span className="text-[10px] text-(--text-muted) font-medium uppercase tracking-wide">
                {label}
            </span>
        </div>
    );
}

function Spinner() {
    return (
        <span className="w-3.5 h-3.5 border-2 border-current/30 border-t-current rounded-full animate-spin" />
    );
}

function inputCls(hasError: boolean) {
    return `w-full px-3 py-2 rounded-lg border text-sm outline-none transition-colors bg-(--bg-secondary) text-(--text-primary) placeholder:text-(--text-muted) ${hasError
        ? "border-red-500/60 focus:border-red-500"
        : "border-(--border-input) focus:border-(--border-input-focus)"
        }`;
}