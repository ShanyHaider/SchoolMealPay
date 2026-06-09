import { currentUser } from "@clerk/nextjs/server";
import { redirect } from "next/navigation";
import { getChildrenByParent } from "@/db/queries/Students";
import { getOrdersByStudent } from "@/db/queries/Orders";
import { getDefaultNutritionTarget } from "@/db/queries/Nutrition";
import Link from "next/link"; // 👈 Next.js uppercase component
import {
  Info,
  Salad,
  Activity,
  ChevronRight,
  Flame,
  Dna,
  Leaf,
  Wheat,
  Droplets,
} from "lucide-react";
import { NutrientBar } from "./_components/NutrientBar";
import { getUserFromDb } from "@/features/users/queries";
import { NutritionChat } from "./_components/NutritionChat";
import { AiNutritionInsight } from "./_components/AiNutritionInsight";
import type { NutritionAverages } from "@/types/nutritionTypes";
import { getMenuItemsByCanteen } from "@/db/queries/Canteen";

function computeNutritionAverages(orders: any[]): NutritionAverages | null {
  const recentOrders = orders
    .filter((o) => o.status === "delivered")
    .slice(0, 30);

  if (recentOrders.length === 0) return null;

  let totalCalories = 0,
    totalProtein = 0,
    totalFiber = 0,
    totalCarbs = 0,
    totalFat = 0,
    count = 0;

  for (const order of recentOrders) {
    for (const item of order.orderItems) {
      const mi = item.menuItem;
      if (!mi) continue;
      const qty = item.quantity;
      totalCalories += (mi.calories ?? 0) * qty;
      totalProtein += parseFloat(mi.proteinG ?? "0") * qty;
      totalFiber += parseFloat(mi.fiberG ?? "0") * qty;
      totalCarbs += parseFloat(mi.carbsG ?? "0") * qty;
      totalFat += parseFloat(mi.fatG ?? "0") * qty;
      count++;
    }
  }

  if (count === 0) return null;

  const days = recentOrders.length;
  return {
    calories: Math.round(totalCalories / days),
    protein: Math.round(totalProtein / days),
    fiber: Math.round(totalFiber / days),
    carbs: Math.round(totalCarbs / days),
    fat: Math.round(totalFat / days),
  };
}

function deriveTopMeals(orders: any[]): { name: string; healthStatus: string }[] {
  const freq: Record<string, { name: string; healthStatus: string; count: number }> = {};

  orders
    .filter((o) => o.status === "delivered")
    .slice(0, 30)
    .forEach((order) => {
      order.orderItems.forEach((item: any) => {
        const mi = item.menuItem;
        if (!mi) return;
        const sugar = parseFloat(mi.sugarG ?? "0");
        const healthStatus =
          mi.calories > 700
            ? "High Calorie"
            : sugar > 15
              ? "Unhealthy"
              : "Healthy";
        if (!freq[mi.name])
          freq[mi.name] = { name: mi.name, healthStatus, count: 0 };
        freq[mi.name].count += item.quantity;
      });
    });

  return Object.values(freq)
    .sort((a, b) => b.count - a.count)
    .slice(0, 3)
    .map(({ name, healthStatus }) => ({ name, healthStatus }));
}

const FALLBACK_TARGETS = {
  calories: 2000,
  protein: 50,
  fiber: 25,
  carbs: 260,
  fat: 70,
};

