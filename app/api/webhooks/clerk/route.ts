// app/api/webhooks/clerk/route.ts
import { NextRequest } from "next/server";
import { verifyWebhook } from "@clerk/nextjs/webhooks";
import { db } from "@/drizzle/db";
import { parentWalletsTable } from "@/drizzle/schema";
import { upsertUser, deleteUser } from "@/features/users/db";

export async function POST(request: NextRequest) {
  try {
    const event = await verifyWebhook(request);
    const clerkData = event.data as any;

    switch (event.type) {
      case "user.created":
      case "user.updated": {
        const email = clerkData.email_addresses?.find(
          (e: any) => e.id === clerkData.primary_email_address_id,
        )?.email_address;

        if (!email) {
          return new Response("No primary email found", { status: 400 });
        }

        const userData = {
          clerkId: clerkData.id,
          email,
          name:
            `${clerkData.first_name ?? ""} ${clerkData.last_name ?? ""}`.trim() ||
            "School Parent",
          imageUrl: clerkData.image_url ?? null,
          phone: clerkData.phone_numbers?.[0]?.phone_number ?? null,
          isActive: true,
          // Only falls back to parent if it's a brand new record insert
          role: "parent" as const,
          createdAt: new Date(clerkData.created_at || Date.now()),
          updatedAt: new Date(clerkData.updated_at || Date.now()),
        };

        // Execute the upserter inside a structural transaction block
        await db.transaction(async (tx) => {
          const dbUser = await upsertUser(userData);

          // Seed or check parent wallet records without crashing if it exists
          if (dbUser?.id) {
            await tx
              .insert(parentWalletsTable)
              .values({ parentId: dbUser.id, balance: "0.00" })
              .onConflictDoNothing();
          }
        });

        break;
      }

      case "user.deleted": {
        if (clerkData.id == null) {
          return new Response("No user ID provided", { status: 400 });
        }
        await deleteUser(clerkData.id);
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
