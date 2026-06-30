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
import { formatPKR } from "../currency";

// ── VAPID setup ────────────────────────────────────────────────────────────────
webpush.setVapidDetails(
    `mailto:${process.env.VAPID_EMAIL ?? "admin@schoolmealpay.com"}`,
    process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY!,
    process.env.VAPID_PRIVATE_KEY!,
);

// ── Payload type ───────────────────────────────────────────────────────────────

export interface PushPayload {
    title: string;
    body: string;
    icon?: string;
    badge?: string;
    url?: string;
    tag?: string;
}

// ── Core sender ───────────────────────────────────────────────────────────────

export async function sendPushNotification(
    userId: string,
    payload: PushPayload,
): Promise<void> {
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

    const results = await Promise.allSettled(
        subscriptions.map((sub) =>
            webpush
                .sendNotification(
                    { endpoint: sub.endpoint, keys: { p256dh: sub.p256dh, auth: sub.auth } },
                    body,
                    { TTL: 60 * 60 * 24 },
                )
                .catch(async (err: any) => {
                    if (err?.statusCode === 410) {
                        await db
                            .delete(pushSubscriptionsTable)
                            .where(eq(pushSubscriptionsTable.id, sub.id));
                    }
                    throw err;
                }),
        ),
    );

    results.forEach((r, i) => {
        if (r.status === "rejected") {
            const statusCode = (r.reason as any)?.statusCode;
            if (statusCode !== 410) {
                console.error(
                    `[webpush] Failed to send to subscription ${subscriptions[i]?.id}:`,
                    r.reason,
                );
            }
        }
    });
}

// ── Push event catalogue ───────────────────────────────────────────────────────
// One entry per notification event, grouped by the role that receives it.
// Import the group you need in each action file.

