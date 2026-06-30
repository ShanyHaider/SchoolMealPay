import { currentUser } from "@clerk/nextjs/server";
import { redirect, notFound } from "next/navigation";
import { getStudentById } from "@/db/queries/Students";
import { getBlockedItems } from "@/db/queries/Notifications";
import { getChildActivitySummaries } from "@/db/queries/ChildActivity";
import { ChildProfileClient } from "./_components/ChildProfileClient";
import { getUserFromDb } from "@/features/users/queries";
import { getRecentOrdersForStudent } from "@/db/queries/Orders";
import { SpendingSummary } from "@/types/childProfileTypes";

export default async function ChildDetailPage({
  params,
}: {
  params: Promise<{ studentId: string }>;
}) {
  const clerkUser = await currentUser();
  if (!clerkUser) redirect("/sign-in");
  const dbUser = await getUserFromDb(clerkUser.id);
  if (!dbUser) redirect("/sign-in");

  const { studentId } = await params;

  // Parallel fetch — none of these depend on each other
  const [student, blockedItems, activityArr, recentOrders] = await Promise.all([
    getStudentById(studentId),
    getBlockedItems(dbUser.id, studentId),
    getChildActivitySummaries([studentId]),
    getRecentOrdersForStudent(studentId, 7),
  ]);

  if (!student) notFound();

  const activity = activityArr[0];
  const spendingSummary: SpendingSummary = {
    todaySpend: activity?.todayOrder?.total ?? 0,
    weeklySpend: activity?.weeklySpend ?? 0,
    dailyLimit: student.childProfile?.dailySpendingLimit
      ? parseFloat(student.childProfile.dailySpendingLimit)
      : null,
    weeklyLimit: student.childProfile?.weeklySpendingLimit
      ? parseFloat(student.childProfile.weeklySpendingLimit)
      : null,
  };

  return (
    <ChildProfileClient
      student={student}
      blockedItems={blockedItems}
      recentOrders={recentOrders}
      spendingSummary={spendingSummary}
    />
  );
}