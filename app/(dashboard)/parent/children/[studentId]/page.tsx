import { currentUser } from "@clerk/nextjs/server";
import { redirect, notFound } from "next/navigation";
import { getStudentById } from "@/db/queries/Students";
import { getBlockedItems } from "@/db/queries/Notifications";
import { ChildProfileClient } from "./_components/ChildProfileClient";
import { getUserFromDb } from "@/features/users/queries";

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

  const student = await getStudentById(studentId);
  if (!student) notFound();

  const blockedItems = await getBlockedItems(dbUser.id, studentId);

  return <ChildProfileClient student={student} blockedItems={blockedItems} />;
}