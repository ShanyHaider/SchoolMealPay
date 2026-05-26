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
    color: "#6b7280",
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

export function StaffStatCards({ stats }: { stats: Stats }) {
  return (
    <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-4">
      {CARDS.map(({ key, label, icon: Icon, bg, color }) => (
        <div
          key={key}
          className="rounded-xl border p-4 flex flex-col gap-3"
          style={{
            background: "var(--bg-card)",
            borderColor: "var(--border-card)",
            boxShadow: "var(--shadow-card)",
          }}
        >
          <div
            className="w-9 h-9 rounded-lg flex items-center justify-center flex-shrink-0"
            style={{ background: bg }}
          >
            <Icon size={17} style={{ color }} />
          </div>
          <div>
            <p
              className="text-2xl font-bold"
              style={{ color: "var(--text-primary)" }}
            >
              {stats[key]}
            </p>
            <p
              className="text-xs mt-0.5"
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
