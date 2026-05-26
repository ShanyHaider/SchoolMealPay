import { currentUser } from "@clerk/nextjs/server";
import { redirect } from "next/navigation";
import { getUser } from "@/db/queries/Users";
import { getChildrenByParent } from "@/db/queries/Students";
import Link from "next/link";
import { UserPlus, Users } from "lucide-react";
import { ChildCard } from "./_components/ChildCard";
import { FadeIn } from "@/components/Motion";

export default async function ChildrenPage() {
  const clerkUser = await currentUser();
  if (!clerkUser) redirect("/sign-in");
  const dbUser = await getUser(clerkUser.id);
  if (!dbUser) redirect("/sign-in");

  const children = await getChildrenByParent(dbUser.id);

  return (
    <div className="w-full max-w-6xl mx-auto">
      {/* Header */}
      <FadeIn>
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-10">
          <div>
            <h1 className="text-3xl font-black tracking-tight text-black dark:text-white">
              Children
            </h1>
            <p className="text-gray-500 dark:text-gray-400 mt-1 font-medium">
              Manage your linked children and their dietary profiles.
            </p>
          </div>
          <Link
            href="/parent/children/link"
            className="flex items-center justify-center gap-2 px-6 py-3 bg-black text-white dark:bg-white dark:text-black rounded-xl text-sm font-bold hover:opacity-90 transition-all shadow-sm active:scale-95"
          >
            <UserPlus size={18} />
            Link a child
          </Link>
        </div>
      </FadeIn>

      {/* Children list */}
      {children.length === 0 ?
        <FadeIn delay={0.1}>
          <div className="flex flex-col items-center justify-center py-24 bg-white dark:bg-zinc-900 border border-gray-200 dark:border-zinc-800 rounded-3xl text-center px-6">
            <div className="w-20 h-20 rounded-full bg-gray-100 dark:bg-zinc-800 flex items-center justify-center mb-6">
              <Users size={32} className="text-gray-400" />
            </div>
            <h2 className="text-xl font-bold text-black dark:text-white">
              No children linked
            </h2>
            <p className="text-gray-500 mt-2 mb-8 max-w-sm font-medium">
              Link a student profile to begin managing their meal plans.
            </p>
            <Link
              href="/parent/children/link"
              className="px-8 py-3 bg-black text-white dark:bg-white dark:text-black rounded-xl font-bold transition-all"
            >
              Link a child
            </Link>
          </div>
        </FadeIn>
      : <div className="grid grid-cols-1 gap-6">
          {children.map((link, index) => (
            <FadeIn key={link.id} delay={0.1 * (index + 1)}>
              <ChildCard link={link} />
            </FadeIn>
          ))}
        </div>
      }
    </div>
  );
}
