"use client";

import { useState } from "react";
import { CheckCircle2, ArrowRight, Clock, Video, Users, Monitor } from "lucide-react";
import Footer from "../_components/Footer";
import { Reveal, EyebrowLabel, DisplayHeading, StaggerGroup, StaggerItem } from "../../../components/Motion";
import Link from "next/link";
import { submitDemoForm } from "@/db/actions/email";

const WHAT_YOULL_SEE = [
  { icon: Users, label: "Parent dashboard", desc: "Ordering, spending limits, nutrition trends" },
  { icon: Monitor, label: "Admin panel", desc: "Menu scheduling, student management, reports" },
  { icon: Video, label: "Live orders board", desc: "Kanban view, status transitions, allergen cards" },
  { icon: Clock, label: "QR pickup flow", desc: "Scan, verify, collect — end to end in 2 seconds" },
];

const TIME_SLOTS = ["9:00 AM", "10:00 AM", "11:00 AM", "1:00 PM", "2:00 PM", "3:00 PM", "4:00 PM"];
const ROLES = ["School Principal", "School Admin", "IT Manager", "Canteen Manager", "Parent", "Other"];

const inputStyle = {
  width: "100%", padding: "11px 14px", borderRadius: 10,
  border: "1px solid var(--border-input)", background: "var(--bg-secondary)",
  color: "var(--text-primary)", fontSize: 14, fontFamily: "inherit", outline: "none",
} as React.CSSProperties;

