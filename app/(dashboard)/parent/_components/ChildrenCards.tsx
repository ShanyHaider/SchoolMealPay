// app/(dashboard)/parent/_components/ChildrenCards.tsx
"use client";

import Link from "next/link";
import { User } from "lucide-react";
import { Canteen, ChildLink } from "@/types/parentDashboardTypes";
import { useQuickOrder } from "@/hooks/useQuickOrders";
import { ChildCard } from "./childCard/ChildCard";

interface ChildrenCardsProps {
  children: ChildLink[];
  canteens: Canteen[];
  parentId: string;
}

export function ChildrenCards({
  children,
  canteens,
  parentId,
}: ChildrenCardsProps) {
  const order = useQuickOrder({ canteens, parentId });

  if (children.length === 0) {
    return (
      <div
        className="flex flex-col items-center gap-4 py-16 rounded-2xl border"
        style={{
          background: "var(--bg-card)",
          borderColor: "var(--border-card)",
          boxShadow: "var(--shadow-card)",
        }}
      >
        <div className="w-14 h-14 rounded-2xl bg-zinc-100 dark:bg-zinc-800 flex items-center justify-center">
          <User size={22} className="text-zinc-400" />
        </div>
        <div className="text-center">
          <p className="font-bold" style={{ color: "var(--text-primary)" }}>
            No children linked
          </p>
          <p className="text-sm mt-1" style={{ color: "var(--text-muted)" }}>
            Link your child&apos;s profile to start ordering meals.
          </p>
        </div>
        <Link
          href="/parent/children/link"
          className="px-4 py-2 rounded-xl text-sm font-bold hover:opacity-80 transition-opacity"
          style={{ background: "var(--accent)", color: "var(--accent-text)" }}
        >
          Link a child
        </Link>
      </div>
    );
  }

  return (
    <>
      <div className="flex flex-col gap-4">
        {children.map((link) => (
          <ChildCard
            key={link.id}
            link={link}
            onQuickOrder={() => order.open(link.student)}
          />
        ))}
      </div>
    </>
  );
}