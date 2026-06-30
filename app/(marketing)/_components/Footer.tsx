"use client";

import Link from "next/link";
import { useState, useEffect } from "react";
import { ArrowRight } from "lucide-react";
import { submitNewsletterForm } from "@/db/actions/email";

const LINKS = {
  Product: [
    { label: "Features", href: "/features" },
    { label: "Pricing", href: "/pricing" },
    { label: "Book a Demo", href: "/demo" },
  ],
  Company: [
    { label: "About", href: "/about" },
    { label: "Contact", href: "/contact" },
    { label: "Privacy Policy", href: "/privacy" },
  ],
  Dashboards: [
    { label: "Parent Dashboard", href: "/parent" },
    { label: "School Admin", href: "/admin" },
    { label: "Canteen Staff", href: "/canteen" },
  ],
};

export default function Footer() {
  const [email, setEmail] = useState("");
  const [subscribed, setSubscribed] = useState(false);
  const [loading, setLoading] = useState(false);
  const [currentYear, setCurrentYear] = useState<number | string>("");

  useEffect(() => {
    setCurrentYear(new Date().getFullYear());
  }, []);

  const handleSubscribe = async () => {
    if (!email || loading) return;
    setLoading(true);
    try {
      await submitNewsletterForm(email);
      setSubscribed(true);
    } finally {
      setLoading(false);
    }
  };

  return (
    <footer style={{ background: "var(--bg-primary)", borderTop: "1px solid var(--border-primary)" }}>
      {/* Top section — large CTA */}
      <div className="max-w-6xl mx-auto px-6 py-16 lg:py-20" style={{ borderBottom: "1px solid var(--divider)" }}>
        <div className="grid grid-cols-1 lg:grid-cols-[1fr_auto] gap-10 items-end">
          <div>
            <p className="text-xs font-semibold uppercase tracking-[0.15em] mb-4" style={{ color: "var(--text-muted)" }}>
              Get started today
            </p>
            <h2 className="text-4xl lg:text-5xl font-normal leading-[1.1] tracking-[-0.03em] mb-0"
              style={{ fontFamily: "'Instrument Serif', serif", color: "var(--text-primary)" }}>
              The canteen system<br />
              <span style={{ color: "var(--text-muted)" }}>your school deserves.</span>
            </h2>
          </div>
          <div className="flex flex-col sm:flex-row gap-3 lg:flex-col xl:flex-row">
            <Link href="/sign-up"
              className="inline-flex items-center justify-center gap-2 px-6 py-3 rounded-xl text-sm font-semibold transition-all hover:scale-[1.02]"
              style={{ background: "var(--accent)", color: "var(--accent-text)", boxShadow: "var(--shadow-btn)", whiteSpace: "nowrap" }}>
              Start for free <ArrowRight size={14} />
            </Link>
            <Link href="/demo"
              className="inline-flex items-center justify-center px-6 py-3 rounded-xl text-sm font-medium"
              style={{ border: "1px solid var(--border-input)", color: "var(--text-secondary)", whiteSpace: "nowrap" }}>
              Book a demo
            </Link>
          </div>
        </div>
      </div>

      {/* Middle — links + newsletter */}
      <div className="max-w-6xl mx-auto px-6 py-14">
        <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-[2fr_1fr_1fr_1fr] gap-10">
          {/* Brand + newsletter */}
          <div className="col-span-2 sm:col-span-4 lg:col-span-1">
            <Link href="/" className="inline-block text-xl font-normal mb-4"
              style={{ fontFamily: "'Instrument Serif', serif", color: "var(--text-primary)" }}>
              SchoolMealPay
            </Link>
            <p className="text-sm leading-relaxed mb-5" style={{ color: "var(--text-muted)" }}>
              Connecting parents, canteen staff, and school admins around every meal.
            </p>

            {subscribed ? (
              <p className="text-sm font-medium" style={{ color: "#22c55e" }}>✓ You&apos;re subscribed</p>
            ) : (
              <div className="flex gap-2">
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="your@email.com"
                  className="flex-1 min-w-0 px-3 py-2 rounded-lg text-sm outline-none"
                  style={{
                    background: "var(--bg-secondary)", border: "1px solid var(--border-input)",
                    color: "var(--text-primary)", fontFamily: "inherit",
                  }}
                  onKeyDown={(e) => e.key === "Enter" && handleSubscribe()}
                />
                <button
                  onClick={handleSubscribe}
                  disabled={!email || loading}
                  className="px-3 py-2 rounded-lg text-sm font-medium shrink-0 transition-all hover:scale-105 disabled:opacity-40"
                  style={{ background: "var(--accent)", color: "var(--accent-text)" }}
                >
                  {loading ? "…" : <ArrowRight size={14} />}
                </button>
              </div>
            )}
          </div>

          {/* Link columns */}
          {Object.entries(LINKS).map(([group, links]) => (
            <div key={group}>
              <p className="text-xs font-semibold uppercase tracking-[0.12em] mb-4" style={{ color: "var(--text-muted)" }}>
                {group}
              </p>
              <ul className="space-y-2.5">
                {links.map(({ label, href }) => (
                  <li key={label}>
                    <Link href={href} className="text-sm transition-colors hover:text-(--text-primary)"
                      style={{ color: "var(--text-secondary)" }}>
                      {label}
                    </Link>
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>
      </div>

      {/* Bottom bar */}
      <div className="max-w-6xl mx-auto px-6 py-5 flex flex-col sm:flex-row items-center justify-between gap-3"
        style={{ borderTop: "1px solid var(--divider)" }}>
        <p className="text-xs" style={{ color: "var(--text-muted)" }}>
          © {currentYear || "2026"} SchoolMealPay · Rawalpindi, Pakistan
        </p>
        <div className="flex items-center gap-1">
          <span className="text-xs" style={{ color: "var(--text-muted)" }}>Built with</span>
          <span className="text-xs mx-1">❤️</span>
          <span className="text-xs" style={{ color: "var(--text-muted)" }}>for Pakistan&apos;s schools</span>
        </div>
      </div>
    </footer>
  );
}