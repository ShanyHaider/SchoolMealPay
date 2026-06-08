// public/sw.js
// Service Worker for SchoolMealPay PWA push notifications.
// Placed in /public so Next.js serves it at the root scope (/sw.js).
// Scope = "/" means this SW controls the entire app.

const CACHE_NAME = "schoolmealpay-v1";

// ── Install & Activate ─────────────────────────────────────────────────────────
// Skip waiting so the new SW activates immediately on update.

self.addEventListener("install", (event) => {
    self.skipWaiting();
});

self.addEventListener("activate", (event) => {
    event.waitUntil(self.clients.claim());
});

// ── Push event ─────────────────────────────────────────────────────────────────
// Fired when the server sends a push message via web-push.
// The payload matches the JSON body we send from lib/webpush.ts.

self.addEventListener("push", (event) => {
    if (!event.data) return;

    let data;
    try {
        data = event.data.json();
    } catch {
        console.error("[SW] Failed to parse push payload:", event.data.text());
        return;
    }

    const {
        title = "SchoolMealPay",
        body = "You have a new notification.",
        icon = "/icons/icon-192x192.png",
        badge = "/icons/badge-72x72.png",
        url = "/",
        tag,
    } = data;

    const options = {
        body,
        icon,
        badge,
        tag,                    // replaces existing notification with same tag
        renotify: !!tag,        // vibrate/sound even if same tag replaces
        data: { url },          // passed through to notificationclick handler
        actions: [
            { action: "open", title: "View" },
            { action: "dismiss", title: "Dismiss" },
        ],
        requireInteraction: false,
    };

    event.waitUntil(
        self.registration.showNotification(title, options),
    );
});

// ── Notification click ─────────────────────────────────────────────────────────
// Opens the app at the relevant URL when the user taps the notification.

self.addEventListener("notificationclick", (event) => {
    event.notification.close();

    if (event.action === "dismiss") return;

    const url = event.notification.data?.url ?? "/";

    event.waitUntil(
        self.clients
            .matchAll({ type: "window", includeUncontrolled: true })
            .then((clients) => {
                // If app is already open, focus it and navigate
                for (const client of clients) {
                    if (client.url.includes(self.location.origin) && "focus" in client) {
                        client.focus();
                        client.navigate(url);
                        return;
                    }
                }
                // Otherwise open a new tab
                if (self.clients.openWindow) {
                    return self.clients.openWindow(url);
                }
            }),
    );
});

// ── Push subscription change ───────────────────────────────────────────────────
// Fired when the browser rotates push subscription keys.
// We re-register automatically so the user doesn't lose notifications.

self.addEventListener("pushsubscriptionchange", (event) => {
    event.waitUntil(
        self.registration.pushManager
            .subscribe({
                userVisibleOnly: true,
                applicationServerKey: event.oldSubscription?.options?.applicationServerKey,
            })
            .then((newSubscription) => {
                return fetch("/api/push/subscribe", {
                    method: "POST",
                    headers: { "Content-Type": "application/json" },
                    body: JSON.stringify({
                        endpoint: newSubscription.endpoint,
                        keys: {
                            p256dh: btoa(
                                String.fromCharCode(
                                    ...new Uint8Array(newSubscription.getKey("p256dh")),
                                ),
                            ),
                            auth: btoa(
                                String.fromCharCode(
                                    ...new Uint8Array(newSubscription.getKey("auth")),
                                ),
                            ),
                        },
                    }),
                });
            }),
    );
});