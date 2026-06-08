// app/(dashboard)/school-admin/layout-content.tsx
// Drop-in replacement for the existing AdminLayoutContent.
// The only change: null-safe subscription read + graceful fallback to "free".

import { auth } from "@clerk/nextjs/server";
import { redirect } from "next/navigation";

import { getUserFromDb } from "@/features/users/queries";
import { getSchoolSubscription } from "@/db/queries/Subscription";

import { SchoolAdminSidebar } from "./AdminSidebar";
import { SchoolAdminTopbar } from "./AdminTopbar";
import { NotificationsTab } from "@/components/userMenu/tabs/NotificationsTab";
import { BillingTabServer } from "@/components/userMenu/tabs/BillingTab";

export async function AdminLayoutContent({
    children,
}: {
    children: React.ReactNode;
}) {
    const { userId } = await auth();
    if (!userId) redirect("/sign-in");

    const dbUser = await getUserFromDb(userId);
    if (!dbUser || dbUser.role !== "school_admin") redirect("/");

    // getSchoolSubscription() now returns null (not undefined) when the seed
    // row is missing. We fall back to "free" so the sidebar renders correctly
    // even before the seed has been run — admins will see locked premium items
    // rather than a broken layout.
    const schoolSubscription = await getSchoolSubscription();
    const tier = schoolSubscription?.tier ?? "free";

    return (
        <div className="flex min-h-screen w-full bg-(--bg-secondary) text-(--text-primary) antialiased">
            <SchoolAdminSidebar
                user={dbUser}
                tier={tier}
                notificationsTab={<NotificationsTab />}
                billingTab={<BillingTabServer />} />

            <div className="flex flex-col flex-1 min-w-0">
                <SchoolAdminTopbar user={dbUser} />
                <main className="flex-1 p-6 lg:p-8">{children}</main>
            </div>
        </div>
    );
}