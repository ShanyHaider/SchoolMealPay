"use client";

import { Ban, ExternalLink } from "lucide-react";
import Link from "next/link";
import { Section } from "./ui";
import { BlockedItem } from "@/types/childProfileTypes";

export function BlockedItemsList({
  blockedItems,
  studentId,
}: {
  blockedItems: BlockedItem[];
  studentId: string;
}) {
  if (blockedItems.length === 0) return null;

  return (
    <Section
      icon={<Ban size={15} />}
      title="Blocked items"
      subtitle="Items this child is not allowed to order."
      badge={blockedItems.length}
    >
      <div className="flex flex-col gap-2">
        {blockedItems.map((item) => (
          <div
            key={item.id}
            className="flex items-center justify-between px-3.5 py-2.5 rounded-xl bg-(--bg-secondary) border border-(--border-card)"
          >
            <div className="flex items-center gap-2.5 min-w-0">
              <span className="w-6 h-6 rounded-lg flex items-center justify-center shrink-0 bg-red-500/10">
                <Ban size={12} className="text-red-500" />
              </span>
              <span className="text-sm font-medium text-(--text-primary) truncate">
                {item.menuItem?.name ?? "Unknown item"}
              </span>
            </div>
            <Link
              href={`/parent/spending?unblock=${item.menuItemId}&student=${studentId}`}
              className="flex items-center gap-1 text-xs text-blue-500 hover:text-blue-400 font-semibold transition-colors shrink-0 ml-3"
            >
              Unblock
              <ExternalLink size={10} />
            </Link>
          </div>
        ))}
      </div>
    </Section>
  );
}
