"use client";

import { useState } from "react";
import {
  Shield,
  Eye,
  Share2,
  Archive,
  Lock,
  Baby,
  FileText,
  Mail,
  ChevronRight,
} from "lucide-react";
import Footer from "../_components/Footer";
import {
  Reveal,
  SlideIn,
  EyebrowLabel,
  DisplayHeading,
} from "../../../components/Motion";

const LAST_UPDATED = "May 2025";

const SECTIONS = [
  {
    id: "what-we-collect",
    icon: Eye,
    color: "#3b82f6",
    bg: "rgba(59,130,246,0.1)",
    title: "What we collect",
    summary:
      "Account info, student data entered by school staff, order history, and standard web analytics.",
    items: [
      {
        title: "Account information",
        body: "When you register, we collect your name, email, and phone number. School admins additionally provide their school name, address, and contact details.",
      },
      {
        title: "Student data",
        body: "Student names, codes, class assignments, and allergen/dietary information are entered by school administrators — not collected from students directly. This data is used solely to operate the meal ordering system.",
      },
      {
        title: "Order & payment data",
        body: "Every meal order is stored including items, quantities, and payment status. Card details are never stored on our servers — all card processing is handled by Stripe, JazzCash, and EasyPaisa via their encrypted vaults.",
      },
      {
        title: "Usage analytics",
        body: "Standard analytics: pages visited, feature usage, device/browser. Used only to improve the product. Never sold.",
      },
    ],
  },
  {
    id: "how-we-use",
    icon: FileText,
    color: "#8b5cf6",
    bg: "rgba(139,92,246,0.1)",
    title: "How we use it",
    summary:
      "Operating the service, surfacing nutrition trends, and sending transactional emails. Nothing else.",
    items: [
      {
        title: "Running SchoolMealPay",
        body: "All data is used to deliver the service — processing orders, pushing notifications, displaying dashboards, generating receipts.",
      },
      {
        title: "Nutrition insights",
        body: "Meal history is analysed to surface informational trends for parents (Pro feature). This is clearly labelled as informational, never medical advice. No data shared with health providers.",
      },
      {
        title: "Transactional emails",
        body: "Order confirmations, receipts, and service announcements only. We never send marketing emails without explicit opt-in.",
      },
    ],
  },
  {
    id: "data-sharing",
    icon: Share2,
    color: "#22c55e",
    bg: "rgba(34,197,94,0.1)",
    title: "Data sharing",
    summary:
      "We never sell your data. A small set of infrastructure providers process it strictly to run the service.",
    items: [
      {
        title: "We never sell your data",
        body: "SchoolMealPay does not sell, rent, or trade personal data to any third party for advertising or marketing purposes. Our products are ad-free.",
      },
      {
        title: "Infrastructure providers",
        body: "We use Clerk (auth), Neon (database), Stripe/JazzCash/EasyPaisa (payments), and Vercel (hosting). Each is bound by a data processing agreement and has no right to use your data for their own purposes.",
      },
      {
        title: "Legal disclosure",
        body: "We may disclose data if required by Pakistani law or a valid court order. We will notify affected users wherever legally permitted to do so.",
      },
    ],
  },
  {
    id: "data-retention",
    icon: Archive,
    color: "#f59e0b",
    bg: "rgba(245,158,11,0.1)",
    title: "Data retention",
    summary:
      "Data stays while your account is active. Request full deletion at any time — processed within 30 days.",
    items: [
      {
        title: "Active accounts",
        body: "Data is retained while an account is active. Admins can export a full data archive at any time from the admin panel.",
      },
      {
        title: "Account deletion",
        body: "When a school closes its account, personal data is deleted within 30 days. Anonymised aggregate stats (e.g. total orders) may be retained indefinitely.",
      },
      {
        title: "Audit logs",
        body: "System audit logs are retained for 12 months and cannot be deleted by users — they may be required for dispute resolution.",
      },
    ],
  },
  {
    id: "security",
    icon: Lock,
    color: "#ef4444",
    bg: "rgba(239,68,68,0.1)",
    title: "Security",
    summary:
      "TLS 1.3 in transit. AES-256 at rest. Role-based access controls. Full audit trail.",
    items: [
      {
        title: "Encryption",
        body: "All data encrypted in transit using TLS 1.3. Database backups are AES-256 encrypted at rest.",
      },
      {
        title: "Authentication",
        body: "Authentication handled by Clerk: secure session management, brute-force protection, optional two-factor auth.",
      },
      {
        title: "Access controls",
        body: "Role-based controls ensure staff, parents, and admins only see data relevant to their role. All access events are logged.",
      },
    ],
  },
  {
    id: "childrens-data",
    icon: Baby,
    color: "#06b6d4",
    bg: "rgba(6,182,212,0.1)",
    title: "Children's data",
    summary:
      "Student records are treated as our most sensitive data. Special care at every step.",
    items: [
      {
        title: "Special protections",
        body: "Student records — including allergen profiles and meal history — are accessible only to linked parents and authorised school staff. No student data is used for advertising or shared externally.",
      },
      {
        title: "Parental consent model",
        body: "Parents must explicitly link their account to a student record. That link must be approved by a school administrator before any data is visible to the parent.",
      },
    ],
  },
  {
    id: "your-rights",
    icon: Shield,
    color: "#a855f7",
    bg: "rgba(168,85,247,0.1)",
    title: "Your rights",
    summary:
      "Access, correct, or delete your data at any time. We respond to all requests within 5 business days.",
    items: [
      {
        title: "Access & export",
        body: "Request a copy of all personal data we hold at any time: privacy@schoolmealpay.com.",
      },
      {
        title: "Correction",
        body: "Update your name, email, and phone from your account settings. School admins can correct student records from the admin panel.",
      },
      {
        title: "Deletion",
        body: "Request full account deletion at support@schoolmealpay.com. Processed within 30 days.",
      },
    ],
  },
];

