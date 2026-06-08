"use client";

// components/PushSubscriber.tsx
// Mount this once in the parent layout (as a child of the layout Server Component).
// It silently registers the SW and subscribes to push — no UI unless you want
// to show a permission prompt. Works in the background on mount.
//
// <PushSubscriber vapidPublicKey={process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY!} />

import { useEffect } from "react";

interface Props {
    vapidPublicKey: string;
}

// ── Helpers ────────────────────────────────────────────────────────────────────

function urlBase64ToUint8Array(base64String: string): Uint8Array<ArrayBuffer> {
    const padding = "=".repeat((4 - (base64String.length % 4)) % 4);
    const base64 = (base64String + padding).replace(/-/g, "+").replace(/_/g, "/");
    const rawData = atob(base64);
    return Uint8Array.from([...rawData].map((c) => c.charCodeAt(0))) as Uint8Array<ArrayBuffer>;
}

function uint8ArrayToBase64(arr: ArrayBuffer): string {
    return btoa(String.fromCharCode(...new Uint8Array(arr)));
}

// ── Component ──────────────────────────────────────────────────────────────────

export function PushSubscriber({ vapidPublicKey }: Props) {
    useEffect(() => {
        // Push is not supported in all browsers (e.g. Safari < 16)
        if (
            typeof window === "undefined" ||
            !("serviceWorker" in navigator) ||
            !("PushManager" in window)
        ) {
            return;
        }

        async function register() {
            try {
                // 1. Register the service worker
                const registration = await navigator.serviceWorker.register("/sw.js", {
                    scope: "/",
                });

                // Wait for SW to be active before proceeding
                await navigator.serviceWorker.ready;

                // 2. Check current permission — don't prompt if already denied
                if (Notification.permission === "denied") return;

                // 3. Check if already subscribed (avoids duplicate DB rows)
                const existing = await registration.pushManager.getSubscription();
                if (existing) {
                    // Already subscribed — re-POST to ensure DB is in sync
                    // (handles the case where the user cleared app data)
                    await saveSubscription(existing);
                    return;
                }

                // 4. Request permission (browser shows the native prompt)
                const permission = await Notification.requestPermission();
                if (permission !== "granted") return;

                // 5. Subscribe to push
                const subscription = await registration.pushManager.subscribe({
                    userVisibleOnly: true,
                    applicationServerKey: urlBase64ToUint8Array(vapidPublicKey),
                });

                // 6. Save to DB via API route
                await saveSubscription(subscription);
            } catch (err) {
                console.error("[PushSubscriber] Registration failed:", err);
            }
        }

        register();
    }, [vapidPublicKey]);

    // No UI — this component is a side-effect only
    return null;
}

async function saveSubscription(subscription: PushSubscription): Promise<void> {
    const p256dh = subscription.getKey("p256dh");
    const auth = subscription.getKey("auth");

    if (!p256dh || !auth) return;

    await fetch("/api/push/subscribe", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
            endpoint: subscription.endpoint,
            keys: {
                p256dh: uint8ArrayToBase64(p256dh),
                auth: uint8ArrayToBase64(auth),
            },
            userAgent: navigator.userAgent,
        }),
    });
}