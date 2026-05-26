import { currentUser } from "@clerk/nextjs/server";
import { redirect } from "next/navigation";
import { getUser } from "@/db/queries/Users";
import { getStaffCanteen, getTodayMenu } from "@/db/queries/Staff";
import { UtensilsCrossed, Leaf, Clock } from "lucide-react";

const SLOT_ORDER = ["breakfast", "lunch", "snack"];
const SLOT_LABEL: Record<string, string> = {
  breakfast: "Breakfast",
  lunch: "Lunch",
  snack: "Snack",
};

export default async function StaffMenuPage() {
  const clerkUser = await currentUser();
  if (!clerkUser) redirect("/sign-in");
  const dbUser = await getUser(clerkUser.id);
  if (!dbUser) redirect("/sign-in");

  const canteen = await getStaffCanteen(dbUser.id);
  if (!canteen) redirect("/canteen-staff");

  const todayMenu = await getTodayMenu(canteen.id);

  // Group by meal slot
  const grouped: Record<string, any[]> = {};
  for (const dm of todayMenu) {
    const slot = dm.mealSlot ?? "other";
    if (!grouped[slot]) grouped[slot] = [];
    grouped[slot].push(dm);
  }

  const slots = SLOT_ORDER.filter((s) => grouped[s]?.length);

  return (
    <div className="max-w-3xl mx-auto space-y-6">
      <div>
        <h1
          className="text-2xl font-bold tracking-tight"
          style={{ color: "var(--text-primary)" }}
        >
          Today&apos;s Menu
        </h1>
        <p className="text-sm mt-1" style={{ color: "var(--text-secondary)" }}>
          {canteen.name} ·{" "}
          {new Date().toLocaleDateString("en-US", {
            weekday: "long",
            month: "long",
            day: "numeric",
          })}
        </p>
      </div>

      {todayMenu.length === 0 ?
        <div
          className="rounded-2xl border py-20 text-center"
          style={{
            background: "var(--bg-card)",
            borderColor: "var(--border-card)",
            boxShadow: "var(--shadow-card)",
          }}
        >
          <UtensilsCrossed
            size={36}
            className="mx-auto mb-3"
            style={{ color: "var(--text-muted)" }}
          />
          <p
            className="text-sm font-medium"
            style={{ color: "var(--text-secondary)" }}
          >
            No menu scheduled for today
          </p>
          <p className="text-xs mt-1" style={{ color: "var(--text-muted)" }}>
            The school admin can schedule items from the admin menu page.
          </p>
        </div>
      : <div className="space-y-6">
          {slots.map((slot) => (
            <div key={slot}>
              {/* Slot header */}
              <div className="flex items-center gap-2 mb-3">
                <Clock size={14} style={{ color: "var(--text-muted)" }} />
                <h2
                  className="text-sm font-semibold uppercase tracking-wider"
                  style={{ color: "var(--text-secondary)" }}
                >
                  {SLOT_LABEL[slot]}
                </h2>
                <span
                  className="px-2 py-0.5 rounded-full text-xs"
                  style={{
                    background: "var(--bg-tertiary)",
                    color: "var(--text-muted)",
                  }}
                >
                  {grouped[slot].length} item
                  {grouped[slot].length !== 1 ? "s" : ""}
                </span>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                {grouped[slot].map((dm: any) => {
                  const item = dm.menuItem;
                  return (
                    <div
                      key={dm.id}
                      className="rounded-xl border p-4 flex items-start gap-4"
                      style={{
                        background: "var(--bg-card)",
                        borderColor: "var(--border-card)",
                        boxShadow: "var(--shadow-card)",
                      }}
                    >
                      {/* Category icon */}
                      <div
                        className="w-10 h-10 rounded-xl flex items-center justify-center text-lg shrink-0"
                        style={{ background: "var(--bg-secondary)" }}
                      >
                        {item?.category === "drink" ?
                          "🥤"
                        : item?.category === "dessert" ?
                          "🍰"
                        : item?.category === "snack" ?
                          "🍿"
                        : item?.category === "side" ?
                          "🥗"
                        : "🍽️"}
                      </div>

                      <div className="flex-1 min-w-0">
                        <div className="flex items-start justify-between gap-2">
                          <h3
                            className="text-sm font-semibold leading-tight"
                            style={{ color: "var(--text-primary)" }}
                          >
                            {item?.name}
                          </h3>
                          <span
                            className="text-sm font-bold shrink-0"
                            style={{ color: "var(--text-primary)" }}
                          >
                            Rs. {parseFloat(item?.price ?? "0").toFixed(0)}
                          </span>
                        </div>

                        {item?.description && (
                          <p
                            className="text-xs mt-0.5 line-clamp-1"
                            style={{ color: "var(--text-muted)" }}
                          >
                            {item.description}
                          </p>
                        )}

                        <div className="flex items-center gap-2 mt-2 flex-wrap">
                          {item?.calories && (
                            <span
                              className="text-xs"
                              style={{ color: "var(--text-muted)" }}
                            >
                              {item.calories} kcal
                            </span>
                          )}
                          {item?.isVegetarian && (
                            <span
                              className="flex items-center gap-0.5 px-1.5 py-0.5 rounded-full text-xs"
                              style={{
                                background: "rgba(34,197,94,0.1)",
                                color: "#22c55e",
                              }}
                            >
                              <Leaf size={10} /> Veg
                            </span>
                          )}
                          {item?.containsNuts && (
                            <span
                              className="px-1.5 py-0.5 rounded-full text-xs"
                              style={{
                                background: "rgba(245,158,11,0.1)",
                                color: "#f59e0b",
                              }}
                            >
                              Contains Nuts
                            </span>
                          )}
                          {item?.containsGluten && (
                            <span
                              className="px-1.5 py-0.5 rounded-full text-xs"
                              style={{
                                background: "rgba(249,115,22,0.1)",
                                color: "#f97316",
                              }}
                            >
                              Gluten
                            </span>
                          )}
                          {item?.containsDairy && (
                            <span
                              className="px-1.5 py-0.5 rounded-full text-xs"
                              style={{
                                background: "rgba(59,130,246,0.1)",
                                color: "#3b82f6",
                              }}
                            >
                              Dairy
                            </span>
                          )}
                          {dm.availableQuantity != null && (
                            <span
                              className="text-xs ml-auto"
                              style={{ color: "var(--text-muted)" }}
                            >
                              Qty: {dm.availableQuantity}
                            </span>
                          )}
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          ))}
        </div>
      }
    </div>
  );
}
