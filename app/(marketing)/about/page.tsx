import Link from "next/link";
import Footer from "@/app/(marketing)/_components/Footer";
import {
  Reveal,
  StaggerGroup,
  StaggerItem,
  SlideIn,
  EyebrowLabel,
  DisplayHeading,
  RuleLabel,
} from "@/components/Motion";

const PILLARS = [
  {
    number: "01",
    title: "Built for Pakistan",
    body: "We understand local payment rails, Urdu-speaking parents, and the particular chaos of a school canteen at 12:45pm. JazzCash, EasyPaisa, cash — all supported.",
  },
  {
    number: "02",
    title: "Safety first",
    body: "A student with a nut allergy ordering the wrong meal is a genuine emergency. Every order card flags allergens before the food leaves the counter.",
  },
  {
    number: "03",
    title: "Honest nutrition",
    body: "We track what children eat and surface real patterns — not medical predictions, just honest data that helps parents make informed choices.",
  },
  {
    number: "04",
    title: "Zero bloat",
    body: "Four roles. One purpose. We didn't build a features list — we built a system that actually works on the ground, in real schools, every single day.",
  },
];

const METRICS = [
  { value: "< 2s", label: "QR scan to confirmed pickup" },
  { value: "4", label: "User roles, cleanly separated" },
  { value: "28", label: "Schema tables, nothing wasted" },
  { value: "100%", label: "Mobile-responsive from day one" },
];

