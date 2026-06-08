import { Suspense } from "react";
import { auth } from "@clerk/nextjs/server";
import { Navbar } from "./Navbar";
import { BillingTabServer } from "@/components/userMenu/tabs/BillingTab";
import { NotificationsTab } from "@/components/userMenu/tabs/NotificationsTab";

function BillingFallback() {
    return (
        <div className="space-y-3 p-1">
            <div className="h-4 w-32 rounded-lg bg-zinc-200 dark:bg-zinc-800 animate-pulse" />
            <div className="h-24 rounded-2xl bg-zinc-100 dark:bg-zinc-900 animate-pulse" />
        </div>
    );
}

function NotificationsFallback() {
    return (
        <div className="space-y-2 p-1">
            {[1, 2, 3].map((i) => (
                <div key={i} className="h-16 rounded-2xl bg-zinc-100 dark:bg-zinc-900 animate-pulse" />
            ))}
        </div>
    );
}

// Isolated async component so auth() runs inside a Suspense boundary
async function NavbarAuth() {
    const { userId } = await auth();
    const isSignedIn = !!userId;

    return (
        <Navbar
            initialSignedIn={isSignedIn}
            billingTab={
                <Suspense fallback={<BillingFallback />}>
                    <BillingTabServer />
                </Suspense>
            }
            notificationsTab={
                <Suspense fallback={<NotificationsFallback />}>
                    <NotificationsTab />
                </Suspense>
            }
        />
    );
}

// Navbar shell shown instantly while auth resolves
function NavbarFallback() {
    return (
        <div className="fixed top-6 left-0 right-0 z-50 flex w-full justify-center px-4">
            <div className="flex h-16 w-full max-w-5xl items-center justify-between rounded-full border border-zinc-200/20 bg-white/70 px-5 shadow-2xl backdrop-blur-xl dark:border-zinc-800/40 dark:bg-zinc-950/70">
                <div className="h-11 w-11 rounded-full bg-zinc-200 dark:bg-zinc-800 animate-pulse" />
                <div className="h-6 w-48 rounded-full bg-zinc-200 dark:bg-zinc-800 animate-pulse hidden md:block" />
                <div className="h-11 w-28 rounded-full bg-zinc-200 dark:bg-zinc-800 animate-pulse" />
            </div>
        </div>
    );
}

export function NavbarServer() {
    return (
        <Suspense fallback={<NavbarFallback />}>
            <NavbarAuth />
        </Suspense>
    );
}