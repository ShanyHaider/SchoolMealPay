"use client";

import { useState } from "react";
import {
  Mail, Clock, MapPin, ArrowRight, CheckCircle2, MessageSquare,
} from "lucide-react";
import Footer from "../_components/Footer";
import {
  Reveal, SlideIn, EyebrowLabel, DisplayHeading, StaggerGroup, StaggerItem,
} from "../../../components/Motion";
import Link from "next/link";
import { submitContactForm } from "@/db/actions/email";

const TOPICS = [
  "General inquiry", "Book a demo", "Technical support",
  "Billing", "Partnership", "Press", "Other",
];

const inputStyle = {
  width: "100%", padding: "11px 14px", borderRadius: 10,
  border: "1px solid var(--border-input)", background: "var(--bg-secondary)",
  color: "var(--text-primary)", fontSize: 14, fontFamily: "inherit", outline: "none",
} as React.CSSProperties;

const CONTACT_INFO = [
  { icon: Mail, label: "Email", value: "support@schoolmealpay.com", sub: "We reply within one business day" },
  { icon: Clock, label: "Support hours", value: "Mon – Fri, 9am – 6pm", sub: "Pakistan Standard Time (PKT)" },
  { icon: MapPin, label: "Based in", value: "Rawalpindi, Pakistan", sub: "Serving schools nationwide" },
];

