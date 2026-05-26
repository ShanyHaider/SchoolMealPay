import { getAllStaff, getAllCanteens } from "@/db/queries/Admin";
import { StaffClient } from "./_components/StaffClient";
import { currentUser } from "@clerk/nextjs/server";
import { getUser } from "@/db/queries/Users";
import { redirect } from "next/navigation";

export default async function StaffPage() {
  const clerkUser = await currentUser();
  if (!clerkUser) redirect("/sign-in");
  const dbUser = await getUser(clerkUser.id);
  if (!dbUser) redirect("/sign-in");

  const [staff, canteens] = await Promise.all([
    getAllStaff(),
    getAllCanteens(),
  ]);

  return (
    <div className="max-w-6xl mx-auto space-y-6">
      <div>
        <h1
          className="text-2xl font-bold tracking-tight"
          style={{ color: "var(--text-primary)" }}
        >
          Staff Management
        </h1>
        <p className="text-sm mt-1" style={{ color: "var(--text-secondary)" }}>
          Assign canteen staff to their workstations. Each staff member can be
          assigned to one canteen.
        </p>
      </div>
      <StaffClient staff={staff} canteens={canteens} adminId={dbUser.id} />
    </div>
  );
}
