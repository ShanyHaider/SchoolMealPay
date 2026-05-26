import { currentUser } from "@clerk/nextjs/server";
import { redirect } from "next/navigation";
import { getUserFromDb } from "@/features/users/db"; // Use your live, uncached database helper
import { getStaffCanteen } from "@/db/queries/Staff";
import { StaffSidebar } from "./_components/StaffSidebar";
import { StaffTopbar } from "./_components/StaffTopbar";

// Force Next.js to run this check completely fresh on every request
export const dynamic = "force-dynamic";

export default async function CanteenStaffLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const clerkUser = await currentUser();
  if (!clerkUser) redirect("/sign-in");

  // Read the live row right out of PostgreSQL
  const dbUser = await getUserFromDb(clerkUser.id);

  // If the user isn't canteen staff, break the loop completely by pushing them to the home page
  if (!dbUser || dbUser.role !== "canteen_staff") {
    console.log(
      "❌ CANTEEN ROUTE REJECTED. Live DB User Role is:",
      dbUser?.role,
    );
    redirect("/");
  }

  // Fetch the canteen this staff member is assigned to
  const canteen = await getStaffCanteen(dbUser.id);

  return (
    <div className="flex min-h-screen w-full bg-(--bg-secondary) text-(--text-primary) antialiased">
      {/* Sidebar on the left */}
      <StaffSidebar user={dbUser} canteen={canteen} />

      {/* Main content viewport on the right */}
      <div className="flex flex-col flex-1 min-w-0">
        <StaffTopbar user={dbUser} canteen={canteen} />
        <main className="flex-1 p-6 lg:p-8">{children}</main>
      </div>
    </div>
  );
}
