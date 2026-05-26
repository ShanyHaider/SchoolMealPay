"use client";

import { useState, useTransition } from "react";
import { createCanteen, updateCanteen } from "@/db/actions/Admin";
import {
  Plus,
  MapPin,
  Clock,
  Users,
  ToggleLeft,
  ToggleRight,
  UtensilsCrossed,
  AlertCircle,
} from "lucide-react";

export function CanteenClient({ canteens }: { canteens: any[] }) {
  const [isPending, startTransition] = useTransition();
  const [showAdd, setShowAdd] = useState(false);
  // operatingHours is a single varchar — store as one string e.g. "07:00 - 15:00"
  const [form, setForm] = useState({
    name: "",
    location: "",
    operatingHours: "",
  });
  const [error, setError] = useState("");

  const inputStyle = {
    background: "var(--bg-secondary)",
    border: "1px solid var(--border-input)",
    borderRadius: 8,
    color: "var(--text-primary)",
    fontSize: 14,
    padding: "9px 12px",
    width: "100%",
    outline: "none",
    fontFamily: "inherit",
  } as React.CSSProperties;

  const handleCreate = () => {
    if (!form.name.trim()) {
      setError("Canteen name is required.");
      return;
    }
    setError("");
    startTransition(async () => {
      await createCanteen({
        name: form.name.trim(),
        location: form.location.trim() || undefined,
        operatingHours: form.operatingHours.trim() || undefined,
      });
      setForm({ name: "", location: "", operatingHours: "" });
      setShowAdd(false);
    });
  };

  const toggleActive = (id: string, current: boolean) => {
    startTransition(async () => {
      await updateCanteen(id, { isActive: !current });
    });
  };

  return (
    <div className="space-y-4">
      <div className="flex justify-end">
        <button
          onClick={() => setShowAdd(true)}
          className="flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium"
          style={{
            background: "var(--accent)",
            color: "var(--accent-text)",
            boxShadow: "var(--shadow-btn)",
          }}
        >
          <Plus size={15} /> Add Canteen
        </button>
      </div>

      {showAdd && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div
            className="absolute inset-0"
            style={{ background: "rgba(0,0,0,0.5)" }}
            onClick={() => {
              setShowAdd(false);
              setError("");
            }}
          />
          <div
            className="relative w-full max-w-md rounded-2xl p-6 z-10"
            style={{
              background: "var(--bg-card)",
              border: "1px solid var(--border-card)",
              boxShadow: "var(--shadow-card)",
            }}
          >
            <h2
              className="text-lg font-semibold mb-5"
              style={{ color: "var(--text-primary)" }}
            >
              New Canteen
            </h2>
            {error && (
              <div
                className="flex items-center gap-2 p-3 rounded-lg mb-3 text-sm"
                style={{ background: "rgba(239,68,68,0.1)", color: "#ef4444" }}
              >
                <AlertCircle size={14} /> {error}
              </div>
            )}
            <div className="space-y-3">
              <div>
                <label
                  className="block text-xs font-medium mb-1.5"
                  style={{ color: "var(--text-secondary)" }}
                >
                  Name *
                </label>
                <input
                  value={form.name}
                  onChange={(e) => setForm({ ...form, name: e.target.value })}
                  placeholder="e.g. Main Canteen"
                  style={inputStyle}
                />
              </div>
              <div>
                <label
                  className="block text-xs font-medium mb-1.5"
                  style={{ color: "var(--text-secondary)" }}
                >
                  Location
                </label>
                <input
                  value={form.location}
                  onChange={(e) =>
                    setForm({ ...form, location: e.target.value })
                  }
                  placeholder="e.g. Block A, Ground Floor"
                  style={inputStyle}
                />
              </div>
              <div>
                <label
                  className="block text-xs font-medium mb-1.5"
                  style={{ color: "var(--text-secondary)" }}
                >
                  Operating Hours
                </label>
                <input
                  value={form.operatingHours}
                  onChange={(e) =>
                    setForm({ ...form, operatingHours: e.target.value })
                  }
                  placeholder="e.g. 07:00 AM – 03:00 PM"
                  style={inputStyle}
                />
              </div>
            </div>
            <div className="flex gap-2 mt-5">
              <button
                onClick={() => {
                  setShowAdd(false);
                  setError("");
                }}
                className="flex-1 py-2 rounded-lg text-sm font-medium"
                style={{
                  background: "var(--bg-tertiary)",
                  color: "var(--text-secondary)",
                  border: "1px solid var(--border-input)",
                }}
              >
                Cancel
              </button>
              <button
                onClick={handleCreate}
                disabled={isPending}
                className="flex-1 py-2 rounded-lg text-sm font-medium disabled:opacity-50"
                style={{
                  background: "var(--accent)",
                  color: "var(--accent-text)",
                }}
              >
                {isPending ? "Creating..." : "Create"}
              </button>
            </div>
          </div>
        </div>
      )}

      {canteens.length === 0 ?
        <div
          className="rounded-xl border py-16 text-center"
          style={{
            background: "var(--bg-card)",
            borderColor: "var(--border-card)",
          }}
        >
          <UtensilsCrossed
            size={32}
            className="mx-auto mb-3"
            style={{ color: "var(--text-muted)" }}
          />
          <p className="text-sm" style={{ color: "var(--text-muted)" }}>
            No canteens yet. Add your first canteen.
          </p>
        </div>
      : <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
          {canteens.map((canteen) => (
            <div
              key={canteen.id}
              className="rounded-xl border p-5"
              style={{
                background: "var(--bg-card)",
                borderColor: "var(--border-card)",
                boxShadow: "var(--shadow-card)",
              }}
            >
              <div className="flex items-start justify-between mb-4">
                <div>
                  <div className="flex items-center gap-2">
                    <h3
                      className="font-semibold"
                      style={{ color: "var(--text-primary)" }}
                    >
                      {canteen.name}
                    </h3>
                    <span
                      className="px-2 py-0.5 rounded-full text-xs font-medium"
                      style={
                        canteen.isActive ?
                          {
                            background: "rgba(34,197,94,0.12)",
                            color: "#22c55e",
                          }
                        : {
                            background: "var(--bg-tertiary)",
                            color: "var(--text-muted)",
                          }
                      }
                    >
                      {canteen.isActive ? "Active" : "Inactive"}
                    </span>
                  </div>
                  {canteen.location && (
                    <div className="flex items-center gap-1.5 mt-1">
                      <MapPin
                        size={12}
                        style={{ color: "var(--text-muted)" }}
                      />
                      <span
                        className="text-xs"
                        style={{ color: "var(--text-secondary)" }}
                      >
                        {canteen.location}
                      </span>
                    </div>
                  )}
                </div>
                <button
                  onClick={() => toggleActive(canteen.id, canteen.isActive)}
                  disabled={isPending}
                  className="text-sm disabled:opacity-50"
                >
                  {canteen.isActive ?
                    <ToggleRight size={24} style={{ color: "#22c55e" }} />
                  : <ToggleLeft
                      size={24}
                      style={{ color: "var(--text-muted)" }}
                    />
                  }
                </button>
              </div>

              {canteen.operatingHours && (
                <div className="flex items-center gap-1.5 mb-4">
                  <Clock size={12} style={{ color: "var(--text-muted)" }} />
                  <span
                    className="text-xs"
                    style={{ color: "var(--text-secondary)" }}
                  >
                    {canteen.operatingHours}
                  </span>
                </div>
              )}

              <div
                style={{
                  borderTop: "1px solid var(--border-primary)",
                  paddingTop: 12,
                }}
              >
                <div className="flex items-center gap-1.5 mb-2">
                  <Users size={12} style={{ color: "var(--text-muted)" }} />
                  <span
                    className="text-xs font-medium"
                    style={{ color: "var(--text-secondary)" }}
                  >
                    Staff ({canteen.staffAssignments?.length ?? 0})
                  </span>
                </div>
                {canteen.staffAssignments?.length > 0 ?
                  <div className="space-y-1">
                    {canteen.staffAssignments.map((a: any) => (
                      <div key={a.staffId} className="flex items-center gap-2">
                        <div
                          className="w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold"
                          style={{
                            background: "var(--bg-tertiary)",
                            color: "var(--text-secondary)",
                          }}
                        >
                          {a.staff?.name?.[0]?.toUpperCase()}
                        </div>
                        <span
                          className="text-xs"
                          style={{ color: "var(--text-secondary)" }}
                        >
                          {a.staff?.name}
                        </span>
                      </div>
                    ))}
                  </div>
                : <p className="text-xs" style={{ color: "var(--text-muted)" }}>
                    No staff assigned. Go to Staff page to assign.
                  </p>
                }
              </div>
            </div>
          ))}
        </div>
      }
    </div>
  );
}
