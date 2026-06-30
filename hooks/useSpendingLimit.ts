// app/(dashboard)/parent/hooks/useSpendingLimit.ts
"use client";

import { useState, useTransition } from "react";
import { toast } from "sonner";
import { upsertChildProfile } from "@/db/actions/Students";
import { updateSpendingLimitSchema } from "@/lib/validations/schoolProfile";
import { SPENDING_SLIDER } from "@/constants/parentDashboardConstants";
import type { Student } from "@/types/parentDashboardTypes";

export function useSpendingLimit(student: Student) {
    const [isPending, startTransition] = useTransition();

    // Clamp saved limit inside slider range so the thumb always renders
    const savedLimit = student.childProfile?.dailySpendingLimit
        ? Math.min(
            Math.max(parseFloat(student.childProfile.dailySpendingLimit), SPENDING_SLIDER.MIN),
            SPENDING_SLIDER.MAX,
        )
        : SPENDING_SLIDER.MIN;

    const [sliderLimit, setSliderLimit] = useState(savedLimit);
    const [hasChanges, setHasChanges] = useState(false);

    const onChange = (value: number) => {
        setSliderLimit(value);
        setHasChanges(true);
    };

    const save = () => {
        const result = updateSpendingLimitSchema.safeParse({
            studentId: student.id,
            dailySpendingLimit: sliderLimit,
        });

        if (!result.success) {
            toast.error(result.error.issues[0]?.message ?? "Limit validation failed.");
            return;
        }

        startTransition(async () => {
            try {
                await upsertChildProfile({
                    studentId: student.id,
                    dailySpendingLimit: sliderLimit.toFixed(0),
                    weeklySpendingLimit: student.childProfile?.weeklySpendingLimit ?? null,
                    dietaryPreferences: student.childProfile?.dietaryPreferences ?? null,
                    medicalNotes: student.childProfile?.medicalNotes ?? null,
                });
                setHasChanges(false);
                toast.success("Spending limit updated.");
            } catch {
                toast.error("Failed to update spending limit.");
            }
        });
    };

    return { sliderLimit, hasChanges, isPending, onChange, save };
}