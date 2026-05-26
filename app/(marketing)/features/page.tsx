import Link from "next/link";
import Footer from "@/app/(marketing)/_components/Footer";
import {
  Reveal,
  StaggerGroup,
  StaggerItem,
  EyebrowLabel,
  DisplayHeading,
  RuleLabel,
} from "@/components/Motion";
import {
  QrCode,
  ShieldCheck,
  BarChart3,
  Bell,
  Leaf,
  Users,
  CalendarDays,
  Package,
  CreditCard,
  Lock,
  Smartphone,
  Zap,
  ArrowRight,
} from "lucide-react";

const HERO_FEATURES = [
  {
    icon: QrCode,
    label: "QR Pickup",
    color: "#8b5cf6",
    bg: "rgba(139,92,246,0.12)",
  },
  {
    icon: ShieldCheck,
    label: "Allergen Alerts",
    color: "#ef4444",
    bg: "rgba(239,68,68,0.12)",
  },
  {
    icon: Leaf,
    label: "Nutrition Tracking",
    color: "#22c55e",
    bg: "rgba(34,197,94,0.12)",
  },
  {
    icon: BarChart3,
    label: "Analytics",
    color: "#3b82f6",
    bg: "rgba(59,130,246,0.12)",
  },
];

const FEATURE_ROWS = [
  {
    eyebrow: "Real-time operations",
    title: "The orders board that keeps service moving.",
    body: "Canteen staff see every order in a live kanban — Pending, Preparing, Ready, Collected. One tap advances the status. Allergen warnings surface before the food leaves the counter. The board auto-refreshes every 20 seconds, no manual reload needed.",
    icon: CalendarDays,
    color: "#f59e0b",
    bg: "rgba(245,158,11,0.08)",
    points: [
      "Kanban view across 4 status columns",
      "Allergen badges on every order card",
      "Auto-refresh every 20 seconds",
      "One-tap status transitions",
    ],
  },
  {
    eyebrow: "Contactless & fast",
    title: "QR pickup that works in under 2 seconds.",
    body: "Each order generates a unique QR code sent to the parent. Staff scan it at the counter — the system verifies the order, checks if it's already been collected, and marks it collected instantly. Duplicate scans are blocked.",
    icon: QrCode,
    color: "#8b5cf6",
    bg: "rgba(139,92,246,0.08)",
    points: [
      "Camera scan or manual entry",
      "Bluetooth barcode scanner supported",
      "Duplicate collection prevention",
      "Allergen alert on success screen",
    ],
  },
  {
    eyebrow: "Parent intelligence",
    title: "Full control. Complete visibility.",
    body: "Parents pre-order meals, set per-child daily and weekly spending limits, block specific items, and approve large requests. Every order's nutrition data is tracked over time — not medical advice, just honest data.",
    icon: Users,
    color: "#3b82f6",
    bg: "rgba(59,130,246,0.08)",
    points: [
      "Daily & weekly spending limits",
      "Per-item dietary restrictions",
      "Approval threshold for big orders",
      "AI nutrition trends (Pro)",
    ],
  },
  {
    eyebrow: "School administration",
    title: "Every metric. One screen.",
    body: "Admins manage students, classes, canteens, staff assignments, and the weekly menu schedule from a single dashboard. Sales reports, top-selling items, and monthly revenue are always one click away.",
    icon: BarChart3,
    color: "#22c55e",
    bg: "rgba(34,197,94,0.08)",
    points: [
      "Weekly menu calendar scheduler",
      "Student & class management",
      "Staff assignment per canteen",
      "Revenue & sales analytics",
    ],
  },
];

