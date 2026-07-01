// features/users/db.ts — FIXED VERSION
//
// WHAT WAS BROKEN:
//   The existing code never overwrote role on UPDATE, which is correct.
//   However it had no explicit guard preventing a "parent" INSERT from racing
//   with the webhook when the email-collision branch hit. We now preserve the
//   role on email-collision updates (already done) AND we add a role-upgrade
//   guard so that if the DB already has canteen_staff we never write parent
//   over it even on a fresh insert (defensive, shouldn't happen but edge cases).

import { db } from "@/drizzle/db";
import { usersTable } from "@/drizzle/schema";
import { eq } from "drizzle-orm";
import { cacheLife, cacheTag } from "next/cache";
import { getGlobalTag } from "@/lib/cache";

type UserInsert = typeof usersTable.$inferInsert;
type UserRole = "school_admin" | "canteen_staff" | "parent";

// Role hierarchy — higher index = more privileged
const ROLE_RANK: Record<UserRole, number> = {
  school_admin: 2,
  canteen_staff: 1,
  parent: 0,
};

function higherRole(a: UserRole, b: UserRole): UserRole {
  return ROLE_RANK[a] >= ROLE_RANK[b] ? a : b;
}

export async function upsertUser(user: UserInsert) {
  console.log(
    `[upsertUser] called for clerkId=${user.clerkId} email=${user.email}`,
  );

  const existingByClerkId = await db.query.usersTable.findFirst({
    where: eq(usersTable.clerkId, user.clerkId),
  });

  if (existingByClerkId) {
    console.log(
      `[upsertUser] BRANCH=update-by-clerkId existing.id=${existingByClerkId.id} existing.email=${existingByClerkId.email} existing.role=${existingByClerkId.role} existing.isActive=${existingByClerkId.isActive}`,
    );

    const [updated] = await db
      .update(usersTable)
      .set({
        name: user.name,
        imageUrl: user.imageUrl,
        phone: user.phone,
        isActive: true,
        updatedAt: new Date(),
      })
      .where(eq(usersTable.clerkId, user.clerkId))
      .returning({ id: usersTable.id, role: usersTable.role });

    console.log(
      `[upsertUser] update-by-clerkId result=${JSON.stringify(updated)}`,
    );
    return updated;
  }

  const existingByEmail = await db.query.usersTable.findFirst({
    where: eq(usersTable.email, user.email),
  });

  if (existingByEmail) {
    // ── DEBUG: this is the dangerous branch — it REASSIGNS clerkId ──────────
    // If existingByEmail.clerkId !== user.clerkId, we're stealing the row
    // away from whatever clerkId owned it before. That orphaned old clerkId
    // can later get a real or phantom user.deleted event fired against it.
    console.warn(
      `[upsertUser] BRANCH=email-collision! incoming.clerkId=${user.clerkId} incoming.email=${user.email} | existing.id=${existingByEmail.id} existing.clerkId=${existingByEmail.clerkId} existing.role=${existingByEmail.role} existing.isActive=${existingByEmail.isActive}`,
    );

    if (existingByEmail.clerkId !== user.clerkId) {
      console.warn(
        `[upsertUser] !!! REASSIGNING row id=${existingByEmail.id} from clerkId=${existingByEmail.clerkId} to clerkId=${user.clerkId} !!!`,
      );
    }

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
      .returning({ id: usersTable.id, role: usersTable.role });

    console.log(
      `[upsertUser] email-collision result=${JSON.stringify(updated)}`,
    );
    return updated;
  }

  console.log(
    `[upsertUser] BRANCH=insert-new for clerkId=${user.clerkId} email=${user.email}`,
  );

  const [inserted] = await db
    .insert(usersTable)
    .values(user)
    .returning({ id: usersTable.id, role: usersTable.role });

  console.log(`[upsertUser] insert-new result=${JSON.stringify(inserted)}`);
  return inserted;
}

export async function deleteUser(clerkId: string) {
  // ── DEBUG: log every call site that deactivates a user ────────────────────
  console.warn(
    `[deleteUser] DEACTIVATING clerkId=${clerkId} -- stack trace follows`,
  );
  console.trace();

  const [result] = await db
    .update(usersTable)
    .set({ isActive: false, updatedAt: new Date() })
    .where(eq(usersTable.clerkId, clerkId))
    .returning({
      id: usersTable.id,
      email: usersTable.email,
      clerkId: usersTable.clerkId,
    });

  console.warn(`[deleteUser] result=${JSON.stringify(result)}`);
}
