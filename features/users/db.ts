// features/users/db.ts
import { db } from "@/drizzle/db";
import { usersTable } from "@/drizzle/schema";
import { eq } from "drizzle-orm";

export async function upsertUser(user: typeof usersTable.$inferInsert) {
  const { role, ...updateData } = user;

  // 1. Check if a soft-deleted or existing record already occupies this email
  const existingUserByEmail = await db.query.usersTable.findFirst({
    where: eq(usersTable.email, user.email),
  });

  if (existingUserByEmail) {
    // Re-link the existing record to the new clerkId and re-activate it
    // Crucially: We omit 'role' so their DB-assigned role remains untouched!
    const [updated] = await db
      .update(usersTable)
      .set({
        clerkId: user.clerkId,
        name: user.name,
        imageUrl: user.imageUrl,
        phone: user.phone,
        isActive: true,
        updatedAt: new Date(),
      })
      .where(eq(usersTable.email, user.email))
      .returning({ id: usersTable.id });

    return updated;
  }

  // 2. Standard flow: Safe fallback if it's a brand new email or matching clerkId conflict
  const [inserted] = await db
    .insert(usersTable)
    .values(user)
    .onConflictDoUpdate({
      target: [usersTable.clerkId],
      set: updateData,
    })
    .returning({ id: usersTable.id });

  return inserted;
}

export async function deleteUser(clerkId: string) {
  await db
    .update(usersTable)
    .set({ isActive: false })
    .where(eq(usersTable.clerkId, clerkId));
}

export async function getUserFromDb(clerkId: string) {
  const result = await db
    .select()
    .from(usersTable)
    .where(eq(usersTable.clerkId, clerkId));
  return result[0] ?? null;
}
