"use client";

import { useState, useTransition } from "react";
import { ShieldAlert, Save, CheckCircle2 } from "lucide-react";
import { setStudentAllergens } from "@/db/actions/Students";
import { useToast } from "@/components/useToast";
import { Section, FormFooter, Spinner } from "./ui";
import { ALL_ALLERGENS, ALLERGEN_ICONS, type Allergen } from "./constants";
import { StudentData } from "@/types/childProfileTypes";

export function AllergenSelector({ student }: { student: StudentData }) {
  const { toast } = useToast();
  const originalKey = student.allergens
    .map((a) => a.allergen)
    .sort()
    .join(",");

  const [selected, setSelected] = useState<Set<Allergen>>(
    new Set(student.allergens.map((a) => a.allergen)),
  );
  const [savedKey, setSavedKey] = useState(originalKey);
  const [isPending, startTransition] = useTransition();

  const isDirty = [...selected].sort().join(",") !== savedKey;

  function toggle(allergen: Allergen) {
    setSelected((prev) => {
      const next = new Set(prev);
      next.has(allergen) ? next.delete(allergen) : next.add(allergen);
      return next;
    });
  }

  function save() {
    startTransition(async () => {
      try {
        await setStudentAllergens(student.id, [...selected]);
        setSavedKey([...selected].sort().join(","));
        toast("Allergens updated", "success");
      } catch {
        toast("Failed to update allergens", "error");
      }
    });
  }

  return (
    <Section
      icon={<ShieldAlert size={15} />}
      title="Allergens"
      subtitle="Canteen staff are alerted when a flagged item is ordered."
    >
      <div className="grid grid-cols-4 sm:grid-cols-8 gap-2">
        {ALL_ALLERGENS.map((allergen) => {
          const active = selected.has(allergen);
          return (
            <button
              key={allergen}
              type="button"
              onClick={() => toggle(allergen)}
              className={`relative flex flex-col items-center gap-1.5 p-3 rounded-xl border text-sm font-semibold transition-all ${
                active ?
                  "border-red-500/40 bg-red-500/10 text-red-500"
                : "border-(--border-card) bg-(--bg-secondary) text-(--text-secondary) hover:border-(--border-primary) hover:text-(--text-primary)"
              }`}
            >
              <span className="text-xl leading-none">
                {ALLERGEN_ICONS[allergen]}
              </span>
              <span className="capitalize text-[10px] leading-none">
                {allergen}
              </span>
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
            {isDirty ?
              <span className="text-amber-500 font-medium">
                Unsaved changes
              </span>
            : selected.size === 0 ?
              "No allergens selected"
            : `${selected.size} allergen${selected.size > 1 ? "s" : ""} flagged`
            }
          </p>
        }
      >
        <button
          type="button"
          onClick={save}
          disabled={isPending || !isDirty}
          className="flex items-center gap-2 px-4 py-2 bg-(--accent) text-(--accent-text) rounded-lg text-sm font-semibold hover:bg-(--accent-hover) transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {isPending ?
            <Spinner />
          : <Save size={13} />}
          Save allergens
        </button>
      </FormFooter>
    </Section>
  );
}
