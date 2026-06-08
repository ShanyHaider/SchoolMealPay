// app/api/webhooks/clerk/route.ts
import { NextRequest } from "next/server";
import { verifyWebhook } from "@clerk/nextjs/webhooks";
import { db } from "@/drizzle/db";
import {
  parentWalletsTable,
  canteenStaffAssignmentsTable,
  staffInvitationsTable,
} from "@/drizzle/schema";
import { upsertUser, deleteUser } from "@/features/users/db";
import { eq, and, inArray } from "drizzle-orm";
import { revalidateTag } from "next/cache";
import { getGlobalTag, getIdTag } from "@/lib/cache";
import { bustUserCache } from "@/lib/cacheRevalidation";

// ─── Cache busting helper ──────────────────────────────────────────────────────
// Busts every cache tag that getUser() and getUserFromDb() write under,
// so the layout guard never serves a stale null / wrong-role result.

export async function POST(request: NextRequest) {
  try {
    const event = await verifyWebhook(request);
    const clerkData = event.data as any;

    switch (event.type) {
      case "user.created":
      case "user.updated": {
        console.log("[webhook debug]", JSON.stringify({
          email: clerkData.email_addresses?.find(
            (e: any) => e.id === clerkData.primary_email_address_id
          )?.email_address,
          public_metadata: clerkData.public_metadata,
        }, null, 2));

        const email = clerkData.email_addresses?.find(
          (e: any) => e.id === clerkData.primary_email_address_id,
        )?.email_address;

        if (!email) {
          return new Response("No primary email found", { status: 400 });
        }

        let invitation = null;
        let resolvedRole: "canteen_staff" | "parent" = "parent";

        if (event.type === "user.created") {
          invitation = await db.query.staffInvitationsTable.findFirst({
            where: and(
              eq(staffInvitationsTable.email, email),
              // Accept both — Clerk marks "accepted" before user.created fires
              inArray(staffInvitationsTable.status, ["pending", "accepted"]),
            ),
          });

          if (invitation) {
            resolvedRole = "canteen_staff";
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

        let dbUserId: string | undefined;

        await db.transaction(async (tx) => {
          const dbUser = await upsertUser(userData);

          if (!dbUser?.id) return;

          dbUserId = dbUser.id;

          await tx
            .insert(parentWalletsTable)
            .values({ parentId: dbUser.id, balance: "0.00" })
            .onConflictDoNothing();

          if (event.type === "user.created" && invitation) {
            if (invitation.canteenId) {
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

        // ── Bust the cache AFTER the transaction commits ───────────────────
        // Without this, getUser(clerkId) serves the stale null that was cached
        // before this user existed, causing the canteen-staff layout guard to
        // redirect → / → /dashboard → loop.
        bustUserCache(clerkData.id, dbUserId);

        break;
      }

      case "user.deleted": {
        if (clerkData.id == null) {
          return new Response("No user ID provided", { status: 400 });
        }
        await deleteUser(clerkData.id);
        // Bust cache on delete too so stale active-user data isn't served
        bustUserCache(clerkData.id);
        break;
      }

      default:
        break;
    }
  } catch (error) {
    console.error("[Clerk Webhook] Error:", error);
    return new Response("Invalid webhook", { status: 400 });
  }

  return new Response("Webhook received", { status: 200 });
}