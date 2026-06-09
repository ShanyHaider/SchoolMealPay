// app/(dashboard)/parent/_components/ParentLayoutContent.tsx
// Fetches parent Pro subscription status and threads it into the sidebar.

import { auth } from "@clerk/nextjs/server";
import { redirect } from "next/navigation";
import { getParentProSubscription } from "@/db/queries/Subscription";
import { ParentSidebar } from "./ParentSidebar";
import { ParentTopbar } from "./ParentTopbar";
import { NotificationsTab } from "@/components/userMenu/tabs/NotificationsTab";
import { BillingTabServer } from "@/components/userMenu/tabs/BillingTab";
import { getUserFromDb } from "@/features/users/queries";
import { connection } from "next/server";

export async function ParentLayoutContent({
    children,
}: {
    children: React.ReactNode;
}) {
    await connection();
    const { userId } = await auth();
    if (!userId) redirect("/sign-in");

    const dbUser = await getUserFromDb(userId);
    if (!dbUser || dbUser.role !== "parent") redirect("/dashboard");

    // Fetch subscription — null if no row yet (treated as free)
    const sub = await getParentProSubscription(dbUser.id);
    const subscriptionStatus = sub?.status ?? null;

    return (
        <div className="flex min-h-screen w-full bg-[var(--bg-secondary)] text-[var(--text-primary)] antialiased">
            <ParentSidebar
                user={dbUser}
                subscriptionStatus={subscriptionStatus}
                notificationsTab={<NotificationsTab />}
                billingTab={<BillingTabServer />}
            />

            <div className="flex flex-col flex-1 min-w-0">
                <ParentTopbar user={dbUser} />
                <main className="flex-1 p-6 lg:p-8">{children}</main>
            </div>
        </div>
    );
}