const MORE_FEATURES = [
  {
    icon: Package,
    title: "Inventory tracking",
    desc: "Low-stock alerts fire automatically when items fall below the reorder threshold.",
    color: "#06b6d4",
  },
  {
    icon: Bell,
    title: "Real-time notifications",
    desc: "Order status, spending alerts, and parent link approvals pushed instantly.",
    color: "#f97316",
  },
  {
    icon: CreditCard,
    title: "Local payments",
    desc: "Stripe, JazzCash, and EasyPaisa. Pre-order billing with automatic receipt generation.",
    color: "#84cc16",
  },
  {
    icon: Lock,
    title: "Role-based access",
    desc: "Four roles with cleanly scoped permissions. Nothing leaks between parent, staff, and admin.",
    color: "#ec4899",
  },
  {
    icon: Smartphone,
    title: "Mobile-first",
    desc: "Every dashboard — including the QR scanner — is designed for phone and tablet first.",
    color: "#14b8a6",
  },
  {
    icon: Zap,
    title: "Recurring orders",
    desc: "Parents set up weekly recurring orders. One-tap cancel any time, no lock-in.",
    color: "#a855f7",
  },
];

export default function FeaturesPage() {
  return (
    <div
      style={{
        background: "var(--bg-secondary)",
        color: "var(--text-primary)",
      }}
    >
      {/* ── HERO ─────────────────────────────────────────────── */}
      <section className="max-w-6xl mx-auto px-6 pt-30 lg:pt-40 pb-20">
        <Reveal>
          <EyebrowLabel>Everything included</EyebrowLabel>
        </Reveal>

        <div className="mt-8 grid grid-cols-1 lg:grid-cols-[1fr_1fr] gap-12 items-start">
          <Reveal delay={0.05}>
            <DisplayHeading className="text-6xl sm:text-7xl">
              Every feature
              <br />
              your canteen
              <br />
              <em>actually</em> needs.
            </DisplayHeading>
          </Reveal>

          <Reveal delay={0.15}>
            <div className="lg:pt-4 space-y-6">
              <p
                className="text-lg leading-relaxed"
                style={{ color: "var(--text-secondary)" }}
              >
                No feature bloat. No enterprise complexity. Just the tools that
                make ordering, serving, and managing school meals fast, safe,
                and transparent — for every role.
              </p>
              <StaggerGroup className="grid grid-cols-2 gap-3">
                {HERO_FEATURES.map(({ icon: Icon, label, color, bg }) => (
                  <StaggerItem key={label}>
                    <div
                      className="flex items-center gap-3 px-4 py-3 rounded-xl"
                      style={{ background: bg, border: `1px solid ${color}25` }}
                    >
                      <Icon size={16} style={{ color, flexShrink: 0 }} />
                      <span
                        className="text-sm font-medium"
                        style={{ color: "var(--text-primary)" }}
                      >
                        {label}
                      </span>
                    </div>
                  </StaggerItem>
                ))}
              </StaggerGroup>
            </div>
          </Reveal>
        </div>
      </section>

      {/* ── FEATURE ROWS ─────────────────────────────────────── */}
      <div className="max-w-6xl mx-auto px-6 pb-24 space-y-6">
        {FEATURE_ROWS.map(
          ({ eyebrow, title, body, icon: Icon, color, bg, points }, i) => (
            <Reveal key={eyebrow} delay={0.05}>
              <div
                className="rounded-3xl p-8 lg:p-12 grid grid-cols-1 lg:grid-cols-2 gap-10 items-center"
                style={{
                  background: "var(--bg-card)",
                  border: "1px solid var(--border-card)",
                  boxShadow: "var(--shadow-card)",
                }}
              >
                <div className={i % 2 === 1 ? "lg:order-2" : ""}>
                  <div className="flex items-center gap-3 mb-5">
                    <div
                      className="w-10 h-10 rounded-xl flex items-center justify-center"
                      style={{ background: bg }}
                    >
                      <Icon size={18} style={{ color }} />
                    </div>
                    <span
                      className="text-xs font-semibold uppercase tracking-[0.12em]"
                      style={{ color: "var(--text-muted)" }}
                    >
                      {eyebrow}
                    </span>
                  </div>
                  <h2
                    className="text-3xl lg:text-4xl font-normal leading-[1.15] mb-5"
                    style={{
                      fontFamily: "'Instrument Serif', serif",
                      color: "var(--text-primary)",
                    }}
                  >
                    {title}
                  </h2>
                  <p
                    className="text-base leading-relaxed mb-6"
                    style={{ color: "var(--text-secondary)" }}
                  >
                    {body}
                  </p>
                </div>

                <div
                  className={`${i % 2 === 1 ? "lg:order-1" : ""} rounded-2xl p-6`}
                  style={{
                    background: "var(--bg-secondary)",
                    border: "1px solid var(--border-card)",
                  }}
                >
                  <ul className="space-y-3">
                    {points.map((pt) => (
                      <li key={pt} className="flex items-start gap-3">
                        <span
                          className="w-5 h-5 rounded-full flex items-center justify-center text-xs shrink-0 mt-0.5 font-bold"
                          style={{ background: bg, color }}
                        >
                          ✓
                        </span>
                        <span
                          className="text-sm leading-snug"
                          style={{ color: "var(--text-secondary)" }}
                        >
                          {pt}
                        </span>
                      </li>
                    ))}
                  </ul>

                  {/* Visual accent */}
                  <div
                    className="mt-6 pt-6"
                    style={{ borderTop: "1px solid var(--border-primary)" }}
                  >
                    <div className="flex items-center gap-2">
                      <div
                        className="w-2 h-2 rounded-full animate-pulse"
                        style={{ background: color }}
                      />
                      <span
                        className="text-xs"
                        style={{ color: "var(--text-muted)" }}
                      >
                        Live in your dashboard
                      </span>
                    </div>
                  </div>
                </div>
              </div>
            </Reveal>
          ),
        )}
      </div>

      {/* ── MORE FEATURES ─────────────────────────────────────── */}
      <div className="max-w-6xl mx-auto px-6">
        <RuleLabel>Also included</RuleLabel>
      </div>

      <section className="max-w-6xl mx-auto px-6 py-16">
        <StaggerGroup className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
          {MORE_FEATURES.map(({ icon: Icon, title, desc, color }) => (
            <StaggerItem key={title}>
              <div
                className="rounded-2xl p-6 h-full transition-all duration-300 hover:-translate-y-1"
                style={{
                  background: "var(--bg-card)",
                  border: "1px solid var(--border-card)",
                  boxShadow: "var(--shadow-card)",
                }}
              >
                <Icon size={22} className="mb-4" style={{ color }} />
                <h3
                  className="text-base font-semibold mb-2"
                  style={{ color: "var(--text-primary)" }}
                >
                  {title}
                </h3>
                <p
                  className="text-sm leading-relaxed"
                  style={{ color: "var(--text-secondary)" }}
                >
                  {desc}
                </p>
              </div>
            </StaggerItem>
          ))}
        </StaggerGroup>
      </section>

      {/* ── CTA ──────────────────────────────────────────────── */}
      <section className="max-w-6xl mx-auto px-6 pb-28">
        <Reveal>
          <div
            className="rounded-3xl p-12 lg:p-16 flex flex-col lg:flex-row items-center justify-between gap-8 relative overflow-hidden"
            style={{
              background: "var(--bg-tertiary)",
              border: "1px solid var(--border-card)",
            }}
          >
            <div
              className="absolute inset-0 pointer-events-none opacity-[0.04]"
              style={{
                backgroundImage:
                  "radial-gradient(circle at 80% 50%, var(--text-primary) 0%, transparent 60%)",
              }}
            />
            <div className="relative">
              <DisplayHeading className="text-4xl lg:text-5xl mb-3">
                See every feature live.
              </DisplayHeading>
              <p style={{ color: "var(--text-secondary)" }}>
                20-minute demo, no commitment, no sales pressure.
              </p>
            </div>
            <div className="relative shrink-0 flex gap-3">
              <Link
                href="/demo"
                className="inline-flex items-center gap-2 px-8 py-3.5 rounded-xl text-sm font-semibold transition-all hover:scale-[1.02]"
                style={{
                  background: "var(--accent)",
                  color: "var(--accent-text)",
                  boxShadow: "var(--shadow-btn)",
                }}
              >
                Book demo <ArrowRight size={14} />
              </Link>
              <Link
                href="/pricing"
                className="px-8 py-3.5 rounded-xl text-sm font-medium"
                style={{
                  border: "1px solid var(--border-input)",
                  color: "var(--text-secondary)",
                }}
              >
                Pricing
              </Link>
            </div>
          </div>
        </Reveal>
      </section>

      <Footer />
    </div>
  );
}
