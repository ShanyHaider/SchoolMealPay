"use client";

import Link from "next/link";
import { ArrowRight, Zap } from "lucide-react";
import Footer from "../_components/Footer";
import {
  Reveal,
  StaggerGroup,
  StaggerItem,
  EyebrowLabel,
  DisplayHeading,
  RuleLabel,
} from "../../../components/Motion";
import { PricingCards } from "@/features/billing/PricingCards";

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

export default function PricingPage() {
  return (
    <div style={{ background: "var(--bg-secondary)", color: "var(--text-primary)" }}>

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
          <p className="text-lg mb-8" style={{ color: "var(--text-secondary)" }}>
            Two tiers for schools, two for parents. No hidden fees, no
            per-transaction cuts, no lock-in.
          </p>
        </Reveal>
      </section>

      {/* ── PLANS ────────────────────────────────────────────── */}
      <section className="max-w-4xl mx-auto px-6 pb-24">
        <Reveal>
          <PricingCards />
        </Reveal>
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
                style={{ background: "var(--bg-card)", border: "1px solid var(--border-card)" }}
              >
                <p className="text-sm font-semibold mb-2" style={{ color: "var(--text-primary)" }}>
                  {q}
                </p>
                <p className="text-sm leading-relaxed" style={{ color: "var(--text-secondary)" }}>
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
            style={{ background: "var(--bg-tertiary)", border: "1px solid var(--border-card)" }}
          >
            <Zap size={28} className="mx-auto mb-4" style={{ color: "var(--text-muted)" }} />
            <DisplayHeading className="text-4xl mb-3">
              Not sure which plan?
            </DisplayHeading>
            <p className="text-sm mb-6" style={{ color: "var(--text-secondary)" }}>
              Book a free demo and we'll recommend the right tier for your
              school's size and needs.
            </p>
            <Link
              href="/demo"
              className="inline-flex items-center gap-2 px-8 py-3.5 rounded-xl text-sm font-semibold transition-all hover:scale-[1.02]"
              style={{ background: "var(--accent)", color: "var(--accent-text)", boxShadow: "var(--shadow-btn)" }}
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