import { getAllCanteens } from "@/db/queries/Admin";
import { CanteenClient } from "./_components/CanteenCLient";

export default async function CanteenPage() {
  const canteens = await getAllCanteens();

  return (
    <div className="max-w-6xl mx-auto space-y-6">
      <div>
        <h1
          className="text-2xl font-bold tracking-tight"
          style={{ color: "var(--text-primary)" }}
        >
          Canteens
        </h1>
        <p className="text-sm mt-1" style={{ color: "var(--text-secondary)" }}>
          Manage canteen locations, hours, and assigned staff.
        </p>
      </div>
      <CanteenClient canteens={canteens} />
    </div>
  );
}
