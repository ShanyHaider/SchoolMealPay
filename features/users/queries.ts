// features/users/queries.ts
import { db } from "@/drizzle/db";
import { usersTable } from "@/drizzle/schema";
import { eq } from "drizzle-orm";
import { cacheLife, cacheTag } from "next/cache";
import { getGlobalTag, getIdTag } from "@/lib/cache";

export async function getUserFromDb(clerkId: string) {
    "use cache";                    // ← directive inside the function, not the file
    cacheLife("minutes");
    cacheTag(getGlobalTag("users"), getIdTag("users", clerkId));

    return db.query.usersTable.findFirst({
        where: eq(usersTable.clerkId, clerkId),
    });
}

// Single alias — both import paths resolve to the same cached function
// with the same tags, so revalidating once busts both call sites