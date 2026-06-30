// lib/notify.ts
// Central notification helper for all roles.
//
// Usage:
//   import { notify } from "@/lib/notify";
//
//   await notify({
//     userId: "...",
//     type: "order_confirmed",
//     event: PushEvents.orderPlaced(name, total),
//     channels: ["in_app", "push"],   // defaults to both if omitted
//   });
//
// Rules:
//   - "in_app" always writes a row to notificationsTable
//   - "push"   sends a Web Push if the user has subscriptions; silently
//              skips if they have none (no error thrown)
//   - Both run in parallel. A push failure never prevents the DB write.
//   - The DB write is awaited; push is fire-and-forget (don't block the
//     calling action on network latency to a push service).

import { createNotification } from "@/db/actions/Notifications";
import { sendPushNotification, type PushPayload } from "@/lib/notification/webpush";

type NotificationChannel = "in_app" | "push";

export interface NotifyParams {
    /** users.id (not clerkId) of the recipient */
    userId: string;

    /**
     * Machine-readable event name stored in notificationsTable.type.
     * Use snake_case, e.g. "order_confirmed", "low_inventory", "link_approved".
     */
    type: string;

    /** Push payload — title + body are also used for the in-app row */
    event: PushPayload;

    /**
     * Which channels to send on.
     * Defaults to ["in_app", "push"] — sends both unless you opt down.
     * Pass ["in_app"] for events where push makes no sense (e.g. account
     * suspended — the user has no active session to receive it).
     */
    channels?: NotificationChannel[];
}

export async function notify({
    userId,
    type,
    event,
    channels = ["in_app", "push"],
}: NotifyParams): Promise<void> {
    const doInApp = channels.includes("in_app");
    const doPush = channels.includes("push");

    // In-app write is awaited — we want a guaranteed DB record.
    if (doInApp) {
        await createNotification({
            userId,
            type,
            title: event.title,
            message: event.body,
            // Store the actual channel(s) used. When both are sent we record "push"
            // because the push payload is the richer record; in_app-only stays "in_app".
            channel: doPush ? "push" : "in_app",
        });
    }

    // Push is fire-and-forget — never let a push failure surface to the caller.
    if (doPush) {
        sendPushNotification(userId, event).catch((err) =>
            console.error(`[notify] push failed for user ${userId} (${type}):`, err),
        );
    }
}

// ── Convenience: notify multiple recipients with the same event ────────────────
// Useful for e.g. notifying all parents linked to a student.

export async function notifyMany(
    userIds: string[],
    params: Omit<NotifyParams, "userId">,
): Promise<void> {
    if (userIds.length === 0) return;
    await Promise.all(userIds.map((userId) => notify({ userId, ...params })));
}