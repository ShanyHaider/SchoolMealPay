"use client";

import { useState, useTransition } from "react";
import {
  Building2,
  Mail,
  Phone,
  Globe,
  Clock,
  Image,
  Save,
  CheckCircle,
  AlertCircle,
} from "lucide-react";
import { upsertSchoolProfile } from "@/db/actions/Admin";

type SchoolProfile = {
  id: string;
  name: string;
  address: string | null;
  logoUrl: string | null;
  email: string | null;
  phone: string | null;
  timezone: string | null;
} | null;

const TIMEZONES = [
  "Asia/Karachi",
  "Asia/Kolkata",
  "Asia/Dubai",
  "Asia/Riyadh",
  "Europe/London",
  "America/New_York",
  "America/Chicago",
  "America/Los_Angeles",
];

function Section({
  title,
  subtitle,
  children,
}: {
  title: string;
  subtitle: string;
  children: React.ReactNode;
}) {
  return (
    <div
      className="rounded-xl border overflow-hidden"
      style={{
        background: "var(--bg-card)",
        borderColor: "var(--border-card)",
        boxShadow: "var(--shadow-card)",
      }}
    >
      <div
        className="px-6 py-4 border-b"
        style={{
          borderColor: "var(--border-primary)",
          background: "var(--bg-secondary)",
        }}
      >
        <h2
          className="text-sm font-semibold"
          style={{ color: "var(--text-primary)" }}
        >
          {title}
        </h2>
        <p className="text-xs mt-0.5" style={{ color: "var(--text-muted)" }}>
          {subtitle}
        </p>
      </div>
      <div className="p-6">{children}</div>
    </div>
  );
}

function Field({
  label,
  icon: Icon,
  children,
}: {
  label: string;
  icon: React.ElementType;
  children: React.ReactNode;
}) {
  return (
    <div>
      <label
        className="flex items-center gap-1.5 text-xs font-medium mb-1.5"
        style={{ color: "var(--text-secondary)" }}
      >
        <Icon size={12} style={{ color: "var(--text-muted)" }} /> {label}
      </label>
      {children}
    </div>
  );
}

function inputCls() {
  return "w-full px-3 py-2 rounded-lg border text-sm outline-none transition-colors";
}
function inputSty() {
  return {
    background: "var(--bg-secondary)",
    borderColor: "var(--border-input)",
    color: "var(--text-primary)",
  };
}

export function SettingsClient({ school }: { school: SchoolProfile }) {
  const [isPending, startTransition] = useTransition();
  const [saved, setSaved] = useState(false);
  const [error, setError] = useState("");

  const [form, setForm] = useState({
    name: school?.name ?? "",
    address: school?.address ?? "",
    logoUrl: school?.logoUrl ?? "",
    email: school?.email ?? "",
    phone: school?.phone ?? "",
    timezone: school?.timezone ?? "Asia/Karachi",
  });

  function update(key: string, value: string) {
    setForm((f) => ({ ...f, [key]: value }));
    setSaved(false);
    setError("");
  }

  function handleSave() {
    if (!form.name.trim()) {
      setError("School name is required.");
      return;
    }
    startTransition(async () => {
      try {
        await upsertSchoolProfile({
          name: form.name,
          address: form.address || undefined,
          logoUrl: form.logoUrl || undefined,
          email: form.email || undefined,
          phone: form.phone || undefined,
          timezone: form.timezone || undefined,
        });
        setSaved(true);
        setTimeout(() => setSaved(false), 3000);
      } catch {
        setError("Failed to save. Please try again.");
      }
    });
  }

  return (
    <div className="max-w-6xl space-y-5">
      {/* School Identity */}
      <Section
        title="School Profile"
        subtitle="Basic information about your school displayed across the platform."
      >
        <div className="space-y-4">
          <Field label="School Name *" icon={Building2}>
            <input
              value={form.name}
              onChange={(e) => update("name", e.target.value)}
              placeholder="e.g. Beaconhouse School System"
              className={inputCls()}
              style={inputSty()}
            />
          </Field>

          <Field label="Address" icon={Globe}>
            <textarea
              value={form.address}
              onChange={(e) => update("address", e.target.value)}
              placeholder="Street, City, Province"
              rows={2}
              className={`${inputCls()} resize-none`}
              style={inputSty()}
            />
          </Field>

          <Field label="Logo URL" icon={Image}>
            <input
              value={form.logoUrl}
              onChange={(e) => update("logoUrl", e.target.value)}
              placeholder="https://example.com/logo.png"
              className={inputCls()}
              style={inputSty()}
            />
            {form.logoUrl && (
              <div className="mt-2 flex items-center gap-3">
                <img
                  src={form.logoUrl}
                  alt="Logo preview"
                  className="w-12 h-12 rounded-lg object-contain border"
                  style={{
                    borderColor: "var(--border-card)",
                    background: "var(--bg-secondary)",
                  }}
                  onError={(e) => {
                    (e.target as HTMLImageElement).style.display = "none";
                  }}
                />
                <p className="text-xs" style={{ color: "var(--text-muted)" }}>
                  Logo preview
                </p>
              </div>
            )}
          </Field>
        </div>
      </Section>

      {/* Contact */}
      <Section
        title="Contact Information"
        subtitle="How parents and staff can reach your school."
      >
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <Field label="Contact Email" icon={Mail}>
            <input
              type="email"
              value={form.email}
              onChange={(e) => update("email", e.target.value)}
              placeholder="admin@school.edu.pk"
              className={inputCls()}
              style={inputSty()}
            />
          </Field>
          <Field label="Contact Phone" icon={Phone}>
            <input
              type="tel"
              value={form.phone}
              onChange={(e) => update("phone", e.target.value)}
              placeholder="+92 300 0000000"
              className={inputCls()}
              style={inputSty()}
            />
          </Field>
        </div>
      </Section>

      {/* System */}
      <Section
        title="System Configuration"
        subtitle="Timezone and locale settings used for orders and scheduling."
      >
        <Field label="Timezone" icon={Clock}>
          <select
            value={form.timezone}
            onChange={(e) => update("timezone", e.target.value)}
            className={inputCls()}
            style={inputSty()}
          >
            {TIMEZONES.map((tz) => (
              <option key={tz} value={tz}>
                {tz}
              </option>
            ))}
          </select>
        </Field>
      </Section>

      {/* Save bar */}
      <div
        className="flex items-center justify-between gap-4 px-5 py-3 rounded-xl border"
        style={{
          background: "var(--bg-card)",
          borderColor: "var(--border-card)",
        }}
      >
        <div>
          {error && (
            <div className="flex items-center gap-1.5">
              <AlertCircle size={13} style={{ color: "#ef4444" }} />
              <p className="text-xs" style={{ color: "#ef4444" }}>
                {error}
              </p>
            </div>
          )}
          {saved && (
            <div className="flex items-center gap-1.5">
              <CheckCircle size={13} style={{ color: "#22c55e" }} />
              <p className="text-xs" style={{ color: "#22c55e" }}>
                Settings saved successfully
              </p>
            </div>
          )}
          {!error && !saved && (
            <p className="text-xs" style={{ color: "var(--text-muted)" }}>
              {school ?
                "Last saved: profile exists"
              : "Not yet saved — fill in your school details"}
            </p>
          )}
        </div>
        <button
          onClick={handleSave}
          disabled={isPending}
          className="flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium disabled:opacity-50 transition-all"
          style={{ background: "var(--accent)", color: "var(--accent-text)" }}
        >
          <Save size={14} />
          {isPending ? "Saving…" : "Save Settings"}
        </button>
      </div>
    </div>
  );
}
