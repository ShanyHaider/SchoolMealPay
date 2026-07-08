// features/users/queries.ts
import { cache } from "react";
import { db } from "@/drizzle/db";
import { usersTable } from "@/drizzle/schema";
import { eq } from "drizzle-orm";

export const getUserFromDb = cache(async (clerkId: string) => {
  return db.query.usersTable.findFirst({
    where: eq(usersTable.clerkId, clerkId),
  });
});
