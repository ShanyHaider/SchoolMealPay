import { connection } from "next/server";
import { auth } from "@clerk/nextjs/server";
import { redirect } from "next/navigation";
import { getStaffCanteen, getTodayOrders } from "@/db/queries/Staff";
import { OrdersBoard } from "./_components/OrdersBoard";
import { getUserFromDb } from "@/features/users/queries";

export default async function OrdersPage() {
  // Force this segment into dynamic (request-time) rendering.
  // Each route segment is an independent prerender entry point under
  // Cache Components — the layout's connection() does NOT propagate here.
  await connection();

  const { userId } = await auth();
  if (!userId) redirect("/sign-in");
  const dbUser = await getUserFromDb(userId);
  if (!dbUser) redirect("/sign-in");

  const canteen = await getStaffCanteen(dbUser.id);
  if (!canteen) redirect("/canteen-staff");

  const today = new Date().toISOString().split("T")[0];
  const orders = await getTodayOrders(canteen.id, today);


  return (
    <div className="max-w-7xl mx-auto space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1
            className="text-2xl font-bold tracking-tight"
            style={{ color: "var(--text-primary)" }}
          >
            Live Orders
          </h1>
          <p
            className="text-sm mt-1"
            style={{ color: "var(--text-secondary)" }}
          >
            {canteen.name} ·{" "}
            {new Date().toLocaleDateString("en-US", {
              weekday: "long",
              month: "short",
              day: "numeric",
            })}
          </p>
        </div>
      </div>

      <OrdersBoard orders={orders} canteenId={canteen.id} />
    </div>
  );
}
