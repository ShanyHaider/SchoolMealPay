"use client";

import Link from "next/link";
import { useMemo, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Check, Minus, ArrowRight, Zap, Loader2 } from "lucide-react";
import { useRouter } from "next/navigation";
import Footer from "../_components/Footer";
import {
  Reveal,
  StaggerGroup,
  StaggerItem,
  EyebrowLabel,
  DisplayHeading,
  RuleLabel,
} from "../../../components/Motion";

// ─── Type Definitions ─────────────────────────────────────────────
interface Feature {
  text: string;
  included: boolean;
}

interface Plan {
  key: string;
  name: string;
  badge: string | null;
  monthlyPriceCents: number;
  annualPriceCents: number;
  desc: string;
  maxStudents?: number;
  features: Feature[];
  cta: string;
  highlight: boolean;
}

type TargetGroup = "schools" | "parents";

// ─── Subscription Data ────────────────────────────────────────────
const SCHOOL_TIERS: Plan[] = [
  {
    key: "SchoolFree",
    name: "Free",
    badge: null,
    monthlyPriceCents: 0,
    annualPriceCents: 0,
    desc: "For local, single-campus school setups testing out digital administration.",
    maxStudents: 50,
    features: [
      { text: "Up to 50 active students", included: true },
      { text: "Core menu management", included: true },
      { text: "QR code standard meal pickup", included: true },
      { text: "AI nutrition forecasting", included: false },
      { text: "Advanced multi-campus analytics", included: false },
      { text: "Priority support line", included: false },
    ],
    cta: "Get Started Free",
    highlight: false,
  },
  {
    key: "SchoolPremium",
    name: "Premium",
    badge: "Most Popular",
    monthlyPriceCents: 4900,
    annualPriceCents: 49000,
    desc: "For growing campuses needing unlimited student scaling and heavy data tracking.",
    maxStudents: Infinity,
    features: [
      { text: "Unlimited active student records", included: true },
      { text: "Core menu management", included: true },
      { text: "QR code standard meal pickup", included: true },
      { text: "AI nutrition forecasting", included: true },
      { text: "Advanced multi-campus analytics", included: true },
      { text: "Priority support line", included: true },
    ],
    cta: "Start Free Trial",
    highlight: true,
  },
];

const PARENT_TIERS: Plan[] = [
  {
    key: "ParentFree",
    name: "Free",
    badge: null,
    monthlyPriceCents: 0,
    annualPriceCents: 0,
    desc: "Standard meal pre-ordering and distribution tracking for parents.",
    features: [
      { text: "Order dynamic student meals", included: true },
      { text: "Basic daily spending limits", included: true },
      { text: "Order checkout history", included: true },
      { text: "AI micro-nutrition dashboard", included: false },
      { text: "AI automated meal planning suggestions", included: false },
      { text: "Health trend report logs", included: false },
    ],
    cta: "Get Started Free",
    highlight: false,
  },
  {
    key: "ParentPro",
    name: "Parent Pro",
    badge: "Recommended",
    monthlyPriceCents: 499,
    annualPriceCents: 4990,
    desc: "Deep health analytics, AI suggestions, and complete automated dietary tracking.",
    features: [
      { text: "Order dynamic student meals", included: true },
      { text: "Basic daily spending limits", included: true },
      { text: "Order checkout history", included: true },
      { text: "AI micro-nutrition dashboard", included: true },
      { text: "AI automated meal planning suggestions", included: true },
      { text: "Health trend report logs", included: true },
    ],
    cta: "Upgrade to Pro",
    highlight: true,
  },
];

const FAQS = [
  {
    q: "Is there a free trial for School Premium?",
    a: "Yes — all schools get a 30-day free trial of School Premium with no credit card required. After the trial you can stay on Free or upgrade.",
  },
  {
    q: "What does annual billing save me?",
    a: "Choosing annual billing on School Premium gives you 2 months free (you pay for 10, get 12). Parent Pro annual billing also gives 2 months free.",
  },
  {
    q: "Can I change plans at any time?",
    a: "Yes. Upgrades take effect immediately. Downgrades take effect at the start of the next billing cycle. Your data is never deleted.",
  },
  {
    q: "Which payment methods are supported?",
    a: "Stripe (international cards), JazzCash, and EasyPaisa for local Pakistani wallets. All via a secure, PCI-compliant checkout.",
  },
  {
    q: "Is there a discount for government or NGO schools?",
    a: "Yes — contact us at support@schoolmealpay.com with your school's registration details and we'll set up a custom plan.",
  },
];