export default async function NutritionPage() {
  try {
    const clerkUser = await currentUser();
    if (!clerkUser) redirect("/sign-in");
    const dbUser = await getUserFromDb(clerkUser.id);
    if (!dbUser) redirect("/sign-in");

    const [children, dbTarget] = await Promise.all([
      getChildrenByParent(dbUser.id),
      getDefaultNutritionTarget(),
    ]);

    const approvedChildren = children.filter((c) => c.status === "approved");

    const targets = {
      calories: dbTarget?.dailyCalories ?? FALLBACK_TARGETS.calories,
      protein: dbTarget?.dailyProteinG
        ? Math.round(parseFloat(dbTarget.dailyProteinG))
        : FALLBACK_TARGETS.protein,
      fiber: dbTarget?.dailyFiberG
        ? Math.round(parseFloat(dbTarget.dailyFiberG))
        : FALLBACK_TARGETS.fiber,
      carbs: dbTarget?.dailyCarbsG
        ? Math.round(parseFloat(dbTarget.dailyCarbsG))
        : FALLBACK_TARGETS.carbs,
      fat: dbTarget?.dailyFatG
        ? Math.round(parseFloat(dbTarget.dailyFatG))
        : FALLBACK_TARGETS.fat,
    };

    const childOrders = await Promise.all(
      approvedChildren.map(async (link) => {
        const orders = await getOrdersByStudent(link.student.id);

        // 1. Safe, zero-any checks using standard property lookups
        const studentCanteenId =
          ("canteenId" in link.student && typeof link.student.canteenId === "string")
            ? link.student.canteenId
            : (link.student.class && "canteenId" in link.student.class && typeof link.student.class.canteenId === "string")
              ? link.student.class.canteenId
              : null;

        const rawMenuItems = studentCanteenId
          ? await getMenuItemsByCanteen(studentCanteenId)
          : [];

        // 2. Strongly type the parameter instead of using implicit any
        const menuItems = rawMenuItems.map((item: typeof rawMenuItems[number]) => ({
          id: item.id,
          name: item.name,
        }));

        return { link, orders, menuItems };
      }),
    );

    const chatChildren = childOrders
      .filter(({ orders }) => computeNutritionAverages(orders) !== null)
      .map(({ link, orders }) => ({
        name: link.student.name,
        avg: computeNutritionAverages(orders)!,
      }));

    return (
      <div className="flex flex-col gap-8 max-w-7xl mx-auto px-4 pb-16">
        {/* Top Header Section */}
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
            Monitor the average daily nutrient intake for your children based
            on their school meal history over the last 30 orders.
          </p>
        </div>

        {/* Disclaimer Message */}
        <div className="flex items-start gap-4 p-4 bg-blue-50/50 border border-blue-100 rounded-2xl dark:bg-blue-900/10 dark:border-blue-800/50">
          <Info className="text-blue-500 shrink-0 mt-0.5" size={20} />
          <p className="text-sm text-blue-700/80 dark:text-blue-300/80 leading-relaxed">
            <strong className="text-blue-800 dark:text-blue-200">
              Disclaimer:
            </strong>{" "}
            This dashboard provides estimates based on standard recipes. It is
            intended for educational purposes and should not replace
            professional medical advice or nutritional counseling.
            {dbTarget && (
              <span className="block mt-1 text-xs opacity-70">
                Targets based on: {dbTarget.label}
                {dbTarget.source ? ` (${dbTarget.source})` : ""}
              </span>
            )}
          </p>
        </div>

        {approvedChildren.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-24 bg-(--bg-card) border border-dashed border-(--border-card) rounded-3xl">
            <div className="p-4 bg-(--bg-tertiary) rounded-full mb-4">
              <Salad size={40} className="text-(--text-muted)" strokeWidth={1.5} />
            </div>
            <p className="text-(--text-secondary) font-medium">No active student profiles found.</p>
            {/* Fixed standard uppercase component path here */}
            <Link
              href="/parent/children/link"
              className="mt-6 px-6 py-2.5 bg-(--accent) text-(--accent-text) rounded-xl text-sm font-semibold hover:opacity-90 transition-opacity flex items-center gap-2"
            >
              Link a child <ChevronRight size={16} />
            </Link>
          </div>
        ) : (
          <div className="space-y-10">
            {childOrders.map(({ link, orders, menuItems }) => {
              const avg = computeNutritionAverages(orders);
              const topMeals = deriveTopMeals(orders);
              const mealCount = orders
                .filter((o) => o.status === "delivered")
                .slice(0, 30).length;

              if (avg === null) {
                return (
                  <div key={link.student.id} className="w-full bg-(--bg-card) border border-(--border-card) rounded-3xl p-8 shadow-sm">
                    <div className="flex flex-col items-center justify-center py-12 text-center">
                      <div className="w-12 h-12 rounded-2xl overflow-hidden border border-(--border-card) mb-4 bg-(--bg-tertiary)">
                        {link.student.imageUrl ? (
                          <img src={link.student.imageUrl} alt={link.student.name} className="w-full h-full object-cover" />
                        ) : (
                          <div className="w-full h-full flex items-center justify-center text-lg font-bold text-(--text-secondary)">
                            {link.student.name.charAt(0).toUpperCase()}
                          </div>
                        )}
                      </div>
                      <h3 className="font-bold text-lg text-(--text-primary) mb-1">{link.student.name}</h3>
                      <p className="text-sm text-(--text-muted) px-8 max-w-sm">
                        Insufficient data to generate a report. Trends appear after the first few delivered meals.
                      </p>
                    </div>
                  </div>
                );
              }

              return (
                <div key={link.student.id} className="w-full bg-(--bg-card) border border-(--border-card) rounded-3xl p-6 md:p-8 shadow-sm">
                  <div className="grid grid-cols-1 lg:grid-cols-12 gap-10 items-start relative">

                    {/* LEFT COLUMN - Sticky Frame */}
                    <div className="lg:col-span-5 lg:sticky lg:top-24 space-y-6 self-start">
                      <div className="flex items-center gap-4">
                        <div className="w-14 h-14 rounded-2xl overflow-hidden border border-(--border-card) shrink-0 bg-(--bg-tertiary)">
                          {link.student.imageUrl ? (
                            <img src={link.student.imageUrl} alt={link.student.name} className="w-full h-full object-cover" />
                          ) : (
                            <div className="w-full h-full flex items-center justify-center text-xl font-bold text-(--text-secondary)">
                              {link.student.name.charAt(0).toUpperCase()}
                            </div>
                          )}
                        </div>
                        <div>
                          <h3 className="font-bold text-xl text-(--text-primary)">{link.student.name}</h3>
                          <p className="text-xs text-(--text-muted) flex items-center gap-1 mt-0.5">
                            <Activity size={12} /> {mealCount} meals analysed
                          </p>
                        </div>
                      </div>

                      {/* Nutrient Bars Panel */}
                      <div className="space-y-5 p-5 bg-(--bg-tertiary)/40 rounded-2xl border border-(--border-card)/60">
                        <NutrientBar
                          label="Calories"
                          icon={<Flame size={14} />}
                          value={avg.calories}
                          target={targets.calories}
                          unit="kcal"
                          color="bg-orange-500"
                          accentColor="orange"
                        />
                        <NutrientBar
                          label="Protein"
                          icon={<Dna size={14} />}
                          value={avg.protein}
                          target={targets.protein}
                          unit="g"
                          color="bg-blue-500"
                          accentColor="blue"
                        />
                        <NutrientBar
                          label="Carbohydrates"
                          icon={<Wheat size={14} />}
                          value={avg.carbs}
                          target={targets.carbs}
                          unit="g"
                          color="bg-yellow-500"
                          accentColor="yellow"
                        />
                        <NutrientBar
                          label="Fat"
                          icon={<Droplets size={14} />}
                          value={avg.fat}
                          target={targets.fat}
                          unit="g"
                          color="bg-purple-500"
                          accentColor="purple"
                        />
                        <NutrientBar
                          label="Fiber"
                          icon={<Leaf size={14} />}
                          value={avg.fiber}
                          target={targets.fiber}
                          unit="g"
                          color="bg-emerald-500"
                          accentColor="emerald"
                        />
                      </div>
                    </div>

                    {/* RIGHT COLUMN */}
                    <div className="lg:col-span-7 space-y-6 lg:border-l lg:border-(--border-card)/60 lg:pl-10">
                      <AiNutritionInsight
                        childName={link.student.name}
                        avg={avg}
                        targets={targets}
                        topMeals={topMeals}
                        menuItems={menuItems}
                      />
                    </div>

                  </div>
                </div>
              );
            })}

            {/* Bottom Global Consultation Chat Module */}
            {chatChildren.length > 0 && (
              <div className="pt-4">
                <NutritionChat children={chatChildren} targets={targets} />
              </div>
            )}
          </div>
        )}
      </div>
    );
  } catch (error) {
    console.error("[nutrition] PAGE CRASH:", error);
    return (
      <div className="p-8 max-w-2xl mx-auto">
        <div className="p-4 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-2xl">
          <p className="font-bold text-red-600 dark:text-red-400 mb-2">Nutrition page error — check terminal</p>
          <pre className="text-xs text-red-500 whitespace-pre-wrap">{String(error)}</pre>
        </div>
      </div>
    );
  }
}