

import { getAllStaff, getAllCanteens } from "@/db/queries/Admin";
import { StaffClient } from "./_components/StaffClient";
import { auth } from "@clerk/nextjs/server";
import { redirect } from "next/navigation";
import { getUserFromDb } from "@/features/users/queries";
import { db } from "@/drizzle/db";
import { eq } from "drizzle-orm";
import { staffInvitationsTable } from "@/drizzle/schema";

export default async function StaffPage() {
  const { userId } = await auth();
  if (!userId) redirect("/sign-in");

  const dbUser = await getUserFromDb(userId);
  if (!dbUser || dbUser.role !== "school_admin") redirect("/");

  const [staff, canteens, pendingInvitations] = await Promise.all([
    getAllStaff(), // must include `with: { staffAssignments: { with: { canteen } } }`
    getAllCanteens(),
    db.query.staffInvitationsTable.findMany({
      where: eq(staffInvitationsTable.status, "pending"),
      with: {
        canteen: {
          columns: { id: true, name: true },
        },
      },
    }),
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

      <StaffClient
        staff={staff}
        canteens={canteens}
        adminId={dbUser.id}
        pendingInvitations={pendingInvitations.map((inv) => ({
          ...inv,
          name: inv.name ?? "Invited User", // 👈 Fallback string satisfies the type definition
          status: inv.status as "pending" | "accepted" | "expired", // Ensures enum alignment
        }))}
      />
    </div>
  );
}