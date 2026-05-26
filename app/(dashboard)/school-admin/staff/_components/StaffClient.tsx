"use client";

import { useState, useTransition } from "react";
import {
  assignStaffToCanteen,
  removeStaffAssignment,
} from "@/db/actions/Admin";
import { UserCog, MapPin, X } from "lucide-react";

export function StaffClient({
  staff,
  canteens,
  adminId,
}: {
  staff: any[];
  canteens: any[];
  adminId: string;
}) {
  const [isPending, startTransition] = useTransition();
  const [assigning, setAssigning] = useState<string | null>(null);
  const [selectedCanteen, setSelectedCanteen] = useState<
    Record<string, string>
  >({});

  const handleAssign = (staffId: string) => {
    const canteenId = selectedCanteen[staffId];
    if (!canteenId) return;
    startTransition(async () => {
      await assignStaffToCanteen(staffId, canteenId, adminId); // adminId required by schema
      setAssigning(null);
      setSelectedCanteen((prev) => ({ ...prev, [staffId]: "" }));
    });
  };

  const handleRemove = (staffId: string, canteenId: string) => {
    startTransition(async () => {
      await removeStaffAssignment(staffId, canteenId);
    });
  };

  return (
    <div
      className="rounded-xl border overflow-hidden"
      style={{
        background: "var(--bg-card)",
        borderColor: "var(--border-card)",
        boxShadow: "var(--shadow-card)",
      }}
    >
      {staff.length === 0 ?
        <div className="py-16 text-center">
          <UserCog
            size={32}
            className="mx-auto mb-3"
            style={{ color: "var(--text-muted)" }}
          />
          <p
            className="text-sm font-medium mb-1"
            style={{ color: "var(--text-secondary)" }}
          >
            No canteen staff yet
          </p>
          <p className="text-xs" style={{ color: "var(--text-muted)" }}>
            Users with the &quot;canteen_staff&quot; role will appear here.
          </p>
        </div>
      : <table className="w-full text-sm">
          <thead>
            <tr style={{ borderBottom: "1px solid var(--border-primary)" }}>
              {["Staff Member", "Email", "Assigned Canteen", "Action"].map(
                (h) => (
                  <th
                    key={h}
                    className="px-5 py-3 text-left text-xs font-medium"
                    style={{ color: "var(--text-muted)" }}
                  >
                    {h}
                  </th>
                ),
              )}
            </tr>
          </thead>
          <tbody>
            {staff.map((member, i) => {
              const assignment = member.staffAssignments?.[0];
              const isLast = i === staff.length - 1;

              return (
                <tr
                  key={member.id}
                  className="transition-colors hover:bg-(--bg-secondary)"
                  style={{
                    borderBottom:
                      isLast ? undefined : "1px solid var(--border-primary)",
                  }}
                >
                  <td className="px-5 py-4">
                    <div className="flex items-center gap-3">
                      <div
                        className="w-8 h-8 rounded-full flex items-center justify-center text-sm font-bold flex-shrink-0"
                        style={{
                          background: "var(--bg-tertiary)",
                          color: "var(--text-secondary)",
                        }}
                      >
                        {member.name?.[0]?.toUpperCase()}
                      </div>
                      <span
                        className="font-medium"
                        style={{ color: "var(--text-primary)" }}
                      >
                        {member.name}
                      </span>
                    </div>
                  </td>
                  <td
                    className="px-5 py-4"
                    style={{ color: "var(--text-secondary)" }}
                  >
                    {member.email}
                  </td>
                  <td className="px-5 py-4">
                    {assignment ?
                      <div className="flex items-center gap-1.5">
                        <MapPin
                          size={12}
                          style={{ color: "var(--text-muted)" }}
                        />
                        <span style={{ color: "var(--text-secondary)" }}>
                          {assignment.canteen?.name}
                        </span>
                      </div>
                    : <span style={{ color: "var(--text-muted)" }}>
                        Not assigned
                      </span>
                    }
                  </td>
                  <td className="px-5 py-4">
                    {assignment ?
                      <button
                        onClick={() =>
                          handleRemove(member.id, assignment.canteen.id)
                        }
                        disabled={isPending}
                        className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium disabled:opacity-50"
                        style={{
                          background: "rgba(239,68,68,0.1)",
                          color: "#ef4444",
                          border: "1px solid rgba(239,68,68,0.2)",
                        }}
                      >
                        <X size={12} /> Remove
                      </button>
                    : assigning === member.id ?
                      <div className="flex items-center gap-2">
                        <select
                          value={selectedCanteen[member.id] ?? ""}
                          onChange={(e) =>
                            setSelectedCanteen((p) => ({
                              ...p,
                              [member.id]: e.target.value,
                            }))
                          }
                          className="text-xs rounded-lg px-2 py-1.5"
                          style={{
                            background: "var(--bg-secondary)",
                            border: "1px solid var(--border-input)",
                            color: "var(--text-primary)",
                            outline: "none",
                          }}
                        >
                          <option value="">Select canteen…</option>
                          {canteens.map((c) => (
                            <option key={c.id} value={c.id}>
                              {c.name}
                            </option>
                          ))}
                        </select>
                        <button
                          onClick={() => handleAssign(member.id)}
                          disabled={isPending || !selectedCanteen[member.id]}
                          className="px-3 py-1.5 rounded-lg text-xs font-medium disabled:opacity-50"
                          style={{
                            background: "var(--accent)",
                            color: "var(--accent-text)",
                          }}
                        >
                          Assign
                        </button>
                        <button
                          onClick={() => setAssigning(null)}
                          className="text-xs"
                          style={{ color: "var(--text-muted)" }}
                        >
                          Cancel
                        </button>
                      </div>
                    : <button
                        onClick={() => setAssigning(member.id)}
                        className="px-3 py-1.5 rounded-lg text-xs font-medium"
                        style={{
                          background: "var(--bg-tertiary)",
                          color: "var(--text-secondary)",
                          border: "1px solid var(--border-input)",
                        }}
                      >
                        Assign Canteen
                      </button>
                    }
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      }
    </div>
  );
}
