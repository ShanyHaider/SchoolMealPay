// lib/webpush.ts
// Utility for sending Web Push notifications to all devices for a user.
// Call this from server actions AFTER the DB mutation succeeds.
//
// Usage:
//   await sendPushNotification(parentId, {
//     title: "Order placed",
//     body: "Shany's lunch order has been confirmed.",
//     icon: "/icons/icon-192x192.png",
//     url: "/parent/orders",
//   });

import webpush from "web-push";
import { db } from "@/drizzle/db";
import { pushSubscriptionsTable } from "@/drizzle/schema";
import { eq } from "drizzle-orm";

// ── VAPID setup ────────────────────────────────────────────────────────────────
// Set once at module load. web-push caches this internally.
webpush.setVapidDetails(
    `mailto:${process.env.VAPID_EMAIL ?? "admin@schoolmealpay.com"}`,
    process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY!,
    process.env.VAPID_PRIVATE_KEY!,
);

// ── Payload type ───────────────────────────────────────────────────────────────

export interface PushPayload {
    title: string;
    body: string;
    icon?: string;   // defaults to /icons/icon-192x192.png
    badge?: string;  // small monochrome icon shown in status bar
    url?: string;    // where to navigate on notification click
    tag?: string;    // replaces earlier notification with same tag (de-dup)
}

// ── Core sender ───────────────────────────────────────────────────────────────

export async function sendPushNotification(
    userId: string,
    payload: PushPayload,
): Promise<void> {
    // Fetch all active subscriptions for this user
    const subscriptions = await db.query.pushSubscriptionsTable.findMany({
        where: eq(pushSubscriptionsTable.userId, userId),
    });

    if (subscriptions.length === 0) return;

    const body = JSON.stringify({
        title: payload.title,
        body: payload.body,
        icon: payload.icon ?? "/icons/icon-192x192.png",
        badge: payload.badge ?? "/icons/badge-72x72.png",
        url: payload.url ?? "/",
        tag: payload.tag,
    });

    // Send to all devices in parallel; stale subscriptions are pruned on 410
    const results = await Promise.allSettled(
        subscriptions.map((sub) =>
            webpush.sendNotification(
                {
                    endpoint: sub.endpoint,
                    keys: { p256dh: sub.p256dh, auth: sub.auth },
                },
                body,
                { TTL: 60 * 60 * 24 }, // 24h — deliver even if device is offline
            ).catch(async (err: any) => {
                // 410 Gone = subscription expired/revoked; remove it
                if (err?.statusCode === 410) {
                    await db
                        .delete(pushSubscriptionsTable)
                        .where(eq(pushSubscriptionsTable.id, sub.id));
                }
                throw err;
            }),
        ),
    );

    // Log failures without crashing the calling action
    results.forEach((r, i) => {
        if (r.status === "rejected") {
            const statusCode = (r.reason as any)?.statusCode;
            if (statusCode !== 410) {
                // 410s are already handled above; log everything else
                console.error(
                    `[webpush] Failed to send to subscription ${subscriptions[i]?.id}:`,
                    r.reason,
                );
            }
        }
    });
}

// ── Convenience wrappers ───────────────────────────────────────────────────────
// Pre-built payloads for each notification event.
// Import the one you need in each server action.

export const PushEvents = {
    orderPlaced: (studentName: string, total: number): PushPayload => ({
        title: "Order placed ✓",
        body: `${studentName}'s order for PKR ${Math.round(total)} has been confirmed.`,
        url: "/parent/orders",
        tag: "order-placed",
    }),

    mealReady: (studentName: string): PushPayload => ({
        title: "Meal ready 🍱",
        body: `${studentName}'s meal is ready for collection at the canteen.`,
        url: "/parent/orders",
        tag: "meal-ready",
    }),

    orderCollected: (studentName: string): PushPayload => ({
        title: "Meal collected ✓",
        body: `${studentName}'s meal has been collected.`,
        url: "/parent/orders",
        tag: "meal-collected",
    }),

    orderCancelled: (studentName: string): PushPayload => ({
        title: "Order cancelled",
        body: `${studentName}'s order has been cancelled. Your wallet has been refunded.`,
        url: "/parent/orders",
        tag: "order-cancelled",
    }),

    spendingApprovalNeeded: (studentName: string, amount: number): PushPayload => ({
        title: "Approval needed ⚠️",
        body: `${studentName} wants to order PKR ${Math.round(amount)}, which exceeds the daily limit.`,
        url: "/parent",
        tag: "spending-approval",
    }),

    spendingApprovalResolved: (approved: boolean): PushPayload => ({
        title: approved ? "Order approved ✓" : "Order declined",
        body: approved
            ? "The over-limit order has been approved."
            : "The over-limit order has been declined.",
        url: "/parent/orders",
        tag: "spending-approval",
    }),

    walletTopUp: (amount: number): PushPayload => ({
        title: "Wallet topped up 💳",
        body: `PKR ${Math.round(amount)} has been added to your wallet.`,
        url: "/parent/wallet",
        tag: "wallet-topup",
    }),

    linkApproved: (studentName: string): PushPayload => ({
        title: "Child linked ✓",
        body: `Your link request for ${studentName} has been approved.`,
        url: "/parent/children",
        tag: "link-approved",
    }),

    linkRejected: (studentName: string): PushPayload => ({
        title: "Link request declined",
        body: `Your link request for ${studentName} was not approved. Contact the school.`,
        url: "/parent/children",
        tag: "link-rejected",
    }),
} as const;