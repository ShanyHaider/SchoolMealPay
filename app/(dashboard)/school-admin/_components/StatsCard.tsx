import Link from "next/link";
import type { LucideIcon } from "lucide-react";

const COLOR_MAP: Record<string, string> = {
  blue: "rgba(59,130,246,0.12)",
  purple: "rgba(139,92,246,0.12)",
  green: "rgba(34,197,94,0.12)",
  amber: "rgba(245,158,11,0.12)",
  red: "rgba(239,68,68,0.12)",
  emerald: "rgba(16,185,129,0.12)",
  gray: "rgba(107,114,128,0.12)",
};

const ICON_COLOR: Record<string, string> = {
  blue: "#3b82f6",
  purple: "#8b5cf6",
  green: "#22c55e",
  amber: "#f59e0b",
  red: "#ef4444",
  emerald: "#10b981",
  gray: "#6b7280",
};

interface StatCardProps {
  label: string;
  value: string | number;
  icon: LucideIcon;
  href: string;
  color?: string;
  small?: boolean;
}

export function StatCard({
  label,
  value,
  icon: Icon,
  href,
  color = "blue",
  small = false,
}: StatCardProps) {
  return (
    <Link
      href={href}
      className="flex flex-col gap-3 p-4 rounded-xl border transition-all hover:scale-[1.02] hover:shadow-md"
      style={{
        background: "var(--bg-card)",
        borderColor: "var(--border-card)",
        boxShadow: "var(--shadow-card)",
      }}
    >
      <div
        className="w-9 h-9 rounded-lg flex items-center justify-center flex-shrink-0"
        style={{ background: COLOR_MAP[color] ?? COLOR_MAP.blue }}
      >
        <Icon
          size={17}
          style={{ color: ICON_COLOR[color] ?? ICON_COLOR.blue }}
        />
      </div>
      <div>
        <p
          className={`font-bold leading-tight ${small ? "text-lg" : "text-2xl"}`}
          style={{ color: "var(--text-primary)" }}
        >
          {value}
        </p>
        <p className="text-xs mt-0.5" style={{ color: "var(--text-muted)" }}>
          {label}
        </p>
      </div>
    </Link>
  );
}
