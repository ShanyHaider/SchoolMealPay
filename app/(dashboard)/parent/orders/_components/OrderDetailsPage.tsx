"use client";

import Link from "next/link";
import { useSearchParams } from "next/navigation";
import {
  List,
  Clock,
  Flame,
  CheckCircle2,
  PackageCheck,
  XCircle,
} from "lucide-react";

// Mapping keys to Lucide Components
const TAB_ICONS: Record<string, any> = {
  all: List,
  pending: Clock,
  preparing: Flame,
  ready: CheckCircle2,
  delivered: PackageCheck,
  cancelled: XCircle,
};

interface TabProps {
  tabs: {
    key: string;
    label: string;
    count: number;
  }[];
}

export function OrderDetailsPage({ tabs }: TabProps) {
  const searchParams = useSearchParams();
  const activeFilter = searchParams.get("status") ?? "all";

  return (
    <div className="flex gap-1 p-1 bg-(--bg-tertiary) rounded-xl w-fit flex-wrap mb-6">
      {tabs.map((tab) => {
        const isActive = activeFilter === tab.key;
        const Icon = TAB_ICONS[tab.key] || List;

        return (
          <Link
            key={tab.key}
            href={`/parent/orders${tab.key === "all" ? "" : `?status=${tab.key}`}`}
            className={`flex items-center gap-2 px-3 py-1.5 rounded-lg text-sm font-medium transition-colors ${isActive ?
                "bg-(--bg-card) text-(--text-primary) shadow-(--shadow-pill)"
                : "text-(--text-secondary) hover:text-(--text-primary)"
              }`}
          >
            <Icon size={16} strokeWidth={isActive ? 2.5 : 2} />
            {tab.label}
            {tab.count > 0 && (
              <span className="text-xs bg-(--bg-pill) text-(--text-muted) px-1.5 py-0.5 rounded-full font-semibold">
                {tab.count}
              </span>
            )}
          </Link>
        );
      })}
    </div>
  );
}
