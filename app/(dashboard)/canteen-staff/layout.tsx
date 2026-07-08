import { Suspense } from "react";
import { auth } from "@clerk/nextjs/server";
import { redirect } from "next/navigation";
import { getUserFromDb } from "@/features/users/queries";
import { getStaffCanteen } from "@/db/queries/Staff";
import { StaffSidebar } from "./_components/StaffSidebar";
import { StaffTopbar } from "./_components/StaffTopbar";
import { NotificationsTab } from "@/components/userMenu/tabs/NotificationsTab";
import { connection } from "next/server";

async function CanteenStaffGuard({ children }: { children: React.ReactNode }) {
  await connection();

  // auth() reads userId from the JWT that Clerk middleware already validated
  // and embedded in the request — no outbound network call, cannot fail on
  // cold-start. currentUser() (which we used before) makes a real HTTPS call
  // to Clerk's API and was throwing ClerkAPIResponseError on cold-start.
  const { userId } = await auth();
  if (!userId) redirect("/sign-in");

  const dbUser = await getUserFromDb(userId);

  if (!dbUser || dbUser.role !== "canteen_staff") {
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