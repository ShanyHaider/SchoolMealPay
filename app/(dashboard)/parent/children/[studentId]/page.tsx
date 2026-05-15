import { currentUser } from "@clerk/nextjs/server";
import { redirect, notFound } from "next/navigation";
import { getUser } from "@/db/queries/Users";
import { getStudentById } from "@/db/queries/Students";
import { getBlockedItems } from "@/db/queries/Notifications";
import { upsertChildProfile, setStudentAllergens } from "@/db/actions/Students";
import Link from "next/link";

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

export default async function ChildDetailPage({
  params,
}: {
  params: { studentId: string };
}) {
  const clerkUser = await currentUser();
  if (!clerkUser) redirect("/sign-in");
  const dbUser = await getUser(clerkUser.id);
  if (!dbUser) redirect("/sign-in");

  const student = await getStudentById(params.studentId);
  if (!student) notFound();

  const blockedItems = await getBlockedItems(dbUser.id, params.studentId);

  const currentAllergens = student.allergens.map((a) => a.allergen);

  async function handleSaveProfile(formData: FormData) {
    "use server";
    const dailyLimit = formData.get("dailyLimit") as string;
    const weeklyLimit = formData.get("weeklyLimit") as string;
    const dietary = formData.get("dietary") as string;
    const medical = formData.get("medical") as string;

    await upsertChildProfile({
      studentId: params.studentId,
      dailySpendingLimit: dailyLimit || null,
      weeklySpendingLimit: weeklyLimit || null,
      dietaryPreferences: dietary || null,
      medicalNotes: medical || null,
    });
  }

  async function handleSaveAllergens(formData: FormData) {
    "use server";
    const selected = ALL_ALLERGENS.filter((a) => formData.get(a) === "on");
    await setStudentAllergens(params.studentId, selected);
  }

  return (
    <div className="flex flex-col gap-6 max-w-2xl">
      {/* Header */}
      <div className="flex items-center gap-3">
        <Link
          href="/parent/children"
          className="w-8 h-8 flex items-center justify-center rounded-lg bg-(--bg-tertiary) text-(--text-secondary) hover:bg-(--bg-pill) transition-colors"
        >
          <i className="ti ti-arrow-left text-base" />
        </Link>
        <div>
          <h1 className="text-2xl font-semibold text-(--text-primary) tracking-tight">
            {student.name}
          </h1>
          <p className="text-sm text-(--text-secondary) mt-0.5">
            {student.class ?
              `Grade ${student.class.grade} · Section ${student.class.section}`
            : `ID: ${student.studentCode}`}
          </p>
        </div>
      </div>

      {/* Profile form */}
      <form
        action={handleSaveProfile}
        className="bg-(--bg-card) border border-(--border-card) rounded-xl p-5 shadow-(--shadow-card) flex flex-col gap-4"
      >
        <h2 className="font-semibold text-(--text-primary)">Spending limits</h2>

        <div className="grid grid-cols-2 gap-4">
          <div className="flex flex-col gap-1.5">
            <label className="text-xs font-medium text-(--text-secondary)">
              Daily limit ($)
            </label>
            <input
              name="dailyLimit"
              type="number"
              step="0.01"
              min="0"
              defaultValue={student.childProfile?.dailySpendingLimit ?? ""}
              placeholder="No limit"
              className="px-3 py-2 rounded-lg border border-(--border-input) bg-(--bg-secondary) text-(--text-primary) text-sm outline-none focus:border-(--border-input-focus) transition-colors"
            />
          </div>
          <div className="flex flex-col gap-1.5">
            <label className="text-xs font-medium text-(--text-secondary)">
              Weekly limit ($)
            </label>
            <input
              name="weeklyLimit"
              type="number"
              step="0.01"
              min="0"
              defaultValue={student.childProfile?.weeklySpendingLimit ?? ""}
              placeholder="No limit"
              className="px-3 py-2 rounded-lg border border-(--border-input) bg-(--bg-secondary) text-(--text-primary) text-sm outline-none focus:border-(--border-input-focus) transition-colors"
            />
          </div>
        </div>

        <div className="flex flex-col gap-1.5">
          <label className="text-xs font-medium text-(--text-secondary)">
            Dietary preferences
          </label>
          <input
            name="dietary"
            type="text"
            defaultValue={student.childProfile?.dietaryPreferences ?? ""}
            placeholder="e.g. vegetarian, halal..."
            className="px-3 py-2 rounded-lg border border-(--border-input) bg-(--bg-secondary) text-(--text-primary) text-sm outline-none focus:border-(--border-input-focus) transition-colors"
          />
        </div>

        <div className="flex flex-col gap-1.5">
          <label className="text-xs font-medium text-(--text-secondary)">
            Medical notes
          </label>
          <textarea
            name="medical"
            rows={2}
            defaultValue={student.childProfile?.medicalNotes ?? ""}
            placeholder="Any medical conditions canteen staff should know..."
            className="px-3 py-2 rounded-lg border border-(--border-input) bg-(--bg-secondary) text-(--text-primary) text-sm outline-none focus:border-(--border-input-focus) transition-colors resize-none"
          />
        </div>

        <button
          type="submit"
          className="self-end px-4 py-2 bg-(--accent) text-(--accent-text) rounded-lg text-sm font-medium hover:bg-(--accent-hover) transition-colors"
        >
          Save profile
        </button>
      </form>

      {/* Allergens form */}
      <form
        action={handleSaveAllergens}
        className="bg-(--bg-card) border border-(--border-card) rounded-xl p-5 shadow-(--shadow-card) flex flex-col gap-4"
      >
        <h2 className="font-semibold text-(--text-primary)">Allergens</h2>
        <p className="text-sm text-(--text-secondary) -mt-2">
          Check all allergens that apply. Canteen staff will be alerted.
        </p>

        <div className="grid grid-cols-2 gap-2 sm:grid-cols-4">
          {ALL_ALLERGENS.map((allergen) => (
            <label
              key={allergen}
              className="flex items-center gap-2 p-2.5 rounded-lg border border-(--border-card) bg-(--bg-secondary) cursor-pointer hover:border-(--border-primary) transition-colors"
            >
              <input
                type="checkbox"
                name={allergen}
                defaultChecked={currentAllergens.includes(allergen)}
                className="accent-(--accent) w-4 h-4"
              />
              <span className="text-sm text-(--text-primary) capitalize">
                {allergen}
              </span>
            </label>
          ))}
        </div>

        <button
          type="submit"
          className="self-end px-4 py-2 bg-(--accent) text-(--accent-text) rounded-lg text-sm font-medium hover:bg-(--accent-hover) transition-colors"
        >
          Save allergens
        </button>
      </form>

      {/* Blocked items */}
      {blockedItems.length > 0 && (
        <div className="bg-(--bg-card) border border-(--border-card) rounded-xl p-5 shadow-(--shadow-card)">
          <h2 className="font-semibold text-(--text-primary) mb-4">
            Blocked items
          </h2>
          <div className="flex flex-col gap-2">
            {blockedItems.map((item) => (
              <div
                key={item.id}
                className="flex items-center justify-between p-3 rounded-lg bg-(--bg-secondary) border border-(--border-card)"
              >
                <span className="text-sm text-(--text-primary)">
                  {item.menuItem?.name ?? "Unknown item"}
                </span>
                <Link
                  href={`/parent/spending?unblock=${item.menuItemId}&student=${params.studentId}`}
                  className="text-xs text-(--text-muted) hover:text-(--text-primary) transition-colors"
                >
                  Unblock
                </Link>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
