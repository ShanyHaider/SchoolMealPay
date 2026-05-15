"use server";

import { db } from "@/drizzle/db";
import { usersTable } from "@/drizzle/schema";
import { eq } from "drizzle-orm";
import { revalidateUserCache } from "@/lib/cacheRevalidation";

// ─── Mutations ─────────────────────────────────────────────────
// Called from: Clerk webhook, admin panel

export async function upsertUser(user: typeof usersTable.$inferInsert) {
  await db
    .insert(usersTable)
    .values(user)
    .onConflictDoUpdate({
      target: [usersTable.clerkId],
      set: user,
    });

  revalidateUserCache(user.clerkId);
}

export async function deleteUser(clerkId: string) {
  // Soft delete — preserve audit trail
  await db
    .update(usersTable)
    .set({ isActive: false, updatedAt: new Date() })
    .where(eq(usersTable.clerkId, clerkId));

  revalidateUserCache(clerkId);
}

export async function updateUserRole(
  clerkId: string,
  role: (typeof usersTable.$inferInsert)["role"],
) {
  await db
    .update(usersTable)
    .set({ role, updatedAt: new Date() })
    .where(eq(usersTable.clerkId, clerkId));

  revalidateUserCache(clerkId);
}

export async function updateUserProfile(
  userId: string,
  updates: { name: string; phone: string | null },
) {
  await db
    .update(usersTable)
    .set({ name: updates.name, phone: updates.phone, updatedAt: new Date() })
    .where(eq(usersTable.id, userId));

  // re-fetch to get clerkId for cache bust
  const user = await db.query.usersTable.findFirst({
    where: eq(usersTable.id, userId),
  });
  if (user) revalidateUserCache(user.clerkId);
}
