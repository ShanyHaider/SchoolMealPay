import { currentUser } from "@clerk/nextjs/server";
import { redirect } from "next/navigation";
import { getUser } from "@/db/queries/Users";
import { LinkChildClient } from "./_components/LinkChildClient";

export default async function LinkChildPage() {
  const clerkUser = await currentUser();
  if (!clerkUser) redirect("/sign-in");
  const dbUser = await getUser(clerkUser.id);
  if (!dbUser) redirect("/sign-in");

  return (
    <div className="flex flex-col gap-6 max-w-6xl">
      <div className="flex items-center gap-3">
        <a
          href="/parent/children"
          className="w-8 h-8 flex items-center justify-center rounded-xl bg-gray-100 dark:bg-zinc-800 text-gray-600 dark:text-gray-400 hover:bg-black hover:text-white dark:hover:bg-white dark:hover:text-black transition-all"
        >
          ←
        </a>
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-black dark:text-white">
            Link a child
          </h1>
          <p className="text-sm text-gray-500 mt-0.5">
            Enter your child's school-issued student ID to link their profile.
          </p>
        </div>
      </div>

      <LinkChildClient parentId={dbUser.id} />
    </div>
  );
}