export default function ContactPage() {
  const [submitted, setSubmitted] = useState(false);
  const [loading, setLoading] = useState(false);
  const [form, setForm] = useState({ name: "", email: "", topic: TOPICS[0], message: "" });

  const f = (key: string) => (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) =>
    setForm((p) => ({ ...p, [key]: e.target.value }));

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.name || !form.email || !form.message) return;
    setLoading(true);
    try {
      await submitContactForm(form);
      setSubmitted(true);
    } finally {
      setLoading(false);
    }
  };

  if (submitted) {
    return (
      <div className="min-h-screen flex items-center justify-center px-6" style={{ background: "var(--bg-secondary)" }}>
        <Reveal>
          <div className="max-w-md w-full text-center">
            <div className="w-20 h-20 rounded-3xl flex items-center justify-center mx-auto mb-8"
              style={{ background: "rgba(34,197,94,0.1)", border: "1px solid rgba(34,197,94,0.2)" }}>
              <CheckCircle2 size={36} style={{ color: "#22c55e" }} />
            </div>
            <DisplayHeading className="text-5xl mb-4">Message sent.</DisplayHeading>
            <p className="text-base mb-8" style={{ color: "var(--text-secondary)" }}>
              Thanks, <strong style={{ color: "var(--text-primary)" }}>{form.name}</strong>.
              We&apos;ll get back to <strong style={{ color: "var(--text-primary)" }}>{form.email}</strong> within one business day.
            </p>
            <Link href="/" className="inline-flex items-center gap-2 px-6 py-3 rounded-xl text-sm font-semibold"
              style={{ background: "var(--accent)", color: "var(--accent-text)" }}>
              Back to home <ArrowRight size={14} />
            </Link>
          </div>
        </Reveal>
      </div>
    );
  }

  return (
    <div style={{ background: "var(--bg-secondary)", color: "var(--text-primary)" }}>
      <div className="max-w-6xl mx-auto px-6 pt-30 lg:pt-40 pb-28">
        {/* Header */}
        <div className="mb-20">
          <Reveal><EyebrowLabel>Get in touch</EyebrowLabel></Reveal>
          <div className="grid grid-cols-1 lg:grid-cols-[1fr_1fr] gap-10 mt-8 items-end">
            <Reveal delay={0.06}>
              <DisplayHeading className="text-6xl sm:text-7xl">
                We&apos;d love to<br /><em>hear from you.</em>
              </DisplayHeading>
            </Reveal>
            <Reveal delay={0.12}>
              <p className="text-lg leading-relaxed" style={{ color: "var(--text-secondary)" }}>
                Questions, feedback, partnership ideas, or just want to say hi —
                every message gets a real reply from a real person.
              </p>
            </Reveal>
          </div>
        </div>

        {/* Main grid */}
        <div className="grid grid-cols-1 lg:grid-cols-[320px_1fr] gap-8">
          {/* Left: Info */}
          <div className="space-y-4">
            <SlideIn from="left">
              <StaggerGroup className="space-y-3">
                {CONTACT_INFO.map(({ icon: Icon, label, value, sub }) => (
                  <StaggerItem key={label}>
                    <div className="rounded-2xl p-5 flex items-start gap-4"
                      style={{ background: "var(--bg-card)", border: "1px solid var(--border-card)" }}>
                      <div className="w-9 h-9 rounded-xl flex items-center justify-center shrink-0"
                        style={{ background: "var(--bg-secondary)" }}>
                        <Icon size={15} style={{ color: "var(--text-muted)" }} />
                      </div>
                      <div>
                        <p className="text-xs font-medium mb-0.5" style={{ color: "var(--text-muted)" }}>{label}</p>
                        <p className="text-sm font-semibold" style={{ color: "var(--text-primary)" }}>{value}</p>
                        <p className="text-xs mt-0.5" style={{ color: "var(--text-muted)" }}>{sub}</p>
                      </div>
                    </div>
                  </StaggerItem>
                ))}
              </StaggerGroup>
            </SlideIn>

            <SlideIn from="left" delay={0.1}>
              <div className="rounded-2xl p-5" style={{ background: "var(--bg-card)", border: "1px solid var(--border-card)" }}>
                <p className="text-xs font-semibold uppercase tracking-widest mb-4" style={{ color: "var(--text-muted)" }}>
                  Quick links
                </p>
                <div className="space-y-2">
                  {[
                    { label: "Book a demo", href: "/demo" },
                    { label: "View pricing", href: "/pricing" },
                    { label: "Browse features", href: "/features" },
                    { label: "Privacy policy", href: "/privacy" },
                  ].map(({ label, href }) => (
                    <a key={href} href={href} className="flex items-center justify-between text-sm py-1.5 group transition-colors"
                      style={{ color: "var(--text-secondary)" }}>
                      {label}
                      <ArrowRight size={12} className="opacity-0 group-hover:opacity-100 transition-opacity"
                        style={{ color: "var(--text-muted)" }} />
                    </a>
                  ))}
                </div>
              </div>
            </SlideIn>
          </div>

          {/* Right: Form */}
          <Reveal delay={0.1}>
            <div className="rounded-3xl p-8 lg:p-10"
              style={{ background: "var(--bg-card)", border: "1px solid var(--border-card)", boxShadow: "var(--shadow-card)" }}>
              <div className="flex items-center gap-3 mb-8">
                <div className="w-9 h-9 rounded-xl flex items-center justify-center" style={{ background: "var(--bg-secondary)" }}>
                  <MessageSquare size={15} style={{ color: "var(--text-muted)" }} />
                </div>
                <p className="text-base font-semibold" style={{ color: "var(--text-primary)" }}>Send a message</p>
              </div>

              <form onSubmit={handleSubmit} className="space-y-5">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs font-medium mb-2" style={{ color: "var(--text-secondary)" }}>Name *</label>
                    <input required value={form.name} onChange={f("name")} placeholder="Ahmed Khan" style={inputStyle} />
                  </div>
                  <div>
                    <label className="block text-xs font-medium mb-2" style={{ color: "var(--text-secondary)" }}>Email *</label>
                    <input required type="email" value={form.email} onChange={f("email")} placeholder="you@example.com" style={inputStyle} />
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-medium mb-2" style={{ color: "var(--text-secondary)" }}>Topic</label>
                  <select value={form.topic} onChange={f("topic")} style={inputStyle}>
                    {TOPICS.map((t) => <option key={t}>{t}</option>)}
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-medium mb-2" style={{ color: "var(--text-secondary)" }}>Message *</label>
                  <textarea required value={form.message} onChange={f("message")}
                    placeholder="Tell us what you need — the more detail, the better we can help…"
                    rows={6} style={{ ...inputStyle, resize: "vertical" }} />
                </div>

                <button type="submit" disabled={!form.name || !form.email || !form.message || loading}
                  className="w-full py-4 rounded-xl text-sm font-semibold transition-all disabled:opacity-40 hover:scale-[1.01] flex items-center justify-center gap-2"
                  style={{ background: "var(--accent)", color: "var(--accent-text)" }}>
                  {loading ? "Sending…" : "Send message"} <ArrowRight size={14} />
                </button>
              </form>
            </div>
          </Reveal>
        </div>
      </div>
      <Footer />
    </div>
  );
}