export default function DemoPage() {
  const [submitted, setSubmitted] = useState(false);
  const [loading, setLoading] = useState(false);
  const [selectedSlot, setSelectedSlot] = useState("");
  const [form, setForm] = useState({ name: "", email: "", school: "", phone: "", role: ROLES[0], date: "" });

  const f = (key: string) => (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) =>
    setForm((p) => ({ ...p, [key]: e.target.value }));

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.name || !form.email || !form.school || !selectedSlot) return;
    setLoading(true);
    try {
      await submitDemoForm({ ...form, slot: selectedSlot });
      setSubmitted(true);
    } finally {
      setLoading(false);
    }
  };

  if (submitted) {
    return (
      <div className="min-h-screen flex items-center justify-center px-6 py-6 pt-30 lg:pt-40 lg:py-8"
        style={{ background: "var(--bg-secondary)" }}>
        <Reveal>
          <div className="max-w-lg w-full text-center">
            <div className="w-20 h-20 rounded-3xl flex items-center justify-center mx-auto mb-8"
              style={{ background: "rgba(34,197,94,0.1)", border: "1px solid rgba(34,197,94,0.2)" }}>
              <CheckCircle2 size={36} style={{ color: "#22c55e" }} />
            </div>
            <DisplayHeading className="text-5xl mb-4">You&apos;re booked.</DisplayHeading>
            <p className="text-base leading-relaxed mb-8" style={{ color: "var(--text-secondary)" }}>
              Confirmation coming to <strong style={{ color: "var(--text-primary)" }}>{form.email}</strong> within
              the hour, with a Zoom link for <strong style={{ color: "var(--text-primary)" }}>
                {selectedSlot}{form.date ? ` on ${form.date}` : ""}
              </strong>.
            </p>
            <div className="rounded-2xl p-6 mb-8 text-left space-y-3"
              style={{ background: "var(--bg-card)", border: "1px solid var(--border-card)" }}>
              {[
                { label: "School", value: form.school },
                { label: "Your role", value: form.role },
                { label: "Duration", value: "20 minutes" },
                { label: "Format", value: "Zoom — screen share" },
              ].map(({ label, value }) => (
                <div key={label} className="flex items-center justify-between text-sm">
                  <span style={{ color: "var(--text-muted)" }}>{label}</span>
                  <span style={{ color: "var(--text-primary)" }}>{value}</span>
                </div>
              ))}
            </div>
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
        <div className="text-center mb-16">
          <Reveal><EyebrowLabel>Free 20-minute demo</EyebrowLabel></Reveal>
          <Reveal delay={0.06}>
            <DisplayHeading className="text-6xl sm:text-7xl mt-8 mb-5">
              See SchoolMealPay<br /><em>in motion.</em>
            </DisplayHeading>
          </Reveal>
          <Reveal delay={0.12}>
            <p className="text-lg" style={{ color: "var(--text-secondary)" }}>
              We&apos;ll walk through the full flow — parent ordering, QR pickup, admin analytics — live.
            </p>
          </Reveal>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-[1fr_460px] gap-8 items-start">
          {/* Left: What you'll see */}
          <div className="space-y-5">
            <Reveal>
              <div className="rounded-3xl overflow-hidden"
                style={{ background: "var(--bg-card)", border: "1px solid var(--border-card)", boxShadow: "var(--shadow-card)" }}>
                <div className="px-8 pt-8 pb-4">
                  <p className="text-xs font-semibold uppercase tracking-[0.12em] mb-6" style={{ color: "var(--text-muted)" }}>
                    What we&apos;ll cover
                  </p>
                  <div className="space-y-5">
                    {WHAT_YOULL_SEE.map(({ icon: Icon, label, desc }) => (
                      <div key={label} className="flex items-start gap-4">
                        <div className="w-9 h-9 rounded-xl flex items-center justify-center shrink-0"
                          style={{ background: "var(--bg-secondary)", border: "1px solid var(--border-card)" }}>
                          <Icon size={15} style={{ color: "var(--text-muted)" }} />
                        </div>
                        <div>
                          <p className="text-sm font-semibold" style={{ color: "var(--text-primary)" }}>{label}</p>
                          <p className="text-xs mt-0.5" style={{ color: "var(--text-muted)" }}>{desc}</p>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>

                <div className="mx-8 my-6" style={{ height: 1, background: "var(--divider)" }} />

                <div className="px-8 pb-8">
                  <StaggerGroup className="grid grid-cols-3 gap-3">
                    {[
                      { label: "20 min", sub: "no fluff" },
                      { label: "Zoom", sub: "screen share" },
                      { label: "Free", sub: "no commitment" },
                    ].map(({ label, sub }) => (
                      <StaggerItem key={label}>
                        <div className="rounded-xl p-3 text-center" style={{ background: "var(--bg-secondary)" }}>
                          <p style={{ fontFamily: "'Instrument Serif', serif", fontSize: 18, color: "var(--text-primary)", fontWeight: "bold", margin: 0 }}>{label}</p>
                          <p className="text-xs mt-0.5" style={{ color: "var(--text-muted)" }}>{sub}</p>
                        </div>
                      </StaggerItem>
                    ))}
                  </StaggerGroup>
                </div>
              </div>
            </Reveal>

            <Reveal delay={0.1}>
              <div className="rounded-2xl p-6" style={{ background: "var(--bg-card)", border: "1px solid var(--border-card)" }}>
                <p className="text-sm leading-relaxed italic mb-4" style={{ color: "var(--text-secondary)" }}>
                  "The QR pickup feature alone is worth switching for. Our canteen queue dropped from 20 minutes to under 4."
                </p>
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 rounded-full flex items-center justify-center text-sm font-bold"
                    style={{ background: "var(--bg-tertiary)", color: "var(--text-secondary)" }}>A</div>
                  <div>
                    <p className="text-xs font-semibold" style={{ color: "var(--text-primary)" }}>Ahmed Raza</p>
                    <p className="text-xs" style={{ color: "var(--text-muted)" }}>Principal, The City School</p>
                  </div>
                </div>
              </div>
            </Reveal>
          </div>

          {/* Right: Form */}
          <Reveal delay={0.08}>
            <div className="rounded-3xl p-8"
              style={{ background: "var(--bg-card)", border: "1px solid var(--border-card)", boxShadow: "var(--shadow-card)" }}>
              <p className="text-base font-semibold mb-6" style={{ color: "var(--text-primary)" }}>Book your slot</p>

              <form onSubmit={handleSubmit} className="space-y-4">
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-xs font-medium mb-1.5" style={{ color: "var(--text-secondary)" }}>Name *</label>
                    <input required value={form.name} onChange={f("name")} placeholder="Ahmed Khan" style={inputStyle} />
                  </div>
                  <div>
                    <label className="block text-xs font-medium mb-1.5" style={{ color: "var(--text-secondary)" }}>Your role</label>
                    <select value={form.role} onChange={f("role")} style={inputStyle}>
                      {ROLES.map((r) => <option key={r}>{r}</option>)}
                    </select>
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-medium mb-1.5" style={{ color: "var(--text-secondary)" }}>Work email *</label>
                  <input required type="email" value={form.email} onChange={f("email")} placeholder="you@school.edu.pk" style={inputStyle} />
                </div>

                <div>
                  <label className="block text-xs font-medium mb-1.5" style={{ color: "var(--text-secondary)" }}>School name *</label>
                  <input required value={form.school} onChange={f("school")} placeholder="e.g. Beacon House School System" style={inputStyle} />
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-xs font-medium mb-1.5" style={{ color: "var(--text-secondary)" }}>Phone</label>
                    <input value={form.phone} onChange={f("phone")} placeholder="+92 300 0000000" style={inputStyle} />
                  </div>
                  <div>
                    <label className="block text-xs font-medium mb-1.5" style={{ color: "var(--text-secondary)" }}>Preferred date</label>
                    <input type="date" value={form.date} onChange={f("date")}
                      min={new Date().toISOString().split("T")[0]} style={inputStyle} />
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-medium mb-2" style={{ color: "var(--text-secondary)" }}>Preferred time *</label>
                  <div className="grid grid-cols-4 gap-2">
                    {TIME_SLOTS.map((slot) => (
                      <button key={slot} type="button" onClick={() => setSelectedSlot(slot)}
                        className="py-2 rounded-lg text-xs font-medium text-center transition-all hover:scale-[1.03]"
                        style={selectedSlot === slot
                          ? { background: "var(--accent)", color: "var(--accent-text)" }
                          : { background: "var(--bg-secondary)", border: "1px solid var(--border-input)", color: "var(--text-secondary)" }
                        }>
                        {slot}
                      </button>
                    ))}
                  </div>
                </div>

                <button type="submit" disabled={!form.name || !form.email || !form.school || !selectedSlot || loading}
                  className="w-full py-4 rounded-xl text-sm font-semibold transition-all disabled:opacity-40 hover:scale-[1.01] flex items-center justify-center gap-2 mt-2"
                  style={{ background: "var(--accent)", color: "var(--accent-text)" }}>
                  {loading ? "Booking…" : "Confirm booking"} <ArrowRight size={14} />
                </button>

                <p className="text-xs text-center" style={{ color: "var(--text-muted)" }}>
                  You&apos;ll receive a Zoom link within 1 hour of booking.
                </p>
              </form>
            </div>
          </Reveal>
        </div>
      </div>
      <Footer />
    </div>
  );
}