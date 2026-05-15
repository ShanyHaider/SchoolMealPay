import { db } from "@/drizzle/db";
import { usersTable } from "@/drizzle/schema";
import { eq } from "drizzle-orm";
import { unstable_cache } from "next/cache";
import { getGlobalTag, getIdTag, getUserTag } from "@/lib/cache";

// ─── Cached Queries ────────────────────────────────────────────
// These run on the SERVER only (Server Components / Server Actions)

export function getUser(clerkId: string) {
  return unstable_cache(
    () =>
      db.query.usersTable.findFirst({
        where: eq(usersTable.clerkId, clerkId),
      }),
    [getIdTag("users", clerkId)],
    { tags: [getGlobalTag("users"), getIdTag("users", clerkId)] },
  )();
}

export function getAllUsers() {
  return unstable_cache(
    () => db.query.usersTable.findMany(),
    [getGlobalTag("users")],
    { tags: [getGlobalTag("users")] },
  )();
}
