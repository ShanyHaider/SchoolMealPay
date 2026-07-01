// app/api/webhooks/clerk/route.ts
import { NextRequest } from "next/server";
import { verifyWebhook } from "@clerk/nextjs/webhooks";
import { db } from "@/drizzle/db";
import {
  parentWalletsTable,
  canteenStaffAssignmentsTable,
  staffInvitationsTable,
  newsletterSubscribersTable,
  demoRequestsTable,
  contactSubmissionsTable,
} from "@/drizzle/schema";
import { upsertUser, deleteUser } from "@/features/users/db";
import { eq, and, inArray } from "drizzle-orm";
import { revalidateTag } from "next/cache";
import { getGlobalTag, getIdTag } from "@/lib/cache";
import { bustUserCache } from "@/lib/cacheRevalidation";
import { env } from "@/data/env/server";

// ─── Cache busting helper ──────────────────────────────────────────────────────
// Busts every cache tag that getUser() and getUserFromDb() write under,
// so the layout guard never serves a stale null / wrong-role result.

export async function POST(request: NextRequest) {
  try {
    const event = await verifyWebhook(request);
    const clerkData = event.data as any;

    // ── DEBUG: log every event Clerk sends us, in full ─────────────────────
    console.log(
      `[Clerk Webhook] type=${event.type} clerkId=${clerkData?.id} primaryEmailId=${clerkData?.primary_email_address_id}`,
    );
    console.log(
      `[Clerk Webhook] email_addresses=${JSON.stringify(clerkData?.email_addresses)}`,
    );

    switch (event.type) {
      case "user.created":
      case "user.updated": {
        const email = clerkData.email_addresses?.find(
          (e: any) => e.id === clerkData.primary_email_address_id,
        )?.email_address;

        if (!email) {
          console.warn(
            `[Clerk Webhook] No primary email found for clerkId=${clerkData?.id}, payload=${JSON.stringify(clerkData?.email_addresses)}`,
          );
          return new Response("No primary email found", { status: 400 });
        }

        let invitation = null;
        let resolvedRole: "school_admin" | "canteen_staff" | "parent" =
          "parent";

        if (event.type === "user.created") {
          const bootstrapEmail = env.BOOTSTRAP_ADMIN_EMAIL;

          if (bootstrapEmail && email === bootstrapEmail) {
            resolvedRole = "school_admin";
            console.log(
              `[Clerk Webhook] ${email} resolved as school_admin via BOOTSTRAP_ADMIN_EMAIL`,
            );
          } else {
            invitation = await db.query.staffInvitationsTable.findFirst({
              where: and(
                eq(staffInvitationsTable.email, email),
                inArray(staffInvitationsTable.status, ["pending", "accepted"]),
              ),
            });

            if (invitation) {
              resolvedRole = invitation.role as
                | "canteen_staff"
                | "school_admin";
              console.log(
                `[Clerk Webhook] ${email} resolved as ${resolvedRole} via invitation id=${invitation.id}`,
              );
            } else {
              console.log(
                `[Clerk Webhook] ${email} resolved as parent (no invitation found)`,
              );
            }
          }
        }

        const userData = {
          clerkId: clerkData.id,
          email,
          name:
            `${clerkData.first_name ?? ""} ${clerkData.last_name ?? ""}`.trim() ||
            "School Staff",
          imageUrl: clerkData.image_url ?? null,
          phone: clerkData.phone_numbers?.[0]?.phone_number ?? null,
          isActive: true,
          role: resolvedRole,
          createdAt: new Date(clerkData.created_at || Date.now()),
          updatedAt: new Date(clerkData.updated_at || Date.now()),
        };

        console.log(
          `[Clerk Webhook] upserting user: ${JSON.stringify(userData)}`,
        );

        let dbUserId: string | undefined;

        await db.transaction(async (tx) => {
          const dbUser = await upsertUser(userData);

          console.log(
            `[Clerk Webhook] upsertUser result: ${JSON.stringify(dbUser)}`,
          );

          if (!dbUser?.id) return;

          dbUserId = dbUser.id;

          await tx
            .insert(parentWalletsTable)
            .values({ parentId: dbUser.id, balance: "0.00" })
            .onConflictDoNothing();

          if (event.type === "user.created" && invitation) {
            if (
              invitation.role === "canteen_staff" &&
              invitation.canteenId &&
              invitation.invitedBy
            ) {
              await tx
                .insert(canteenStaffAssignmentsTable)
                .values({
                  staffId: dbUser.id,
                  canteenId: invitation.canteenId,
                  assignedBy: invitation.invitedBy,
                })
                .onConflictDoNothing();
            }

            await tx
              .update(staffInvitationsTable)
              .set({ status: "accepted" })
              .where(eq(staffInvitationsTable.id, invitation.id));
          }
        });

        bustUserCache(clerkData.id, dbUserId);

        if (event.type === "user.created" && dbUserId && email) {
          await Promise.all([
            db
              .update(newsletterSubscribersTable)
              .set({ convertedUserId: dbUserId })
              .where(eq(newsletterSubscribersTable.email, email)),
            db
              .update(demoRequestsTable)
              .set({ convertedUserId: dbUserId })
              .where(eq(demoRequestsTable.email, email)),
            db
              .update(contactSubmissionsTable)
              .set({ convertedUserId: dbUserId })
              .where(eq(contactSubmissionsTable.email, email)),
          ]);
        }

        // FIX: this break now always runs for both user.created and
        // user.updated, regardless of the inner `if`. Previously it was
        // nested inside that if-block, so user.updated events (which take
        // the false branch) fell through into the user.deleted case below
        // and deactivated the user on every password reset / profile update.
        break;
      }

      case "user.deleted": {
        // ── DEBUG: this is the only place isActive gets set to false ────────
        console.log(
          `[Clerk Webhook] user.deleted FIRED for clerkId=${clerkData?.id}. Full payload: ${JSON.stringify(clerkData, null, 2)}`,
        );

        if (clerkData.id == null) {
          console.warn(`[Clerk Webhook] user.deleted with no clerkData.id`);
          return new Response("No user ID provided", { status: 400 });
        }
        await deleteUser(clerkData.id);
        console.log(
          `[Clerk Webhook] deleteUser executed for clerkId=${clerkData.id} -> isActive=false`,
        );
        bustUserCache(clerkData.id);
        break;
      }

      default:
        console.log(`[Clerk Webhook] Unhandled event type: ${event.type}`);
        break;
    }
  } catch (error) {
    console.error("[Clerk Webhook] Error:", error);
    return new Response("Invalid webhook", { status: 400 });
  }

  return new Response("Webhook received", { status: 200 });
}
