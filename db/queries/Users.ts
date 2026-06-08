import { db } from "@/drizzle/db";
import { usersTable } from "@/drizzle/schema";
import { eq } from "drizzle-orm";
import { cacheLife, cacheTag } from "next/cache";
import { getGlobalTag, getIdTag } from "@/lib/cache";

// ─── Cached Queries ────────────────────────────────────────────

// export async function getUser(clerkId: string) {
//   "use cache";
//   cacheLife("minutes");
//   cacheTag(getGlobalTag("users"), getIdTag("users", clerkId));
//   return db.query.usersTable.findFirst({
//     where: eq(usersTable.clerkId, clerkId),
//   });
// }

export async function getAllUsers() {
  "use cache";
  cacheLife("hours");
  cacheTag(getGlobalTag("users"));
  return db.query.usersTable.findMany();
}
