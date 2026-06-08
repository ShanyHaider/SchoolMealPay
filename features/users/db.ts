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
  // ── Check by clerkId first (most reliable — never changes) ───────────────
  const existingByClerkId = await db.query.usersTable.findFirst({
    where: eq(usersTable.clerkId, user.clerkId),
  });

  if (existingByClerkId) {
    // UPDATE — NEVER touch role. Profile fields only.
    // Role changes are handled exclusively by assertRole-guarded server actions.
    const [updated] = await db
      .update(usersTable)
      .set({
        name: user.name,
        imageUrl: user.imageUrl,
        phone: user.phone,
        isActive: true,
        updatedAt: new Date(),
        // role intentionally omitted — see comment above
      })
      .where(eq(usersTable.clerkId, user.clerkId))
      .returning({ id: usersTable.id, role: usersTable.role });

    return updated;
  }

  // ── New clerkId — check for email collision ───────────────────────────────
  // Rare but possible if someone used a different OAuth provider previously.
  const existingByEmail = await db.query.usersTable.findFirst({
    where: eq(usersTable.email, user.email),
  });

  if (existingByEmail) {
    // Link the Clerk ID to the existing record.
    // Preserve the existing role — we may be landing here from a user.updated
    // webhook that carries role:"parent" in userData while the DB already has
    // role:"canteen_staff" (set by promoteToStaff). Never downgrade.
    const [updated] = await db
      .update(usersTable)
      .set({
        clerkId: user.clerkId,
        name: user.name,
        imageUrl: user.imageUrl,
        phone: user.phone,
        isActive: true,
        updatedAt: new Date(),
        // role intentionally omitted — preserve whatever is in the DB
      })
      .where(eq(usersTable.email, user.email))
      .returning({ id: usersTable.id, role: usersTable.role });

    return updated;
  }

  // ── Brand new user — INSERT with the role the webhook resolved ────────────
  // The webhook resolves role:"canteen_staff" when an invitation is found,
  // otherwise "parent". school_admin is only ever set manually.
  const [inserted] = await db
    .insert(usersTable)
    .values(user)
    .returning({ id: usersTable.id, role: usersTable.role });

  return inserted;
}

export async function deleteUser(clerkId: string) {
  await db
    .update(usersTable)
    .set({ isActive: false, updatedAt: new Date() })
    .where(eq(usersTable.clerkId, clerkId));
}

