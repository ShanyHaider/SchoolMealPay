import { getAllCanteens, getInventoryByCanteen } from "@/db/queries/Admin";
import { InventoryClient } from "./_components/InventoryClient";

export default async function InventoryPage() {
  const canteens = await getAllCanteens();
  const firstCanteenId = canteens[0]?.id ?? "";
  const inventory =
    firstCanteenId ? await getInventoryByCanteen(firstCanteenId) : [];

  return (
    <div className="space-y-6">
      <div>
        <h1
          className="text-2xl font-bold tracking-tight"
          style={{ color: "var(--text-primary)" }}
        >
          Inventory
        </h1>
        <p className="text-sm mt-1" style={{ color: "var(--text-secondary)" }}>
          Track stock levels and get alerts when items run low.
        </p>
      </div>
      <InventoryClient
        canteens={canteens}
        initialInventory={inventory}
        defaultCanteenId={firstCanteenId}
      />
    </div>
  );
}
