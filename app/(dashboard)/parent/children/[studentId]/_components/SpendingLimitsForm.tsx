"use client";

import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { CreditCard, FileText, Stethoscope, Save } from "lucide-react";
import { upsertChildProfile } from "@/db/actions/Students";
import { useToast } from "@/components/useToast";
import {
  Section,
  Field,
  PrefixInput,
  FormFooter,
  Spinner,
  inputCls,
} from "./ui";
import { profileSchema } from "@/lib/validations/childProfile";
import { StudentData } from "@/types/childProfileTypes";

type ProfileForm = z.infer<typeof profileSchema>;

export function SpendingLimitsForm({ student }: { student: StudentData }) {
  const { toast } = useToast();

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

  async function onSubmit(data: ProfileForm) {
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

  return (
    <Section
      icon={<CreditCard size={15} />}
      title="Spending limits"
      subtitle="Set daily and weekly caps on canteen purchases."
    >
      <form onSubmit={handleSubmit(onSubmit)} className="flex flex-col gap-5">
        <div className="grid grid-cols-2 gap-4">
          <Field
            label="Daily limit"
            hint="Leave blank for unlimited"
            error={errors.dailyLimit?.message}
          >
            <PrefixInput prefix="Rs">
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
            <PrefixInput prefix="Rs">
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
            {isSubmitting ?
              <Spinner />
            : <Save size={13} />}
            Save profile
          </button>
        </FormFooter>
      </form>
    </Section>
  );
}
