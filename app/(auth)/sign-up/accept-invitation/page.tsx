"use client";

import { Suspense, useEffect } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { useSignUp, useUser } from "@clerk/nextjs";
import { AuthCard, AuthButton } from "@/app/(auth)/_components/AuthCard";
import { Loader2 } from "lucide-react";

function AcceptInvitationForm() {
    const { isSignedIn } = useUser();
    const { signUp, errors, fetchStatus } = useSignUp();
    const router = useRouter();
    const searchParams = useSearchParams();
    const ticket = searchParams.get("__clerk_ticket");

    // Redirect already-signed-in users or completed sign-ups (e.g. page refresh)
    useEffect(() => {
        if (isSignedIn || signUp?.status === "complete") {
            router.replace("/dashboard");
        }
    }, [isSignedIn, signUp?.status, router]);

    if (!ticket) {
        return (
            <div className="flex min-h-screen items-center justify-center p-4">
                <div className="text-center space-y-2">
                    <p className="text-sm font-medium" style={{ color: "var(--text-primary)" }}>
                        Invalid invitation link
                    </p>
                    <p className="text-xs" style={{ color: "var(--text-muted)" }}>
                        Please contact your administrator for a new invitation.
                    </p>
                </div>
            </div>
        );
    }

    if (!signUp || isSignedIn) {
        return (
            <div className="flex min-h-screen items-center justify-center">
                <Loader2 size={24} className="animate-spin" style={{ color: "var(--text-muted)" }} />
            </div>
        );
    }

    const loading = fetchStatus === "fetching";

    // Core 3 API: use signUp.ticket() not signUp.create({ strategy: "ticket" })
    // Password is NOT passed here — Clerk handles email verification via the ticket.
    // signUp.finalize() IS correct in Core 3 — sets the session active and navigates.
    const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
        e.preventDefault();
        const form = e.currentTarget;
        const firstName = (form.elements.namedItem("firstName") as HTMLInputElement).value.trim();
        const lastName = (form.elements.namedItem("lastName") as HTMLInputElement).value.trim();

        const { error } = await signUp.ticket({ firstName, lastName, ticket });

        if (error) {
            console.error("[accept-invitation] ticket error:", JSON.stringify(error, null, 2));
            return;
        }

        if (signUp.status === "complete") {
            await signUp.finalize({
                navigate: ({ session, decorateUrl }) => {
                    // Handle any pending session tasks (MFA, etc.)
                    if (session?.currentTask) {
                        console.log("[accept-invitation] session task:", session.currentTask);
                        return;
                    }
                    const url = decorateUrl("/dashboard");
                    if (url.startsWith("http")) {
                        window.location.href = url;
                    } else {
                        router.replace(url);
                    }
                },
            });
        } else {
            console.error(
                "[accept-invitation] Unexpected status:", signUp.status,
                "missing:", signUp.missingFields,
                "unverified:", signUp.unverifiedFields,
            );
        }
    };

    return (
        <AuthCard
            title="Accept your invitation"
            subtitle="Set up your canteen staff account."
        >
            <form className="space-y-4" onSubmit={handleSubmit}>
                <div className="grid grid-cols-2 gap-3">
                    <div className="space-y-1.5">
                        <label
                            htmlFor="firstName"
                            className="text-sm font-medium"
                            style={{ color: "var(--text-primary)" }}
                        >
                            First name
                        </label>
                        <input
                            id="firstName"
                            name="firstName"
                            type="text"
                            required
                            placeholder="Jane"
                            autoComplete="given-name"
                            disabled={loading}
                            className="h-12 w-full rounded-xl border px-4 text-sm outline-none transition-all disabled:opacity-50"
                            style={{
                                background: "var(--bg-secondary)",
                                border: "1px solid var(--border-input)",
                                color: "var(--text-primary)",
                            }}
                        />
                        {errors?.fields?.firstName && (
                            <p className="text-xs" style={{ color: "#ef4444" }}>
                                {errors.fields.firstName.message}
                            </p>
                        )}
                    </div>
                    <div className="space-y-1.5">
                        <label
                            htmlFor="lastName"
                            className="text-sm font-medium"
                            style={{ color: "var(--text-primary)" }}
                        >
                            Last name
                        </label>
                        <input
                            id="lastName"
                            name="lastName"
                            type="text"
                            required
                            placeholder="Doe"
                            autoComplete="family-name"
                            disabled={loading}
                            className="h-12 w-full rounded-xl border px-4 text-sm outline-none transition-all disabled:opacity-50"
                            style={{
                                background: "var(--bg-secondary)",
                                border: "1px solid var(--border-input)",
                                color: "var(--text-primary)",
                            }}
                        />
                        {errors?.fields?.lastName && (
                            <p className="text-xs" style={{ color: "#ef4444" }}>
                                {errors.fields.lastName.message}
                            </p>
                        )}
                    </div>
                </div>

                {/* Global errors */}
                {errors?.global?.map((err, i) => (
                    <p key={i} className="text-xs" style={{ color: "#ef4444" }}>
                        {err.longMessage}
                    </p>
                ))}

                {/* Required for Clerk's bot protection */}
                <div id="clerk-captcha" />

                <AuthButton type="submit" disabled={loading}>
                    {loading ? (
                        <span className="flex items-center gap-2">
                            <Loader2 size={14} className="animate-spin" />
                            Setting up account…
                        </span>
                    ) : (
                        "Accept invitation"
                    )}
                </AuthButton>
            </form>
        </AuthCard>
    );
}

export default function AcceptInvitationPage() {
    return (
        <Suspense
            fallback={
                <div className="flex min-h-screen items-center justify-center">
                    <Loader2 size={24} className="animate-spin" style={{ color: "var(--text-muted)" }} />
                </div>
            }
        >
            <AcceptInvitationForm />
        </Suspense>
    );
}