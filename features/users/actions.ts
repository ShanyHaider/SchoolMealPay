"use server";

import { auth } from "@clerk/nextjs/server";
import { deleteUser } from "@/features/users/db";

export async function deleteOwnAccountAction() {
  const { userId } = await auth();
  if (!userId) {
    return { success: false, error: "Not authenticated" };
  }

  try {
    await deleteUser(userId);
    return { success: true };
  } catch (err: any) {
    console.error("[deleteOwnAccountAction]", err);
    return { success: false, error: err.message ?? "Failed to delete account" };
  }
}
