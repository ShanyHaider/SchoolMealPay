import { getAllCanteens } from "@/db/queries/Admin";
import { CanteenClient } from "./_components/CanteenCLient";
import { auth } from "@clerk/nextjs/server";
import { redirect } from "next/navigation";
import { getUserFromDb } from "@/features/users/queries";

export default async function CanteenPage() {

  const { userId } = await auth();
  if (!userId) redirect("/sign-in");

  const dbUser = await getUserFromDb(userId);
  if (!dbUser || dbUser.role !== "school_admin") redirect("/");


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
