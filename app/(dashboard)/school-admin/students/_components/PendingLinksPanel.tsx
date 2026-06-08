"use client";

import { useState, useTransition } from "react";
import { CheckCircle, XCircle, Loader2 } from "lucide-react";
import { resolveParentLink } from "@/db/actions/Admin";
import type { getPendingParentLinks } from "@/db/queries/Admin";

type PendingLink = Awaited<ReturnType<typeof getPendingParentLinks>>[number];

interface PendingLinksPanelProps {
    links: PendingLink[];
    toast: (message: string, type?: "success" | "error" | "warning") => void;
}

export function PendingLinksPanel({ links, toast }: PendingLinksPanelProps) {
    const [isPending, startTransition] = useTransition();
    const [resolvingId, setResolvingId] = useState<string | null>(null);

    const resolve = (link: PendingLink, decision: "approved" | "rejected") => {
        setResolvingId(link.id);
        startTransition(async () => {
            try {
                await resolveParentLink(link.id, decision);
                toast(
                    decision === "approved"
                        ? `Link request from ${link.parent?.name} approved.`
                        : `Link request from ${link.parent?.name} rejected.`,
                    decision === "approved" ? "success" : "warning",
                );
            } catch {
                toast("Failed to process the request. Please try again.", "error");
            } finally {
                setResolvingId(null);
            }
        });
    };

    if (links.length === 0) {
        return (
            <div
                className="rounded-xl border py-16 text-center"
                style={{ background: "var(--bg-card)", borderColor: "var(--border-card)" }}
            >
                <CheckCircle size={32} className="mx-auto mb-3" style={{ color: "#22c55e" }} />
                <p className="text-sm" style={{ color: "var(--text-muted)" }}>
                    No pending link requests.
                </p>
            </div>
        );
    }

    return (
        <div
            className="rounded-xl border overflow-hidden"
            style={{
                background: "var(--bg-card)",
                borderColor: "var(--border-card)",
                boxShadow: "var(--shadow-card)",
            }}
        >
            <div className="divide-y" style={{ borderColor: "var(--border-primary)" }}>
                {links.map((link) => {
                    const isResolving = isPending && resolvingId === link.id;
                    return (
                        <div
                            key={link.id}
                            className="flex items-center justify-between gap-4 px-5 py-4"
                        >
                            <div className="flex items-center gap-4">
                                <div
                                    className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full text-sm font-bold"
                                    style={{
                                        background: "var(--bg-tertiary)",
                                        color: "var(--text-secondary)",
                                    }}
                                >
                                    {link.parent?.name?.[0]?.toUpperCase() ?? "P"}
                                </div>
                                <div>
                                    <p
                                        className="text-sm font-medium"
                                        style={{ color: "var(--text-primary)" }}
                                    >
                                        {link.parent?.name}{" "}
                                        <span
                                            className="ml-1 font-normal"
                                            style={{ color: "var(--text-muted)" }}
                                        >
                                            wants to link to
                                        </span>{" "}
                                        {link.student?.name}
                                    </p>
                                    <p className="text-xs" style={{ color: "var(--text-muted)" }}>
                                        {link.parent?.email} · Code:{" "}
                                        <span className="font-mono">
                                            {link.student?.studentCode}
                                        </span>
                                    </p>
                                </div>
                            </div>

                            <div className="flex shrink-0 gap-2">
                                <button
                                    onClick={() => resolve(link, "approved")}
                                    disabled={isResolving}
                                    className="flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-xs font-medium transition-all"
                                    style={{
                                        background: "rgba(34,197,94,0.12)",
                                        color: "#22c55e",
                                        border: "1px solid rgba(34,197,94,0.2)",
                                    }}
                                >
                                    {isResolving ? (
                                        <Loader2 size={12} className="animate-spin" />
                                    ) : (
                                        <CheckCircle size={12} />
                                    )}
                                    Approve
                                </button>
                                <button
                                    onClick={() => resolve(link, "rejected")}
                                    disabled={isResolving}
                                    className="flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-xs font-medium transition-all"
                                    style={{
                                        background: "rgba(239,68,68,0.12)",
                                        color: "#ef4444",
                                        border: "1px solid rgba(239,68,68,0.2)",
                                    }}
                                >
                                    {isResolving ? (
                                        <Loader2 size={12} className="animate-spin" />
                                    ) : (
                                        <XCircle size={12} />
                                    )}
                                    Reject
                                </button>
                            </div>
                        </div>
                    );
                })}
            </div>
        </div>
    );
}