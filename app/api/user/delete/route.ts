// app/api/user/delete/route.ts

import { auth, clerkClient } from "@clerk/nextjs/server";
import { NextResponse } from "next/server";
import { deleteUser } from "@/features/users/db";

export async function DELETE() {
  const { userId } = await auth();
  if (!userId) {
    return NextResponse.json({ error: "Not authenticated" }, { status: 401 });
  }

  try {
    // Soft-delete in DB using the shared deleteUser function (sets isActive: false)
    await deleteUser(userId);

    // Then delete from Clerk — fires user.deleted webhook which calls
    // deleteUser again, but isActive is already false so it's a no-op
    const clerk = await clerkClient();
    await clerk.users.deleteUser(userId);

    return NextResponse.json({ success: true });
  } catch (err: any) {
    console.error("[Delete Account]", err);
    return NextResponse.json(
      { error: err.message ?? "Failed to delete account" },
      { status: 500 },
    );
  }
}
