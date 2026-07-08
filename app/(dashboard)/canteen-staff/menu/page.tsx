import { connection } from "next/server";
import { getAllCanteens } from "@/db/queries/Admin";
import { getAllMenuItemsCached, getWeeklyMenu } from "@/db/queries/Menu"; // adjust path to wherever your cached queries live
import { StaffMenuClient } from "./_components/StaffMenuClient";

function getWeekBounds(now: Date) {
  const fmt = (d: Date) =>
    `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;

  const start = fmt(now);
  const end = new Date(now);
  end.setDate(now.getDate() + 6);

  return { start, end: fmt(end) };
}

export default async function StaffMenuPage() {
  await connection();

  const now = new Date();
  const { start, end } = getWeekBounds(now);

  const canteens = await getAllCanteens();
  const firstCanteenId = canteens[0]?.id ?? "";

  const [menuItems, dailyMenus] = await Promise.all([
    getAllMenuItemsCached(),
    firstCanteenId ?
      getWeeklyMenu(firstCanteenId, start, end)
      : Promise.resolve([]),
  ]);

  return (
    <div className="max-w-6xl mx-auto space-y-6">
      <div>
        <h1
          className="text-2xl font-bold tracking-tight"
          style={{ color: "var(--text-primary)" }}
        >
          Menu Management
        </h1>
        <p className="text-sm mt-1" style={{ color: "var(--text-secondary)" }}>
          View the food catalogue and schedule daily menus for each canteen.
        </p>
      </div>
      <StaffMenuClient
        menuItems={menuItems}
        dailyMenus={dailyMenus}
        canteens={canteens}
        weekStart={start}
        weekEnd={end}
        defaultCanteenId={firstCanteenId}
      />
    </div>
  );
}