export default function PrivacyPage() {
  const [activeSection, setActiveSection] = useState<string | null>(null);

  const toggleSection = (id: string) => {
    setActiveSection((prev) => (prev === id ? null : id));
  };

  return (
    <div
      style={{
        background: "var(--bg-secondary)",
        color: "var(--text-primary)",
      }}
    >
      <div className="max-w-6xl mx-auto px-6 pt-30 lg:pt-40 pb-28">
        {/* Header */}
        <div className="max-w-2xl mb-20">
          <Reveal>
            <EyebrowLabel>Legal</EyebrowLabel>
          </Reveal>
          <Reveal delay={0.06}>
            <DisplayHeading className="text-6xl sm:text-7xl mt-8 mb-5">
              Privacy
              <br />
              <em>Policy.</em>
            </DisplayHeading>
          </Reveal>
          <Reveal delay={0.12}>
            <p
              className="text-base leading-relaxed"
              style={{ color: "var(--text-secondary)" }}
            >
              We collect only what we need to run SchoolMealPay. We never sell
              your data. Here&apos;s exactly what we do — in plain language, not
              legal jargon.
            </p>
            <p className="text-sm mt-3" style={{ color: "var(--text-muted)" }}>
              Last updated: {LAST_UPDATED}
            </p>
          </Reveal>
        </div>

        {/* Three-column summary cards */}
        <Reveal delay={0.1}>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-16">
            {[
              {
                icon: "🔒",
                title: "We never sell your data",
                desc: "Not to advertisers, not to anyone.",
              },
              {
                icon: "🗑️",
                title: "Delete anytime",
                desc: "Request deletion and it's gone in 30 days.",
              },
              {
                icon: "📧",
                title: "Questions?",
                desc: "privacy@schoolmealpay.com",
              },
            ].map(({ icon, title, desc }) => (
              <div
                key={title}
                className="rounded-2xl p-5 flex items-start gap-4"
                style={{
                  background: "var(--bg-card)",
                  border: "1px solid var(--border-card)",
                }}
              >
                <span className="text-2xl shrink-0">{icon}</span>
                <div>
                  <p
                    className="text-sm font-semibold mb-1"
                    style={{ color: "var(--text-primary)" }}
                  >
                    {title}
                  </p>
                  <p className="text-xs" style={{ color: "var(--text-muted)" }}>
                    {desc}
                  </p>
                </div>
              </div>
            ))}
          </div>
        </Reveal>

        {/* Sections — accordion style with sidebar nav on desktop */}
        <div className="grid grid-cols-1 lg:grid-cols-[220px_1fr] gap-10">
          {/* Sticky nav */}
          <SlideIn from="left">
            <nav className="lg:sticky lg:top-24 space-y-1">
              {SECTIONS.map(({ id, icon: Icon, title, color }) => (
                <button
                  key={id}
                  onClick={() => {
                    document
                      .getElementById(id)
                      ?.scrollIntoView({ behavior: "smooth", block: "start" });
                  }}
                  className="w-full flex items-center gap-2.5 px-3 py-2.5 rounded-xl text-left text-sm transition-colors group"
                  style={{ color: "var(--text-secondary)" }}
                >
                  <Icon size={13} style={{ color, flexShrink: 0 }} />
                  {title}
                </button>
              ))}
            </nav>
          </SlideIn>

          {/* Accordion content */}
          <div className="space-y-4">
            {SECTIONS.map(
              ({ id, icon: Icon, color, bg, title, summary, items }, idx) => {
                const isOpen = activeSection === id;
                return (
                  <Reveal key={id} delay={idx * 0.04}>
                    <div
                      id={id}
                      className="rounded-2xl overflow-hidden transition-all duration-200"
                      style={{
                        background: "var(--bg-card)",
                        border:
                          isOpen ?
                            `1px solid ${color}40`
                          : "1px solid var(--border-card)",
                        boxShadow:
                          isOpen ?
                            `0 0 0 3px ${color}10`
                          : "var(--shadow-card)",
                      }}
                    >
                      {/* Header row */}
                      <button
                        className="w-full flex items-center gap-4 p-6 text-left"
                        onClick={() => toggleSection(id)}
                      >
                        <div
                          className="w-10 h-10 rounded-xl flex items-center justify-center shrink-0"
                          style={{ background: bg }}
                        >
                          <Icon size={16} style={{ color }} />
                        </div>
                        <div className="flex-1 min-w-0">
                          <p
                            className="text-sm font-semibold"
                            style={{ color: "var(--text-primary)" }}
                          >
                            {title}
                          </p>
                          <p
                            className="text-xs mt-0.5 line-clamp-1"
                            style={{ color: "var(--text-muted)" }}
                          >
                            {summary}
                          </p>
                        </div>
                        <ChevronRight
                          size={16}
                          className="shrink-0 transition-transform duration-200"
                          style={{
                            color: "var(--text-muted)",
                            transform:
                              isOpen ? "rotate(90deg)" : "rotate(0deg)",
                          }}
                        />
                      </button>

                      {/* Expanded content */}
                      {isOpen && (
                        <div
                          className="px-6 pb-6 space-y-5"
                          style={{
                            borderTop: "1px solid var(--border-primary)",
                          }}
                        >
                          <div className="pt-5 space-y-5">
                            {items.map(({ title: itemTitle, body }) => (
                              <div key={itemTitle}>
                                <p
                                  className="text-sm font-semibold mb-1.5"
                                  style={{ color: "var(--text-primary)" }}
                                >
                                  {itemTitle}
                                </p>
                                <p
                                  className="text-sm leading-relaxed"
                                  style={{ color: "var(--text-secondary)" }}
                                >
                                  {body}
                                </p>
                              </div>
                            ))}
                          </div>
                        </div>
                      )}
                    </div>
                  </Reveal>
                );
              },
            )}
          </div>
        </div>

        {/* Contact footer */}
        <Reveal delay={0.1}>
          <div
            className="mt-16 rounded-3xl p-10 flex flex-col sm:flex-row items-center justify-between gap-6"
            style={{
              background: "var(--bg-card)",
              border: "1px solid var(--border-card)",
            }}
          >
            <div className="flex items-center gap-4">
              <div
                className="w-12 h-12 rounded-2xl flex items-center justify-center"
                style={{ background: "rgba(139,92,246,0.1)" }}
              >
                <Mail size={20} style={{ color: "#8b5cf6" }} />
              </div>
              <div>
                <p
                  className="text-sm font-semibold"
                  style={{ color: "var(--text-primary)" }}
                >
                  Privacy questions?
                </p>
                <p
                  className="text-sm"
                  style={{ color: "var(--text-secondary)" }}
                >
                  We respond within 5 business days.
                </p>
              </div>
            </div>
            <a
              href="mailto:privacy@schoolmealpay.com"
              className="px-6 py-3 rounded-xl text-sm font-semibold flex items-center gap-2 shrink-0 transition-all hover:scale-[1.02]"
              style={{
                background: "var(--accent)",
                color: "var(--accent-text)",
              }}
            >
              privacy@schoolmealpay.com
            </a>
          </div>
        </Reveal>
      </div>

      <Footer />
    </div>
  );
}
