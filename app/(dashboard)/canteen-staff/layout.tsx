import { Suspense } from "react";
import { currentUser } from "@clerk/nextjs/server";
import { redirect } from "next/navigation";
import { getUserFromDb } from "@/features/users/queries";
import { getStaffCanteen } from "@/db/queries/Staff";
import { StaffSidebar } from "./_components/StaffSidebar";
import { StaffTopbar } from "./_components/StaffTopbar";
import { NotificationsTab } from "@/components/userMenu/tabs/NotificationsTab";
import { connection } from "next/server";

async function CanteenStaffGuard({ children }: { children: React.ReactNode }) {
  await connection();

  const clerkUser = await currentUser();
  if (!clerkUser) redirect("/sign-in");

  const dbUser = await getUserFromDb(clerkUser.id);

  if (!dbUser || dbUser.role !== "canteen_staff") {
    console.log("❌ CANTEEN ROUTE REJECTED. Live DB User Role is:", dbUser?.role);
    redirect("/");
  }

  const canteen = await getStaffCanteen(dbUser.id);

  return (
    <div className="flex min-h-screen w-full bg-(--bg-secondary) text-(--text-primary) antialiased">
      <StaffSidebar
        user={dbUser}
        canteen={canteen}
        notificationsTab={
          <Suspense fallback={<div className="py-10 text-center text-sm text-zinc-500">Loading…</div>}>
            <NotificationsTab />
          </Suspense>
        }
      />
      <div className="flex flex-col flex-1 min-w-0">
        <StaffTopbar user={dbUser} canteen={canteen} />
        <main className="flex-1 p-6 lg:p-8">{children}</main>
      </div>
    </div>
  );
}

export default function CanteenStaffLayout({ children }: { children: React.ReactNode }) {
  return (
    <Suspense fallback={null}>
      <CanteenStaffGuard>{children}</CanteenStaffGuard>
    </Suspense>
  );
}