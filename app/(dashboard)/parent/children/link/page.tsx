import { auth } from "@clerk/nextjs/server";
import { redirect } from "next/navigation";
import { LinkChildClient } from "./_components/LinkChildClient";
import { getUserFromDb } from "@/features/users/queries";
import Link from "next/link";
import { ArrowLeft } from "lucide-react";

export default async function LinkChildPage() {
  const { userId } = await auth();
  if (!userId) redirect("/sign-in");
  const dbUser = await getUserFromDb(userId);
  if (!dbUser) redirect("/sign-in");

  return (
    <div className="flex flex-col gap-6 max-w-6xl">
      <div className="flex items-center gap-3">
        <Link
          href="/parent/children"
          className="w-9 h-9 flex items-center justify-center rounded-xl bg-(--bg-secondary) text-(--text-secondary) hover:bg-(--bg-tertiary) hover:text-(--text-primary) transition-colors shrink-0 border border-(--border-card)"
        >
          <ArrowLeft size={15} />
        </Link>
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