function formatPrice(cents: number, cycle: "monthly" | "annual"): string {
  if (cents === 0) return "Free";
  const monthly = cycle === "annual" ? Math.round(cents / 12) : cents;
  return `Rs. ${(monthly / 100).toLocaleString()}`;
}

// ─── Sub-Component: Plan Card ─────────────────────────────────────
function PlanCard({
  plan,
  cycle,
  onCheckout,
  isLoading,
}: {
  plan: Plan;
  cycle: "monthly" | "annual";
  onCheckout: (tierKey: string, isFree: boolean) => void;
  isLoading: boolean;
}) {
  const currentCents =
    cycle === "annual" ? plan.annualPriceCents : plan.monthlyPriceCents;
  const isPaidTier = currentCents > 0;
  const priceLabel = formatPrice(currentCents, cycle);

  const yearlySavings = plan.monthlyPriceCents * 12 - plan.annualPriceCents;

  return (
    <div
      className="relative rounded-2xl flex flex-col overflow-hidden transition-all duration-300 hover:-translate-y-1"
      style={{
        background: plan.highlight ? "var(--accent)" : "var(--bg-card)",
        border: plan.highlight ? "none" : "1px solid var(--border-card)",
        boxShadow:
          plan.highlight ?
            "0 12px 48px rgba(0,0,0,0.25)"
          : "var(--shadow-card)",
        color: plan.highlight ? "var(--accent-text)" : "var(--text-primary)",
      }}
    >
      {plan.badge && (
        <div
          className="absolute top-0 left-0 right-0 py-1.5 text-center text-xs font-semibold"
          style={{
            background:
              plan.highlight ? "rgba(255,255,255,0.15)" : "var(--accent)",
            color: "var(--accent-text)",
            letterSpacing: "0.05em",
          }}
        >
          {plan.badge}
        </div>
      )}

      <div className={`p-7 flex flex-col flex-1 ${plan.badge ? "pt-10" : ""}`}>
        {/* Name + desc */}
        <div className="mb-6">
          <p
            className="text-sm font-semibold mb-1"
            style={{
              opacity: plan.highlight ? 0.7 : undefined,
              color: plan.highlight ? undefined : "var(--text-secondary)",
            }}
          >
            {plan.name}
          </p>
          <p
            className="text-xs leading-relaxed"
            style={{
              opacity: plan.highlight ? 0.6 : undefined,
              color: plan.highlight ? undefined : "var(--text-muted)",
            }}
          >
            {plan.desc}
          </p>
        </div>

        {/* Price */}
        <div className="mb-6">
          <div className="flex items-baseline gap-1.5">
            <span
              className="text-4xl font-normal"
              style={{ fontFamily: "'Instrument Serif', serif" }}
            >
              {priceLabel === "Free" ? "Free" : priceLabel.replace("Rs. ", "")}
            </span>
            {priceLabel !== "Free" && (
              <>
                <span className="text-sm" style={{ opacity: 0.5 }}>
                  Rs.
                </span>
                <span className="text-xs" style={{ opacity: 0.5 }}>
                  /mo
                </span>
              </>
            )}
          </div>
          {cycle === "annual" && yearlySavings > 0 && (
            <p
              className="text-xs mt-1"
              style={{
                color: plan.highlight ? "rgba(255,255,255,0.6)" : "#22c55e",
              }}
            >
              Save Rs. {(yearlySavings / 100).toLocaleString()} per year
            </p>
          )}
          {cycle === "annual" && plan.annualPriceCents > 0 && (
            <p className="text-xs mt-0.5" style={{ opacity: 0.5 }}>
              Billed Rs. ${(plan.annualPriceCents / 100).toLocaleString()}{" "}
              annually
            </p>
          )}
        </div>

        {/* Features */}
        <ul className="space-y-3 flex-1 mb-7">
          {plan.features.map((f) => (
            <li key={f.text} className="flex items-start gap-3 text-sm">
              {f.included ?
                <Check
                  size={14}
                  className="shrink-0 mt-0.5"
                  style={{
                    opacity: plan.highlight ? 0.9 : undefined,
                    color: plan.highlight ? "var(--accent-text)" : "#22c55e",
                  }}
                />
              : <Minus
                  size={14}
                  className="shrink-0 mt-0.5"
                  style={{ opacity: 0.3 }}
                />
              }
              <span style={{ opacity: f.included ? 1 : 0.35 }}>{f.text}</span>
            </li>
          ))}
        </ul>

        {/* Dynamic Payment CTA Button */}
        <button
          onClick={() => onCheckout(plan.key, !isPaidTier)}
          disabled={isLoading}
          className="w-full py-3.5 rounded-xl text-sm font-semibold text-center transition-all hover:scale-[1.01] flex items-center justify-center gap-2 disabled:opacity-60 disabled:cursor-not-allowed"
          style={
            plan.highlight ?
              { background: "var(--bg-primary)", color: "var(--text-primary)" }
            : {
                background: "var(--accent)",
                color: "var(--accent-text)",
                boxShadow: "var(--shadow-btn)",
              }
          }
        >
          {isLoading ?
            <Loader2 size={16} className="animate-spin" />
          : isPaidTier ?
            cycle === "monthly" ?
              plan.cta
            : "Claim Annual Discount"
          : "Get Started Free"}
        </button>
      </div>
    </div>
  );
}

