// app/api/push/subscribe/route.ts
// POST  — saves a new push subscription for the authenticated user
// DELETE — removes a subscription (user unsubscribed / browser revoked)

import { NextRequest, NextResponse } from "next/server";
import { auth } from "@clerk/nextjs/server";
import { db } from "@/drizzle/db";
import { pushSubscriptionsTable, usersTable } from "@/drizzle/schema";
import { eq } from "drizzle-orm";

// ── POST /api/push/subscribe ───────────────────────────────────────────────────

export async function POST(req: NextRequest) {
    try {
        const { userId: clerkId } = await auth();
        if (!clerkId) {
            return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
        }

        // Resolve Clerk ID → local DB user ID
        const user = await db.query.usersTable.findFirst({
            where: eq(usersTable.clerkId, clerkId),
            columns: { id: true },
        });
        if (!user) {
            return NextResponse.json({ error: "User not found" }, { status: 404 });
        }

        const body = await req.json();
        const { endpoint, keys, userAgent } = body as {
            endpoint: string;
            keys: { p256dh: string; auth: string };
            userAgent?: string;
        };

        if (!endpoint || !keys?.p256dh || !keys?.auth) {
            return NextResponse.json({ error: "Invalid subscription" }, { status: 400 });
        }

        // Upsert — if the same endpoint is re-registered (e.g. after SW update),
        // refresh the keys rather than creating a duplicate row.
        await db
            .insert(pushSubscriptionsTable)
            .values({
                userId: user.id,
                endpoint,
                p256dh: keys.p256dh,
                auth: keys.auth,
                userAgent: userAgent ?? null,
            })
            .onConflictDoUpdate({
                target: pushSubscriptionsTable.endpoint,
                set: {
                    p256dh: keys.p256dh,
                    auth: keys.auth,
                    userId: user.id,
                },
            });

        return NextResponse.json({ ok: true });
    } catch (err) {
        console.error("[push/subscribe] POST error:", err);
        return NextResponse.json({ error: "Internal server error" }, { status: 500 });
    }
}

// ── DELETE /api/push/subscribe ─────────────────────────────────────────────────

export async function DELETE(req: NextRequest) {
    try {
        const { userId: clerkId } = await auth();
        if (!clerkId) {
            return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
        }

        const { endpoint } = await req.json() as { endpoint: string };
        if (!endpoint) {
            return NextResponse.json({ error: "Missing endpoint" }, { status: 400 });
        }

        await db
            .delete(pushSubscriptionsTable)
            .where(eq(pushSubscriptionsTable.endpoint, endpoint));

        return NextResponse.json({ ok: true });
    } catch (err) {
        console.error("[push/subscribe] DELETE error:", err);
        return NextResponse.json({ error: "Internal server error" }, { status: 500 });
    }
}