import { currentUser } from "@clerk/nextjs/server";
import { redirect } from "next/navigation";
import { getUser } from "@/db/queries/Users";
import { ProfileForm } from "./_components/ProfileForm";
import { NotificationPrefs } from "./_components/NotificationPreps";
import { AccountActions } from "./_components/AccountActions";

export default async function SettingsPage() {
  const clerkUser = await currentUser();
  if (!clerkUser) redirect("/sign-in");
  const dbUser = await getUser(clerkUser.id);
  if (!dbUser) redirect("/sign-in");

  return (
    <div className="flex flex-col gap-6 max-w-6xl">
      <div>
        <h1 className="text-2xl font-bold tracking-tight text-black dark:text-white">
          Settings
        </h1>
        <p className="text-sm text-gray-500 mt-1">
          Manage your profile and account preferences.
        </p>
      </div>

      <ProfileForm user={dbUser} />
      <NotificationPrefs />
      <AccountActions userId={dbUser.id} clerkId={dbUser.clerkId} />
    </div>
  );
}
