import { auth } from "@clerk/nextjs/server";
import { redirect } from "next/navigation";
import { getStaffCanteen, getCanteenInventory } from "@/db/queries/Staff";
import { InventoryClient } from "./_components/InventoryClient";
import { getUserFromDb } from "@/features/users/queries";

export default async function StaffInventoryPage() {
  const { userId } = await auth();
  if (!userId) redirect("/sign-in");
  const dbUser = await getUserFromDb(userId);
  if (!dbUser) redirect("/sign-in");

  const canteen = await getStaffCanteen(dbUser.id);
  if (!canteen) redirect("/canteen-staff");

  const inventory = await getCanteenInventory(canteen.id);

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      <div>
        <h1
          className="text-2xl font-bold tracking-tight"
          style={{ color: "var(--text-primary)" }}
        >
          Inventory
        </h1>
        <p className="text-sm mt-1" style={{ color: "var(--text-secondary)" }}>
          View and update stock levels for {canteen.name}.
        </p>
      </div>
      <InventoryClient inventory={inventory} />
    </div>
  );
}
