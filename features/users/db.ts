import { db } from "@/drizzle/db";
import { usersTable } from "@/drizzle/schema";
import { eq } from "drizzle-orm";

export async function upsertUser(user: typeof usersTable.$inferInsert) {
  await db
    .insert(usersTable)
    .values(user)
    .onConflictDoUpdate({
      target: [usersTable.clerkId],
      set: user,
    });
}

// Deleting on delete for now
// TODO Deactivate on delete
export async function deleteUser(id: string) {
  await db.delete(usersTable).where(eq(usersTable.clerkId, id));
}
