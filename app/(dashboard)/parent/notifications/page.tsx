import { currentUser } from "@clerk/nextjs/server";
import { redirect } from "next/navigation";
import { getUser } from "@/db/queries/Users";
import { getNotificationsByUser } from "@/db/queries/Notifications";
import { NotificationsClient } from "./NotificationsClient";

export default async function NotificationsPage() {
  const clerkUser = await currentUser();
  if (!clerkUser) redirect("/sign-in");
  const dbUser = await getUser(clerkUser.id);
  if (!dbUser) redirect("/sign-in");

  const notifications = await getNotificationsByUser(dbUser.id);

  return (
    <div className="flex flex-col gap-6 max-w-6xl">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-black dark:text-white">
            Notifications
          </h1>
          <p className="text-sm text-gray-500 mt-1">
            Stay updated on your children's meals and orders.
          </p>
        </div>
        {notifications.some((n) => !n.isRead) && (
          <span className="text-xs font-bold px-2.5 py-1 rounded-full bg-black text-white dark:bg-white dark:text-black">
            {notifications.filter((n) => !n.isRead).length} unread
          </span>
        )}
      </div>
      <NotificationsClient notifications={notifications} userId={dbUser.id} />
    </div>
  );
}
