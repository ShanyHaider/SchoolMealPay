import {
  getAllMenuItems,
  getDailyMenusByWeek,
  getAllCanteens,
} from "@/db/queries/Admin";
import { MenuClient } from "./_components/MenuClient";

function getWeekBounds() {
  const now = new Date();
  const day = now.getDay(); // 0=Sun
  const monday = new Date(now);
  monday.setDate(now.getDate() - (day === 0 ? 6 : day - 1));
  const sunday = new Date(monday);
  sunday.setDate(monday.getDate() + 6);

  const fmt = (d: Date) => d.toISOString().split("T")[0];
  return { start: fmt(monday), end: fmt(sunday) };
}

export default async function MenuPage() {
  const canteens = await getAllCanteens();
  const firstCanteenId = canteens[0]?.id ?? "";
  const { start, end } = getWeekBounds();

  const [menuItems, dailyMenus] = await Promise.all([
    getAllMenuItems(),
    firstCanteenId ?
      getDailyMenusByWeek(start, end, firstCanteenId)
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
          Manage your food catalogue and schedule daily menus for each canteen.
        </p>
      </div>
      <MenuClient
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
