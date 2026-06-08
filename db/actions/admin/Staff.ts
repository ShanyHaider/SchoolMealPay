
// ./db/actions/admin/Staff.ts
"use server";


import { db } from "@/drizzle/db";
import {
    canteenStaffAssignmentsTable,
    usersTable,
    staffInvitationsTable,
} from "@/drizzle/schema";
import { eq } from "drizzle-orm";
import { assertRole } from "@/lib/guards/serverGuards";
import {
    revalidateCanteenStaffCache,
    revalidateStaffCache,
} from "@/lib/cacheRevalidation";
import { InviteStaffInput, inviteStaffSchema } from "@/lib/validations/canteen";
import { clerkClient } from "@clerk/nextjs/server";
import { revalidatePath } from "next/cache";



// ─── inviteStaffMember ────────────────────────────────────────────────────
//
// THE CORE FIX: Replace the entire revocation loop with ignoreExisting: true.
//
// WHY THE OLD CODE FAILED:
//   Clerk moves an invitation from "pending" → "accepted" the moment the user
//   clicks the invite link — before they finish the signup form. Once "accepted",
//   the Clerk API will NOT let you revoke it (only "pending" invitations can be
//   revoked). So the revocation loop silently did nothing, and createInvitation
//   still threw duplicate_record.
//
// THE FIX:
//   Pass ignoreExisting: true to createInvitation. Clerk will atomically
//   supersede any existing invitation (regardless of status) and issue a fresh
//   one. No revocation loop needed — and it's a single API call instead of
//   potentially hundreds of paginated requests.
//
// SECONDARY FIX — local DB row reset:
//   The local staffInvitationsTable row must also be reset to status:"pending"
//   so the webhook can find it and assign role:"canteen_staff" on signup.
//   The onConflictDoUpdate already does this, but we make it explicit.

export async function inviteStaffMember(input: InviteStaffInput, adminId: string) {
    await assertRole(["school_admin"]);

    const parsed = inviteStaffSchema.safeParse(input);
    if (!parsed.success) {
        return { error: parsed.error.flatten().fieldErrors };
    }

    const { name, email, phone, canteenId } = parsed.data;
    const clerk = await clerkClient();

    // ── 1. Check if a fully active Clerk account already exists ───────────────
    // If yes, the invitation flow is irrelevant — offer promote path instead.
    try {
        const { data: clerkUsers, totalCount } = await clerk.users.getUserList({
            emailAddress: [email],
        });

        if (totalCount > 0) {
            const existingUser = await db.query.usersTable.findFirst({
                where: eq(usersTable.email, email),
            });

            if (existingUser?.role === "canteen_staff") {
                return {
                    error: { email: ["This person is already a canteen staff member."] },
                };
            }

            if (existingUser) {
                return {
                    error: {
                        email: [
                            `${email} already has an account. Promote them to canteen staff using the button below.`,
                        ],
                        existingUserId: [existingUser.id],
                        existingRole: [existingUser.role],
                    },
                };
            }

            // Clerk account exists but no local DB row
            return {
                error: {
                    email: ["This email has a Clerk account but no local record. Contact support."],
                },
            };
        }
    } catch {
        // getUserList failed — proceed; createInvitation will surface real errors
    }

    // ── 2. Create (or supersede) the Clerk invitation ─────────────────────────
    // ignoreExisting: true tells Clerk to atomically replace any existing
    // invitation for this email — pending, accepted, or expired — with a new one.
    // This is the official Clerk solution and eliminates the entire revocation loop.
    let clerkInvite: Awaited<ReturnType<typeof clerk.invitations.createInvitation>>;

    try {
        clerkInvite = await clerk.invitations.createInvitation({
            emailAddress: email,
            // redirectUrl: `${process.env.NEXT_PUBLIC_APP_URL}/sign-up/accept-invitation`,
            publicMetadata: { role: "canteen_staff" },
            notify: true,
            ignoreExisting: true, // ← THE FIX: supersedes any existing invitation
        });
    } catch (error: any) {
        const clerkCode = error?.errors?.[0]?.code;

        // form_identifier_exists means getUserList missed an active account above.
        // Do a direct DB lookup and offer the promote path.
        if (clerkCode === "form_identifier_exists") {
            const existingUser = await db.query.usersTable.findFirst({
                where: eq(usersTable.email, email),
            });

            if (existingUser) {
                return {
                    error: {
                        email: [
                            `${email} already has an account. Promote them to canteen staff using the button below.`,
                        ],
                        existingUserId: [existingUser.id],
                        existingRole: [existingUser.role],
                    },
                };
            }

            return {
                error: {
                    email: ["This email already has a Clerk account. Use Promote to Staff instead."],
                },
            };
        }

        console.error("Clerk Invitation Error:", {
            clerkCode,
            message: error?.errors?.[0]?.longMessage,
            error,
        });

        return {
            error: { email: ["Failed to send invitation. Please try again."] },
        };
    }

    // ── 3. Upsert local DB row, explicitly resetting status → "pending" ────────
    // This is critical: if a previous row was marked "accepted" (from the failed
    // signup attempt), the webhook's lookup will fail and assign role:"parent".
    // We reset it here so the webhook finds it and assigns "canteen_staff".
    await db
        .insert(staffInvitationsTable)
        .values({
            email,
            name,
            phone: phone || null,
            canteenId: canteenId || null,
            invitedBy: adminId,
            clerkInvitationId: clerkInvite.id,
            status: "pending",
        })
        .onConflictDoUpdate({
            target: staffInvitationsTable.email,
            set: {
                name,
                phone: phone || null,
                canteenId: canteenId || null,
                clerkInvitationId: clerkInvite.id,
                invitedBy: adminId,
                status: "pending", // Explicitly reset so the webhook finds this row
            },
        });

    revalidatePath("/school-admin/staff");
    return { success: true };
}

