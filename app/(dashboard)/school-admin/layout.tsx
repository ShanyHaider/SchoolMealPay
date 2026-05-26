import { currentUser } from "@clerk/nextjs/server";
import { redirect } from "next/navigation";
import { getUserFromDb } from "@/features/users/db"; // Use your live, uncached database fetcher
import { SchoolAdminSidebar } from "./_components/AdminSidebar";
import { SchoolAdminTopbar } from "./_components/AdminTopbar";

// Force Next.js to run this live layout check fresh on every single directory navigation
export const dynamic = "force-dynamic";

export default async function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const clerkUser = await currentUser();
  if (!clerkUser) redirect("/sign-in");

  // Read the true, live row from your PostgreSQL backend
  const dbUser = await getUserFromDb(clerkUser.id);

  // If the user isn't an admin, break the loop completely by kicking them to the home landing page
  if (!dbUser || dbUser.role !== "school_admin") {
    console.log("❌ ACCESS DENIED. DB User Role is actually:", dbUser?.role);
    redirect("/");
  }

  return (
    <div className="flex min-h-screen w-full bg-(--bg-secondary) text-(--text-primary) antialiased">
      {/* 1. Sidebar on the left */}
      <SchoolAdminSidebar user={dbUser} />

      {/* 2. Main content viewport on the right */}
      <div className="flex flex-col flex-1 min-w-0">
        {/* Sticky topbar that sits at the top of the content area */}
        <SchoolAdminTopbar user={dbUser} />

        {/* Main page views */}
        <main className="flex-1 p-6 lg:p-8">{children}</main>
      </div>
    </div>
  );
}
