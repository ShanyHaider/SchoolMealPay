import { currentUser } from "@clerk/nextjs/server";
import { redirect } from "next/navigation";
import { getChildrenByParent } from "@/db/queries/Students";
import { getAllCanteens, getDailyMenu } from "@/db/queries/Canteen";
import { MenuClient } from "./_components/MenuClient";
import { FadeIn } from "@/components/Motion";
import { getUserFromDb } from "@/features/users/queries";

// Build weekday dates (Mon–Fri) for the next `weeks` weeks starting from today
function getUpcomingWeekdays(from: Date, weeks: number): string[] {
  const dates: string[] = [];
  const d = new Date(from);
  d.setHours(0, 0, 0, 0);
  const limit = weeks * 7;
  for (let i = 0; i < limit && dates.length < weeks * 5; i++) {
    const day = d.getDay();
    if (day !== 0 && day !== 6) {
      dates.push(d.toISOString().split("T")[0]);
    }
    d.setDate(d.getDate() + 1);
  }
  return dates;
}

export default async function MenuPage({
  searchParams,
}: {
  searchParams: Promise<{ date?: string; canteen?: string }>;
}) {
  const clerkUser = await currentUser();
  if (!clerkUser) redirect("/sign-in");
  const dbUser = await getUserFromDb(clerkUser.id);
  if (!dbUser) redirect("/sign-in");

  const filters = await searchParams;
  const today = new Date().toISOString().split("T")[0];
  const selectedDate = filters.date ?? today;

  const [children, canteens] = await Promise.all([
    getChildrenByParent(dbUser.id),
    getAllCanteens(),
  ]);

  const activeCanteens = canteens.filter((c) => c.isActive);
  const selectedCanteenId = filters.canteen ?? activeCanteens[0]?.id ?? "";

  // Today's menu for the cart
  const menuSchedule =
    selectedCanteenId ?
      await getDailyMenu(selectedCanteenId, selectedDate)
    : [];

  const flattenedMenuItems = menuSchedule.map((item) => ({
    ...item.menuItem,
    mealSlot: item.mealSlot,
    scheduleId: item.id,
  }));

  const linkedStudents = children
    .filter((c) => c.status === "approved" && c.student.orderingEnabled)
    .map((c) => c.student);

  // ── menuByDate for the recurring modal ────────────────────────────────────
  // Fetch 8 weeks of upcoming weekdays so the modal can show/pick meals.
  // We run these in parallel — getDailyMenu is cheap (indexed canteen+date).
  let menuByDate: Record<
    string,
    { id: string; name: string; price: number }[]
  > = {};

  if (selectedCanteenId) {
    const weekdays = getUpcomingWeekdays(new Date(), 8);
    const results = await Promise.all(
      weekdays.map((date) =>
        getDailyMenu(selectedCanteenId, date).then((schedule) => ({
          date,
          items: schedule
            .filter((s) => s.menuItem.isAvailable)
            .map((s) => ({
              id: s.menuItem.id,
              name: s.menuItem.name,
              price: s.menuItem.price,
            })),
        })),
      ),
    );
    for (const { date, items } of results) {
      if (items.length > 0) menuByDate[date] = items;
    }
  }

  // ── nutritionByChild for AI picks in the recurring modal ──────────────────
  // Optional — if getNutritionAverages isn't built yet, the modal degrades
  // gracefully (defaults to first item per day, no AI pre-fill).
  type NutritionEntry = {
    avg: {
      calories: number;
      protein: number;
      carbs: number;
      fat: number;
      fiber: number;
    };
    targets: {
      calories: number;
      protein: number;
      carbs: number;
      fat: number;
      fiber: number;
    };
  };
  const nutritionByChild: Record<string, NutritionEntry> = {};

  return (
    <div className="w-full max-w-6xl mx-auto">
      <FadeIn>
        <div className="mb-10">
          <h1 className="text-3xl font-black tracking-tight text-black dark:text-white">
            Daily Menu
          </h1>
          <p className="text-gray-500 dark:text-gray-400 mt-1 font-medium italic">
            {new Date(selectedDate).toLocaleDateString("en-US", {
              weekday: "long",
              year: "numeric",
              month: "long",
              day: "numeric",
            })}
          </p>
        </div>
      </FadeIn>

      <FadeIn delay={0.1}>
        <MenuClient
          canteens={activeCanteens}
          menuItems={flattenedMenuItems}
          students={linkedStudents}
          parentId={dbUser.id}
          selectedCanteenId={selectedCanteenId}
          selectedDate={selectedDate}
          today={today}
          menuByDate={menuByDate}
          nutritionByChild={nutritionByChild}
        />
      </FadeIn>
    </div>
  );
}