// db/actions/admin/Staff.ts  (add alongside the others)

export async function cancelStaffInvitation(invitationId: string) {
    await assertRole(["school_admin"]);

    const invitation = await db.query.staffInvitationsTable.findFirst({
        where: eq(staffInvitationsTable.id, invitationId),
    });
    if (!invitation) throw new Error("Invitation not found");

    if (invitation.clerkInvitationId) {
        try {
            const clerk = await clerkClient();
            await clerk.invitations.revokeInvitation(invitation.clerkInvitationId);
        } catch (err) {
            console.warn("[cancelStaffInvitation] Clerk revoke skipped:", err);
        }
    }

    await db
        .update(staffInvitationsTable)
        .set({ status: "expired" })
        .where(eq(staffInvitationsTable.id, invitationId));

    revalidatePath("/school-admin/staff");
}

// db/actions/Admin.ts — replace disableStaffMember and add enableStaffMember

// ─── disableStaffMember ────────────────────────────────────────────────────────
// Sets isActive: false in DB (source of truth) + bans in Clerk (blocks login).


// ─── enableStaffMember ─────────────────────────────────────────────────────────
// Sets isActive: true in DB + unbans in Clerk (restores login).

// db/actions/Admin.ts — replace disableStaffMember, add enableStaffMember
// Uses revalidateStaffCache() to bust ALL relevant cache tags at once.

export async function disableStaffMember(userId: string) {
    await assertRole(["school_admin"]);

    const user = await db.query.usersTable.findFirst({
        where: eq(usersTable.id, userId),
    });
    if (!user) throw new Error("User not found");

    await db
        .update(usersTable)
        .set({ isActive: false, updatedAt: new Date() })
        .where(eq(usersTable.id, userId));

    try {
        const clerk = await clerkClient();
        await clerk.users.banUser(user.clerkId);
    } catch (err) {
        console.error("[disableStaffMember] Clerk ban failed:", err);
    }

    revalidateStaffCache(userId, user.clerkId);
}

export async function enableStaffMember(userId: string) {
    await assertRole(["school_admin"]);

    const user = await db.query.usersTable.findFirst({
        where: eq(usersTable.id, userId),
    });
    if (!user) throw new Error("User not found");

    await db
        .update(usersTable)
        .set({ isActive: true, updatedAt: new Date() })
        .where(eq(usersTable.id, userId));

    try {
        const clerk = await clerkClient();
        await clerk.users.unbanUser(user.clerkId);
    } catch (err) {
        console.error("[enableStaffMember] Clerk unban failed:", err);
    }

    revalidateStaffCache(userId, user.clerkId);
}




// db/actions/Admin.ts — replace promoteToStaff and deleteStaffMember
// Same fix: revalidateStaffCache() instead of revalidateUserCache(clerkId)

export async function promoteToStaff(userId: string) {
    await assertRole(["school_admin"]);

    const user = await db.query.usersTable.findFirst({
        where: eq(usersTable.id, userId),
    });
    if (!user) throw new Error("User not found");

    await db
        .update(usersTable)
        .set({ role: "canteen_staff" })
        .where(eq(usersTable.id, userId));

    try {
        const clerk = await clerkClient();
        await clerk.users.updateUserMetadata(user.clerkId, {
            publicMetadata: { role: "canteen_staff" },
        });
    } catch (err) {
        console.error("[promoteToStaff] Failed to sync Clerk metadata:", err);
    }

    revalidateStaffCache(userId, user.clerkId);
}


export async function deleteStaffMember(userId: string) {
    await assertRole(["school_admin"]);

    const user = await db.query.usersTable.findFirst({
        where: eq(usersTable.id, userId),
    });
    if (!user) throw new Error("User not found");

    await db.transaction(async (tx) => {
        const assignment = await tx.query.canteenStaffAssignmentsTable.findFirst({
            where: eq(canteenStaffAssignmentsTable.staffId, userId),
        });
        if (assignment) {
            await tx
                .delete(canteenStaffAssignmentsTable)
                .where(eq(canteenStaffAssignmentsTable.staffId, userId));
            revalidateCanteenStaffCache(assignment.canteenId, userId);
        }

        // Demote to "parent" — preserves order history and parent–child links
        await tx
            .update(usersTable)
            .set({ role: "parent", updatedAt: new Date() })
            .where(eq(usersTable.id, userId));
    });

    try {
        const clerk = await clerkClient();
        await clerk.users.updateUserMetadata(user.clerkId, {
            publicMetadata: { role: "parent" },
        });
    } catch (err) {
        console.error("[deleteStaffMember] Failed to sync Clerk metadata:", err);
    }

    revalidateStaffCache(userId, user.clerkId);
}