export const PushEvents = {

    // ── Parent ───────────────────────────────────────────────────────────────────

    orderPlaced: (studentName: string, total: number): PushPayload => ({
        title: "Order placed ✓",
        body: `${studentName}'s order for ${formatPKR(total)} has been confirmed.`,
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

    walletTopUp: (amount: number): PushPayload => ({
        title: "Wallet topped up 💳",
        body: `${formatPKR(amount)} has been added to your wallet.`,
        url: "/parent/wallet",
        tag: "wallet-topup",
    }),

    spendingApprovalNeeded: (studentName: string, amount: number): PushPayload => ({
        title: "Approval needed ⚠️",
        body: `${studentName} wants to order ${formatPKR(amount)}, which exceeds the daily limit.`,
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

    orderingDisabled: (studentName: string): PushPayload => ({
        title: "Ordering disabled",
        body: `Meal ordering has been disabled for ${studentName} by the school.`,
        url: "/parent/children",
        tag: "ordering-disabled",
    }),

    orderingEnabled: (studentName: string): PushPayload => ({
        title: "Ordering re-enabled ✓",
        body: `Meal ordering has been re-enabled for ${studentName}.`,
        url: "/parent/children",
        tag: "ordering-enabled",
    }),

    accountSuspended: (): PushPayload => ({
        title: "Account suspended",
        body: "Your account has been suspended. Contact the school administrator for details.",
        url: "/",
        tag: "account-suspended",
    }),

    accountReactivated: (): PushPayload => ({
        title: "Account reactivated ✓",
        body: "Your account has been reactivated. You can now log in.",
        url: "/",
        tag: "account-reactivated",
    }),

    // ── Canteen Staff ─────────────────────────────────────────────────────────────

    staff: {
        newOrder: (studentName: string, itemCount: number): PushPayload => ({
            title: "New order 🧾",
            body: `${studentName} placed an order with ${itemCount} item${itemCount === 1 ? "" : "s"}.`,
            url: "/canteen-staff/orders",
            tag: "new-order",
        }),

        orderCancelled: (studentName: string): PushPayload => ({
            title: "Order cancelled",
            body: `${studentName}'s order has been cancelled. Remove it from the queue.`,
            url: "/canteen-staff/orders",
            tag: "order-cancelled",
        }),

        lowInventory: (itemName: string, quantity: string, unit: string): PushPayload => ({
            title: "Low stock ⚠️",
            body: `${itemName} is low: ${quantity} ${unit} remaining.`,
            url: "/canteen-staff/inventory",
            tag: `low-inventory-${itemName}`,
        }),

        assigned: (canteenName: string): PushPayload => ({
            title: "Canteen assigned",
            body: `You have been assigned to ${canteenName}.`,
            url: "/canteen-staff",
            tag: "canteen-assigned",
        }),

        unassigned: (canteenName: string): PushPayload => ({
            title: "Canteen assignment removed",
            body: `You have been removed from ${canteenName}.`,
            url: "/canteen-staff",
            tag: "canteen-unassigned",
        }),

        accountDisabled: (): PushPayload => ({
            title: "Account disabled",
            body: "Your staff account has been disabled. Contact the school administrator.",
            url: "/",
            tag: "account-disabled",
        }),

        accountEnabled: (): PushPayload => ({
            title: "Account re-enabled ✓",
            body: "Your staff account has been re-enabled.",
            url: "/canteen-staff",
            tag: "account-enabled",
        }),
    },

    // ── School Admin ──────────────────────────────────────────────────────────────

    admin: {
        linkRequested: (parentName: string, studentName: string): PushPayload => ({
            title: "Link request 🔗",
            body: `${parentName} has requested to link to ${studentName}.`,
            url: "/school-admin/students",
            tag: "link-requested",
        }),

        lowRatingFeedback: (studentName: string, rating: number): PushPayload => ({
            title: "Low rating received ⭐",
            body: `${studentName}'s meal received a ${rating}-star rating. Review feedback.`,
            url: "/school-admin/feedback",
            tag: "low-rating-feedback",
        }),

        systemFeedbackSubmitted: (type: string): PushPayload => ({
            title: "New feedback submitted",
            body: `A ${type.replace("_", " ")} has been submitted and needs review.`,
            url: "/school-admin/feedback",
            tag: "system-feedback",
        }),

        studentLimitWarning: (current: number, limit: number): PushPayload => ({
            title: "Student limit warning ⚠️",
            body: `${current} of ${limit} student slots used. Consider upgrading your plan.`,
            url: "/school-admin/billing",
            tag: "student-limit-warning",
        }),

        tierChanged: (newTier: string): PushPayload => ({
            title: "Subscription tier updated",
            body: `Your subscription has been changed to ${newTier.replace("_", " ")}.`,
            url: "/school-admin/billing",
            tag: "tier-changed",
        }),

        studentLimitChanged: (newLimit: number): PushPayload => ({
            title: "Student limit updated",
            body: `Your student capacity has been updated to ${newLimit}.`,
            url: "/school-admin/billing",
            tag: "student-limit-changed",
        }),
    },

    // ── System Admin ──────────────────────────────────────────────────────────────

    systemAdmin: {
        userBlocked: (userName: string): PushPayload => ({
            title: "User blocked",
            body: `${userName}'s account has been suspended.`,
            url: "/system-admin/users",
            tag: "user-blocked",
        }),

        userUnblocked: (userName: string): PushPayload => ({
            title: "User reactivated",
            body: `${userName}'s account has been reactivated.`,
            url: "/system-admin/users",
            tag: "user-unblocked",
        }),

        tierOverridden: (newTier: string): PushPayload => ({
            title: "Tier overridden",
            body: `School subscription changed to ${newTier.replace("_", " ")}.`,
            url: "/system-admin",
            tag: "tier-overridden",
        }),

        limitAdjusted: (newLimit: number): PushPayload => ({
            title: "Student limit adjusted",
            body: `School student limit set to ${newLimit}.`,
            url: "/system-admin",
            tag: "limit-adjusted",
        }),
    },

} as const;