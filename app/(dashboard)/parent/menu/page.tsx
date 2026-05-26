import { currentUser } from "@clerk/nextjs/server";
import { redirect } from "next/navigation";
import { getUser } from "@/db/queries/Users";
import { getChildrenByParent } from "@/db/queries/Students";
import { getAllCanteens, getDailyMenu } from "@/db/queries/Canteen";
import { MenuClient } from "./_components/MenuClient";
import { FadeIn } from "@/components/Motion";

export default async function MenuPage({
  searchParams,
}: {
  searchParams: Promise<{ date?: string; canteen?: string }>;
}) {
  const clerkUser = await currentUser();
  if (!clerkUser) redirect("/sign-in");
  const dbUser = await getUser(clerkUser.id);
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
        {/* The MenuClient handles the filters, the grid, and the order sidebar */}
        <MenuClient
          canteens={activeCanteens}
          menuItems={flattenedMenuItems}
          students={linkedStudents}
          parentId={dbUser.id}
          selectedCanteenId={selectedCanteenId}
          selectedDate={selectedDate}
          today={today}
        />
      </FadeIn>
    </div>
  );
}
