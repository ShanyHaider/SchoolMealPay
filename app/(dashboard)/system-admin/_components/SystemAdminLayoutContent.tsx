// app/(dashboard)/system-admin/_components/SystemAdminLayoutContent.tsx

import { auth } from "@clerk/nextjs/server";
import { redirect } from "next/navigation";

import { getUserFromDb } from "@/features/users/queries";

import { SystemAdminSidebar } from "./SystemAdminSidebar";
import { SystemAdminTopbar } from "./SystemAdminTopbar";

export async function SystemAdminLayoutContent({
    children,
}: {
    children: React.ReactNode;
}) {
    const { userId } = await auth();
    if (!userId) redirect("/sign-in");

    const dbUser = await getUserFromDb(userId);
    if (!dbUser || dbUser.role !== "system_admin") redirect("/");

    return (
        <div className="flex min-h-screen w-full bg-[var(--bg-secondary)] text-[var(--text-primary)] antialiased">
            <SystemAdminSidebar user={dbUser} />

            <div className="flex flex-col flex-1 min-w-0">
                <SystemAdminTopbar user={dbUser} />
                <main className="flex-1 p-6 lg:p-8 overflow-y-auto">{children}</main>
            </div>
        </div>
    );
}