// ─── Main Component: Pricing Page ─────────────────────────────────
export default function PricingPage() {
  const router = useRouter();
  const [target, setTarget] = useState<TargetGroup>("schools");
  const [cycle, setCycle] = useState<"monthly" | "annual">("monthly");
  const [loadingTier, setLoadingTier] = useState<string | null>(null);

  const activeCards = useMemo(
    () => (target === "schools" ? SCHOOL_TIERS : PARENT_TIERS),
    [target],
  );

  const handleCheckout = async (tierKey: string, isFree: boolean) => {
    if (isFree) {
      router.push("/sign-up");
      return;
    }

    setLoadingTier(tierKey);

    try {
      const res = await fetch("/api/stripe/checkout", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ tier: tierKey, cycle }),
      });

      // Handle unauthenticated user routing redirects
      if (
        res.status === 401 ||
        !res.headers.get("content-type")?.includes("application/json")
      ) {
        const redirectTarget = `/checkout?tier=${tierKey}&cycle=${cycle}`;
        router.push(
          `/sign-up?redirect_url=${encodeURIComponent(redirectTarget)}`,
        );
        return;
      }

      const data = await res.json();
      if (!res.ok) throw new Error(data.error ?? "Checkout failed");
      if (data.url) window.location.href = data.url;
    } catch (err) {
      console.error("[PricingSection] Checkout error:", err);
      alert("Something went wrong. Please try again.");
    } finally {
      setLoadingTier(null);
    }
  };

  return (
    <div
      style={{
        background: "var(--bg-secondary)",
        color: "var(--text-primary)",
      }}
    >
      {/* ── HERO ─────────────────────────────────────────────── */}
      <section className="max-w-5xl mx-auto px-6 pt-30 lg:pt-40 pb-16 text-center">
        <Reveal>
          <EyebrowLabel>Simple pricing</EyebrowLabel>
        </Reveal>
        <Reveal delay={0.05}>
          <DisplayHeading className="text-6xl sm:text-7xl mt-8 mb-6">
            Pay for what
            <br />
            <em>your platform needs.</em>
          </DisplayHeading>
        </Reveal>
        <Reveal delay={0.12}>
          <p
            className="text-lg mb-8"
            style={{ color: "var(--text-secondary)" }}
          >
            Two tiers for schools, two for parents. No hidden fees, no
            per-transaction cuts, no lock-in.
          </p>
        </Reveal>

        {/* Target Platform Selector (Schools vs Parents) */}
        <Reveal delay={0.15}>
          <div className="mb-4 inline-flex items-center gap-1 p-1 rounded-xl bg-zinc-100 dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800">
            {(
              [
                { key: "schools", label: "Schools & Canteens" },
                { key: "parents", label: "Parents & Guardians" },
              ] as const
            ).map((item) => {
              const active = target === item.key;
              return (
                <button
                  key={item.key}
                  onClick={() => setTarget(item.key)}
                  className="relative px-5 py-2 rounded-lg text-sm font-medium transition-all"
                  style={{
                    background:
                      active ? "var(--bg-pill-active)" : "transparent",
                    color:
                      active ? "var(--text-primary)" : "var(--text-secondary)",
                    boxShadow: active ? "var(--shadow-pill)" : undefined,
                  }}
                >
                  <span className="relative z-10">{item.label}</span>
                </button>
              );
            })}
          </div>
        </Reveal>

        {/* Cadence Billing Toggle */}
        <Reveal delay={0.18}>
          <div
            className="inline-flex items-center gap-1 p-1 rounded-xl"
            style={{ background: "var(--bg-pill)" }}
          >
            {(["monthly", "annual"] as const).map((c) => (
              <button
                key={c}
                onClick={() => setCycle(c)}
                className="px-5 py-2 rounded-lg text-sm font-medium capitalize transition-all flex items-center gap-2"
                style={{
                  background:
                    cycle === c ? "var(--bg-pill-active)" : "transparent",
                  color:
                    cycle === c ?
                      "var(--text-primary)"
                    : "var(--text-secondary)",
                  boxShadow: cycle === c ? "var(--shadow-pill)" : undefined,
                }}
              >
                {c}
                {c === "annual" && (
                  <span
                    className="px-1.5 py-0.5 rounded-full text-xs font-semibold"
                    style={{
                      background: "rgba(34,197,94,0.15)",
                      color: "#22c55e",
                    }}
                  >
                    2 months free
                  </span>
                )}
              </button>
            ))}
          </div>
        </Reveal>
      </section>

      {/* ── PLANS DISPLAY GRID ─────────────────────────────────── */}
      <section className="max-w-4xl mx-auto px-6 pb-24">
        <Reveal>
          <p
            className="text-xs font-semibold uppercase tracking-[0.15em] mb-5 flex items-center gap-2"
            style={{ color: "var(--text-muted)" }}
          >
            <span
              className="w-4 h-px inline-block"
              style={{ background: "var(--text-muted)" }}
            />
            {target === "schools" ? "School Plans" : "Parent Plans"}
          </p>
        </Reveal>

        <AnimatePresence mode="wait">
          <motion.div
            key={target}
            initial={{ opacity: 0, y: 15 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -15 }}
            transition={{ duration: 0.25, ease: "easeInOut" }}
          >
            <StaggerGroup className="grid grid-cols-1 sm:grid-cols-2 gap-5">
              {activeCards.map((plan) => (
                <StaggerItem key={plan.key}>
                  <PlanCard
                    plan={plan}
                    cycle={cycle}
                    onCheckout={handleCheckout}
                    isLoading={loadingTier === plan.key}
                  />
                </StaggerItem>
              ))}
            </StaggerGroup>
          </motion.div>
        </AnimatePresence>
      </section>

      {/* ── FAQ ──────────────────────────────────────────────── */}
      <div className="max-w-4xl mx-auto px-6 pb-6">
        <RuleLabel>Common questions</RuleLabel>
      </div>

      <section className="max-w-2xl mx-auto px-6 py-16">
        <StaggerGroup className="space-y-4">
          {FAQS.map(({ q, a }) => (
            <StaggerItem key={q}>
              <div
                className="rounded-2xl p-6"
                style={{
                  background: "var(--bg-card)",
                  border: "1px solid var(--border-card)",
                }}
              >
                <p
                  className="text-sm font-semibold mb-2"
                  style={{ color: "var(--text-primary)" }}
                >
                  {q}
                </p>
                <p
                  className="text-sm leading-relaxed"
                  style={{ color: "var(--text-secondary)" }}
                >
                  {a}
                </p>
              </div>
            </StaggerItem>
          ))}
        </StaggerGroup>
      </section>

      {/* ── CTA ──────────────────────────────────────────────── */}
      <section className="max-w-4xl mx-auto px-6 pb-28">
        <Reveal>
          <div
            className="rounded-3xl p-12 text-center"
            style={{
              background: "var(--bg-tertiary)",
              border: "1px solid var(--border-card)",
            }}
          >
            <Zap
              size={28}
              className="mx-auto mb-4"
              style={{ color: "var(--text-muted)" }}
            />
            <DisplayHeading className="text-4xl mb-3">
              Not sure which plan?
            </DisplayHeading>
            <p
              className="text-sm mb-6"
              style={{ color: "var(--text-secondary)" }}
            >
              Book a free demo and we'll recommend the right tier for your
              school's size and needs.
            </p>
            <Link
              href="/demo"
              className="inline-flex items-center gap-2 px-8 py-3.5 rounded-xl text-sm font-semibold transition-all hover:scale-[1.02]"
              style={{
                background: "var(--accent)",
                color: "var(--accent-text)",
                boxShadow: "var(--shadow-btn)",
              }}
            >
              Book a free demo <ArrowRight size={14} />
            </Link>
          </div>
        </Reveal>
      </section>

      <Footer />
    </div>
  );
}
