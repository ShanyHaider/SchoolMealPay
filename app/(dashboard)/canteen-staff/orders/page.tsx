import { currentUser } from "@clerk/nextjs/server";
import { redirect } from "next/navigation";
import { getStaffCanteen, getTodayOrders } from "@/db/queries/Staff";
import { OrdersBoard } from "./_components/OrdersBoard";
import { getUserFromDb } from "@/features/users/queries";

export default async function OrdersPage() {
  const clerkUser = await currentUser();
  if (!clerkUser) redirect("/sign-in");
  const dbUser = await getUserFromDb(clerkUser.id);
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