export default function AboutPage() {
  return (
    <div
      style={{
        background: "var(--bg-secondary)",
        color: "var(--text-primary)",
      }}
    >
      {/* ── HERO ─────────────────────────────────────────────── */}
      <section className="max-w-6xl mx-auto px-6 pt-30 lg:pt-40 pb-24">
        <Reveal>
          <EyebrowLabel>About SchoolMealPay</EyebrowLabel>
        </Reveal>

        <div className="mt-8 grid grid-cols-1 lg:grid-cols-[1fr_360px] gap-12 items-end">
          <Reveal delay={0.05}>
            <DisplayHeading className="text-6xl sm:text-7xl lg:text-8xl">
              The meal you
              <br />
              <em>know</em> they ate.
            </DisplayHeading>
          </Reveal>

          <Reveal delay={0.15}>
            <p
              className="text-base lg:text-lg leading-relaxed"
              style={{ color: "var(--text-secondary)" }}
            >
              SchoolMealPay started as a final-year project and became something
              schools actually needed — a complete canteen management system
              built around a single, radical idea: parents deserve to know what
              their child ate for lunch.
            </p>
          </Reveal>
        </div>
      </section>

      {/* ── DIVIDER ──────────────────────────────────────────── */}
      <div className="max-w-6xl mx-auto px-6">
        <RuleLabel />
      </div>

      {/* ── METRICS ──────────────────────────────────────────── */}
      <section className="max-w-6xl mx-auto px-6 py-20">
        <StaggerGroup
          className="grid grid-cols-2 lg:grid-cols-4 gap-px"
          style={{
            border: "1px solid var(--border-card)",
            borderRadius: 16,
            overflow: "hidden",
            background: "var(--border-card)",
          }}
        >
          {METRICS.map(({ value, label }) => (
            <StaggerItem key={label}>
              <div
                className="p-8 flex flex-col gap-3"
                style={{ background: "var(--bg-card)" }}
              >
                <span
                  className="text-4xl sm:text-5xl font-normal leading-none"
                  style={{
                    fontFamily: "'Instrument Serif', serif",
                    color: "var(--text-primary)",
                  }}
                >
                  {value}
                </span>
                <span
                  className="text-xs leading-snug"
                  style={{ color: "var(--text-muted)" }}
                >
                  {label}
                </span>
              </div>
            </StaggerItem>
          ))}
        </StaggerGroup>
      </section>

      {/* ── STORY ────────────────────────────────────────────── */}
      <section className="max-w-6xl mx-auto px-6 pb-24">
        <div className="grid grid-cols-1 lg:grid-cols-[200px_1fr] gap-12">
          <SlideIn from="left">
            <div className="lg:pt-2">
              <EyebrowLabel>The story</EyebrowLabel>
            </div>
          </SlideIn>

          <div className="space-y-6">
            {[
              "Every school day, thousands of Pakistani parents have no idea what their child ate for lunch. Canteen queues are long, cash gets lost, and staff have no way to flag that a student with a dairy allergy just ordered something dangerous.",
              "SchoolMealPay replaces the cash tin, the paper register, and the guesswork. Parents pre-order from a scheduled menu and set per-child spending limits. Staff scan a QR code to confirm pickup in under two seconds — with allergens surfaced right on the card, before the food leaves the counter.",
              "Admins see everything from a single screen: inventory levels, today's orders by status, monthly revenue, nutrition trends across the school. No spreadsheets. No phone calls. No surprises.",
              "It's not a billing app. It's not just a QR scanner. It's the connective tissue between everyone who cares about what a child eats at school.",
            ].map((para, i) => (
              <Reveal key={i} delay={i * 0.07}>
                <p
                  className="text-base lg:text-lg leading-relaxed"
                  style={{
                    color:
                      i === 3 ? "var(--text-primary)" : "var(--text-secondary)",
                    fontStyle: i === 3 ? "italic" : undefined,
                  }}
                >
                  {para}
                </p>
              </Reveal>
            ))}
          </div>
        </div>
      </section>

      {/* ── DIVIDER ──────────────────────────────────────────── */}
      <div className="max-w-6xl mx-auto px-6">
        <RuleLabel>What we believe</RuleLabel>
      </div>

      {/* ── PILLARS ──────────────────────────────────────────── */}
      <section className="max-w-6xl mx-auto px-6 py-20">
        <StaggerGroup className="grid grid-cols-1 sm:grid-cols-2 gap-6">
          {PILLARS.map(({ number, title, body }) => (
            <StaggerItem key={number}>
              <div
                className="rounded-2xl p-8 h-full flex flex-col gap-6 group transition-all duration-300 hover:-translate-y-1"
                style={{
                  background: "var(--bg-card)",
                  border: "1px solid var(--border-card)",
                  boxShadow: "var(--shadow-card)",
                }}
              >
                <span
                  className="text-xs font-semibold tabular-nums"
                  style={{ color: "var(--text-muted)", letterSpacing: "0.1em" }}
                >
                  {number}
                </span>
                <div>
                  <h3
                    className="text-2xl font-normal mb-3"
                    style={{
                      fontFamily: "'Instrument Serif', serif",
                      color: "var(--text-primary)",
                    }}
                  >
                    {title}
                  </h3>
                  <p
                    className="text-sm leading-relaxed"
                    style={{ color: "var(--text-secondary)" }}
                  >
                    {body}
                  </p>
                </div>
              </div>
            </StaggerItem>
          ))}
        </StaggerGroup>
      </section>

      {/* ── CTA ──────────────────────────────────────────────── */}
      <section className="max-w-6xl mx-auto px-6 pb-28">
        <Reveal>
          <div
            className="rounded-3xl p-12 lg:p-16 relative overflow-hidden"
            style={{
              background: "var(--bg-tertiary)",
              border: "1px solid var(--border-card)",
            }}
          >
            {/* Background texture */}
            <div
              className="absolute inset-0 opacity-[0.03] pointer-events-none"
              style={{
                backgroundImage:
                  "repeating-linear-gradient(45deg, var(--text-primary) 0, var(--text-primary) 1px, transparent 0, transparent 50%)",
                backgroundSize: "12px 12px",
              }}
            />

            <div className="relative grid grid-cols-1 lg:grid-cols-[1fr_auto] gap-8 items-center">
              <div>
                <DisplayHeading className="text-4xl lg:text-5xl mb-4">
                  Ready to see it live?
                </DisplayHeading>
                <p
                  className="text-base"
                  style={{ color: "var(--text-secondary)" }}
                >
                  A 20-minute demo covers the full flow — parent ordering, QR
                  pickup, admin analytics.
                </p>
              </div>
              <div className="flex flex-col gap-3">
                <Link
                  href="/demo"
                  className="px-8 py-3.5 rounded-xl text-sm font-semibold text-center transition-all hover:scale-[1.02] whitespace-nowrap"
                  style={{
                    background: "var(--accent)",
                    color: "var(--accent-text)",
                    boxShadow: "var(--shadow-btn)",
                  }}
                >
                  Book a demo
                </Link>
                <Link
                  href="/contact"
                  className="px-8 py-3.5 rounded-xl text-sm font-medium text-center whitespace-nowrap"
                  style={{
                    border: "1px solid var(--border-input)",
                    color: "var(--text-secondary)",
                  }}
                >
                  Get in touch
                </Link>
              </div>
            </div>
          </div>
        </Reveal>
      </section>

      <Footer />
    </div>
  );
}
