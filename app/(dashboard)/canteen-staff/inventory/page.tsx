import { currentUser } from "@clerk/nextjs/server";
import { redirect } from "next/navigation";
import { getUser } from "@/db/queries/Users";
import { getStaffCanteen, getCanteenInventory } from "@/db/queries/Staff";
import { InventoryClient } from "./_components/InventoryClient";

export default async function StaffInventoryPage() {
  const clerkUser = await currentUser();
  if (!clerkUser) redirect("/sign-in");
  const dbUser = await getUser(clerkUser.id);
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
