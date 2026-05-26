import { currentUser } from "@clerk/nextjs/server";
import { redirect } from "next/navigation";
import { getUser } from "@/db/queries/Users";
import { getStaffCanteen, getTodayOrders } from "@/db/queries/Staff";
import { OrdersBoard } from "./_components/OrdersBoard";

export default async function OrdersPage() {
  const clerkUser = await currentUser();
  if (!clerkUser) redirect("/sign-in");
  const dbUser = await getUser(clerkUser.id);
  if (!dbUser) redirect("/sign-in");

  const canteen = await getStaffCanteen(dbUser.id);
  if (!canteen) redirect("/canteen-staff");

  const orders = await getTodayOrders(canteen.id);

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
