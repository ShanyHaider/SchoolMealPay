import { currentUser } from "@clerk/nextjs/server";
import { redirect } from "next/navigation";
import { getUser } from "@/db/queries/Users";
import { getChildrenByParent } from "@/db/queries/Students";
import { getOrdersByStudent } from "@/db/queries/Orders";
import Link from "next/link";
import {
  Info,
  Salad,
  UserCircle,
  Activity,
  ChevronRight,
  Flame,
  Dna,
  Leaf,
} from "lucide-react";
import { NutrientBar } from "./NutrientBar"; // Separate component below

function computeNutritionAverages(orders: any[]) {
  const recentOrders = orders
    .filter((o) => o.status === "delivered")
    .slice(0, 30);

  if (recentOrders.length === 0) return null;

  let totalCalories = 0,
    totalProtein = 0,
    totalFiber = 0,
    count = 0;

  for (const order of recentOrders) {
    for (const item of order.orderItems) {
      const mi = item.menuItem;
      if (!mi) continue;
      const qty = item.quantity;
      totalCalories += (mi.calories ?? 0) * qty;
      totalProtein += parseFloat(mi.proteinG ?? "0") * qty;
      totalFiber += parseFloat(mi.fiberG ?? "0") * qty;
      count++;
    }
  }

  if (count === 0) return null;
  return {
    calories: Math.round(totalCalories / recentOrders.length),
    protein: Math.round(totalProtein / recentOrders.length),
    fiber: Math.round(totalFiber / recentOrders.length),
  };
}

export default async function NutritionPage() {
  const clerkUser = await currentUser();
  if (!clerkUser) redirect("/sign-in");
  const dbUser = await getUser(clerkUser.id);
  if (!dbUser) redirect("/sign-in");

  const children = await getChildrenByParent(dbUser.id);
  const approvedChildren = children.filter((c) => c.status === "approved");

  const childOrders = await Promise.all(
    approvedChildren.map(async (link) => ({
      link,
      orders: await getOrdersByStudent(link.student.id),
    })),
  );

  return (
    <div className="flex flex-col gap-8 max-w-6xl mx-auto">
      {/* Header */}
      <div className="flex flex-col gap-2">
        <div className="flex items-center gap-3">
          <div className="p-2 bg-green-100 dark:bg-green-900/30 rounded-lg text-green-600">
            <Activity size={24} />
          </div>
          <h1 className="text-3xl font-bold text-(--text-primary) tracking-tight">
            Nutrition Insights
          </h1>
        </div>
        <p className="text-(--text-secondary) max-w-2xl">
          Monitor the average daily nutrient intake for your children based on
          their school meal history over the last 30 orders.
        </p>
      </div>

      {/* Medical Disclaimer */}
      <div className="group flex items-start gap-4 p-4 bg-blue-50/50 border border-blue-100 rounded-2xl dark:bg-blue-900/10 dark:border-blue-800/50 transition-colors">
        <Info className="text-blue-500 shrink-0 mt-0.5" size={20} />
        <p className="text-sm text-blue-700/80 dark:text-blue-300/80 leading-relaxed">
          <strong className="text-blue-800 dark:text-blue-200">
            Disclaimer:
          </strong>{" "}
          This dashboard provides estimates based on standard recipes. It is
          intended for educational purposes and should not replace professional
          medical advice or nutritional counseling.
        </p>
      </div>

      {approvedChildren.length === 0 ?
        <div className="flex flex-col items-center justify-center py-24 bg-(--bg-card) border border-dashed border-(--border-card) rounded-3xl">
          <div className="p-4 bg-(--bg-tertiary) rounded-full mb-4">
            <Salad
              size={40}
              className="text-(--text-muted)"
              strokeWidth={1.5}
            />
          </div>
          <p className="text-(--text-secondary) font-medium">
            No active student profiles found.
          </p>
          <Link
            href="/parent/children/link"
            className="mt-6 px-6 py-2.5 bg-(--accent) text-(--accent-text) rounded-xl text-sm font-semibold hover:opacity-90 transition-opacity flex items-center gap-2"
          >
            Link a child <ChevronRight size={16} />
          </Link>
        </div>
      : <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {childOrders.map(({ link, orders }) => {
            const avg = computeNutritionAverages(orders);
            const mealCount = orders
              .filter((o) => o.status === "delivered")
              .slice(0, 30).length;

            return (
              <div
                key={link.student.id}
                className="group flex flex-col bg-(--bg-card) border border-(--border-card) rounded-3xl p-6 shadow-sm hover:shadow-md transition-all"
              >
                {/* Child Card Header */}
                <div className="flex items-center justify-between mb-8">
                  <div className="flex items-center gap-4">
                    <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-(--accent) to-green-500 flex items-center justify-center text-white text-lg font-bold shadow-lg shadow-green-500/20">
                      {link.student.name.charAt(0).toUpperCase()}
                    </div>
                    <div>
                      <h3 className="font-bold text-lg text-(--text-primary)">
                        {link.student.name}
                      </h3>
                      <p className="text-xs text-(--text-muted) flex items-center gap-1">
                        <Activity size={12} /> {mealCount} meals analyzed
                      </p>
                    </div>
                  </div>
                </div>

                {avg === null ?
                  <div className="flex-1 flex flex-col items-center justify-center py-10 text-center">
                    <p className="text-sm text-(--text-muted) px-8">
                      Insufficient data to generate a report. Trends appear
                      after the first few delivered meals.
                    </p>
                  </div>
                : <div className="space-y-6">
                    <NutrientBar
                      label="Calories"
                      icon={<Flame size={14} />}
                      value={avg.calories}
                      target={2000}
                      unit="kcal"
                      color="bg-orange-500"
                    />
                    <NutrientBar
                      label="Protein"
                      icon={<Dna size={14} />}
                      value={avg.protein}
                      target={50}
                      unit="g"
                      color="bg-blue-500"
                    />
                    <NutrientBar
                      label="Fiber"
                      icon={<Leaf size={14} />}
                      value={avg.fiber}
                      target={25}
                      unit="g"
                      color="bg-emerald-500"
                    />
                  </div>
                }
              </div>
            );
          })}
        </div>
      }
    </div>
  );
}
