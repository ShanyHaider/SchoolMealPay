// components/userMenu/tabs/NotificationsTab.tsx
import { auth } from "@clerk/nextjs/server";
import { redirect } from "next/navigation";
import { getUserFromDb } from "@/features/users/queries";
import { getNotificationsByUser } from "@/db/queries/Notifications";
import { NotificationsClient } from "@/features/notifications/NotificationsClient";

export async function NotificationsTab() {
    const { userId: clerkId } = await auth();
    if (!clerkId) redirect("/sign-in");

    const dbUser = await getUserFromDb(clerkId);
    if (!dbUser) redirect("/sign-in");

    const notifications = await getNotificationsByUser(dbUser.id);

    const sorted = [...notifications].sort(
        (a, b) => new Date(b.sentAt).getTime() - new Date(a.sentAt).getTime(),
    );

    return <NotificationsClient notifications={sorted} userId={dbUser.id} />;
}