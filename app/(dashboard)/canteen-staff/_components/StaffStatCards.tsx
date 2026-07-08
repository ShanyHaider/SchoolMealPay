"use client";

import { useEffect, useRef } from "react";
import {
  ClipboardList,
  ChefHat,
  CheckCircle2,
  Clock,
  PackageCheck,
} from "lucide-react";

interface Stats {
  total: number;
  pending: number;
  preparing: number;
  ready: number;
  collected: number;
}

const CARDS = [
  {
    key: "total",
    label: "Total Today",
    icon: ClipboardList,
    bg: "rgba(107,114,128,0.12)",
    color: "#9898a8",
  },
  {
    key: "pending",
    label: "Pending",
    icon: Clock,
    bg: "rgba(245,158,11,0.12)",
    color: "#f59e0b",
  },
  {
    key: "preparing",
    label: "Preparing",
    icon: ChefHat,
    bg: "rgba(59,130,246,0.12)",
    color: "#3b82f6",
  },
  {
    key: "ready",
    label: "Ready",
    icon: PackageCheck,
    bg: "rgba(139,92,246,0.12)",
    color: "#8b5cf6",
  },
  {
    key: "collected",
    label: "Collected",
    icon: CheckCircle2,
    bg: "rgba(34,197,94,0.12)",
    color: "#22c55e",
  },
] as const;

function AnimatedNumber({
  value,
  delay = 0,
}: {
  value: number;
  delay?: number;
}) {
  const ref = useRef<HTMLSpanElement>(null);

  useEffect(() => {
    const el = ref.current;
    if (!el || value === 0) {
      if (el) el.textContent = "0";
      return;
    }
    const duration = 600;
    const start = performance.now() + delay;
    const tick = (now: number) => {
      const elapsed = Math.max(0, now - start);
      const progress = Math.min(elapsed / duration, 1);
      const eased = 1 - Math.pow(1 - progress, 3);
      el.textContent = String(Math.round(eased * value));
      if (progress < 1) requestAnimationFrame(tick);
    };
    requestAnimationFrame(tick);
  }, [value, delay]);

  return <span ref={ref}>0</span>;
}

export function StaffStatCards({ stats }: { stats: Stats }) {
  return (
    <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3">
      {CARDS.map(({ key, label, icon: Icon, bg, color }, i) => (
        <div
          key={key}
          className="rounded-2xl border p-4 flex flex-col gap-3 transition-all duration-200 hover:-translate-y-0.5 hover:border-(--border-card-hover,#3a3a48) cursor-default group"
          style={{
            background: "var(--bg-card)",
            borderColor: "var(--border-card)",
            boxShadow: "var(--shadow-card)",
          }}
        >
          <div
            className="w-9 h-9 rounded-xl flex items-center justify-center shrink-0 transition-transform duration-200 group-hover:scale-110"
            style={{ background: bg }}
          >
            <Icon size={17} style={{ color }} />
          </div>
          <div>
            <p
              className="text-[26px] font-bold leading-none tracking-tight"
              style={{ color: "var(--text-primary)" }}
            >
              <AnimatedNumber value={stats[key]} delay={i * 60} />
            </p>
            <p
              className="text-[11px] mt-1.5 uppercase tracking-widest font-medium"
              style={{ color: "var(--text-muted)" }}
            >
              {label}
            </p>
          </div>
        </div>
      ))}
    </div>
  );
}
