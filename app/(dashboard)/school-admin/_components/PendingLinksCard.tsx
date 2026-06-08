"use client";

// app/(dashboard)/school-admin/_components/PendingLinksCard.tsx

import { useState, useTransition } from "react";
import { resolveParentLink } from "@/db/actions/Admin";
import { CheckCircle, XCircle, Clock, Loader2 } from "lucide-react";
import type { getPendingParentLinks } from "@/db/queries/Admin";

type Link = Awaited<ReturnType<typeof getPendingParentLinks>>[number];

export function PendingLinksCard({ links }: { links: Link[] }) {
  const [isPending, startTransition] = useTransition();
  const [resolvingId, setResolvingId] = useState<string | null>(null);

  const resolve = (id: string, decision: "approved" | "rejected") => {
    setResolvingId(id);
    startTransition(async () => {
      await resolveParentLink(id, decision);
      setResolvingId(null);
    });
  };

  return (
    <div
      className="rounded-xl border overflow-hidden"
      style={{
        background: "var(--bg-card)",
        borderColor: "var(--border-card)",
        boxShadow: "var(--shadow-card)",
      }}
    >
      {/* Header */}
      <div
        className="px-5 py-4 border-b flex items-center gap-2"
        style={{ borderColor: "var(--border-primary)" }}
      >
        <Clock size={15} style={{ color: "var(--text-muted)" }} />
        <h2 className="text-sm font-semibold" style={{ color: "var(--text-primary)" }}>
          Pending Parent Links
        </h2>
        {links.length > 0 && (
          <span
            className="ml-auto px-1.5 py-0.5 rounded-full text-xs font-medium"
            style={{ background: "rgba(239,68,68,0.12)", color: "#ef4444" }}
          >
            {links.length}
          </span>
        )}
      </div>

      {links.length === 0 ? (
        <div className="py-10 text-center">
          <CheckCircle size={28} className="mx-auto mb-2" style={{ color: "#22c55e" }} />
          <p className="text-sm" style={{ color: "var(--text-muted)" }}>
            All caught up!
          </p>
        </div>
      ) : (
        <div className="divide-y" style={{ borderColor: "var(--border-primary)" }}>
          {links.map((link) => {
            const isResolving = isPending && resolvingId === link.id;

            return (
              <div key={link.id} className="px-5 py-4">
                {/* Parent ↔ Student */}
                <div className="flex items-start justify-between gap-3 mb-3">
                  <div>
                    <p className="text-sm font-medium" style={{ color: "var(--text-primary)" }}>
                      {link.parent?.name}
                    </p>
                    <p className="text-xs" style={{ color: "var(--text-muted)" }}>
                      {link.parent?.email}
                    </p>
                    {link.parent?.phone && (
                      <p className="text-xs" style={{ color: "var(--text-muted)" }}>
                        {link.parent.phone}
                      </p>
                    )}
                  </div>
                  <div className="text-right shrink-0">
                    <p className="text-sm font-medium" style={{ color: "var(--text-secondary)" }}>
                      {link.student?.name}
                    </p>
                    <p className="text-xs font-mono" style={{ color: "var(--text-muted)" }}>
                      {link.student?.studentCode}
                    </p>
                  </div>
                </div>

                {/* Actions */}
                <div className="flex gap-2">
                  <button
                    onClick={() => resolve(link.id, "approved")}
                    disabled={isResolving}
                    className="flex-1 flex items-center justify-center gap-1.5 py-1.5 rounded-lg text-xs font-medium transition-all disabled:opacity-50"
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
                    onClick={() => resolve(link.id, "rejected")}
                    disabled={isResolving}
                    className="flex-1 flex items-center justify-center gap-1.5 py-1.5 rounded-lg text-xs font-medium transition-all disabled:opacity-50"
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
      )}
    </div>
  );
}