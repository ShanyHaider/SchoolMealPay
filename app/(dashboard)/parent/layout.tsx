import { redirect } from "next/navigation";
import { currentUser } from "@clerk/nextjs/server";
import { getUser } from "@/db/queries/Users";
import { ParentSidebar } from "./_components/ParentSidebar";
import { ParentTopbar } from "./_components/ParentTopbar";
import "./parent.css";

export default async function ParentLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const clerkUser = await currentUser();
  if (!clerkUser) redirect("/sign-in");

  const dbUser = await getUser(clerkUser.id);
  if (!dbUser || dbUser.role !== "parent") redirect("/dashboard");

  return (
    <div className="flex min-h-screen bg-[var(--bg-secondary)]">
      {/* Sidebar is flush left/top */}
      <ParentSidebar user={dbUser} />

      <div className="flex-1 flex flex-col min-w-0 relative">
        {/* Topbar will now be flush against the top ceiling */}
        <ParentTopbar user={dbUser} />

        <main className="flex-1 overflow-y-auto">
          {/* This wrapper adds the padding back ONLY to the page content */}
          <div className="page-padding">{children}</div>
        </main>
      </div>
    </div>
  );
}
