// components/staff/StaffTable.tsx
"use client";

import { useState } from "react";
import { UserCog, MapPin, X, Loader2, Mail } from "lucide-react";
import { StaffStatusBadge, type StaffStatus } from "./StaffStatusBadge";
import { RowActionsMenu } from "./RowActionsMenu";

export type StaffMember = {
  id: string;
  name: string;
  email: string;
  status?: StaffStatus;
  canteenStaffAssignment?: { canteen: { id: string; name: string } } | null;
};

type Canteen = { id: string; name: string };

interface StaffTableProps {
  staff: StaffMember[];
  canteens: Canteen[];
  assignPendingId: string | null;
  actionsPending: boolean;
  onAssign: (staffId: string, canteenId: string) => void;
  onRemoveAssignment: (member: StaffMember) => void;
  onToggleDisable: (member: StaffMember) => void;
  onDelete: (member: StaffMember) => void;
}

export function StaffTable({
  staff,
  canteens,
  assignPendingId,
  actionsPending,
  onAssign,
  onRemoveAssignment,
  onToggleDisable,
  onDelete,
}: StaffTableProps) {
  if (staff.length === 0) {
    return (
      <div
        className="rounded-xl border"
        style={{
          background: "var(--bg-card)",
          borderColor: "var(--border-card)",
          boxShadow: "var(--shadow-card)",
        }}
      >
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
            No active staff yet
          </p>
          <p className="text-xs" style={{ color: "var(--text-muted)" }}>
            Invite staff members using the button above.
          </p>
        </div>
      </div>
    );
  }

  return (
    <div
      className="rounded-xl border overflow-hidden"
      style={{
        background: "var(--bg-card)",
        borderColor: "var(--border-card)",
        boxShadow: "var(--shadow-card)",
      }}
    >
      {/* ── Desktop table (md+) ── */}
      <div className="hidden md:block overflow-x-auto">
        <table className="w-full text-sm">
          <thead>
            <tr style={{ borderBottom: "1px solid var(--border-primary)" }}>
              {["Staff Member", "Email", "Status", "Canteen", "Actions"].map(
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
            {staff.map((member, i) => (
              <StaffRow
                key={member.id}
                member={member}
                canteens={canteens}
                isLast={i === staff.length - 1}
                isAssignPending={assignPendingId === member.id}
                actionsPending={actionsPending}
                onAssign={onAssign}
                onRemoveAssignment={() => onRemoveAssignment(member)}
                onToggleDisable={() => onToggleDisable(member)}
                onDelete={() => onDelete(member)}
              />
            ))}
          </tbody>
        </table>
      </div>

      {/* ── Mobile card list (< md) ── */}
      <div
        className="md:hidden divide-y"
        style={{ borderColor: "var(--border-primary)" }}
      >
        {staff.map((member) => (
          <StaffMobileCard
            key={member.id}
            member={member}
            canteens={canteens}
            isAssignPending={assignPendingId === member.id}
            actionsPending={actionsPending}
            onAssign={onAssign}
            onRemoveAssignment={() => onRemoveAssignment(member)}
            onToggleDisable={() => onToggleDisable(member)}
            onDelete={() => onDelete(member)}
          />
        ))}
      </div>
    </div>
  );
}

// ─── Mobile card ──────────────────────────────────────────────────────────────

interface StaffMobileCardProps {
  member: StaffMember;
  canteens: Canteen[];
  isAssignPending: boolean;
  actionsPending: boolean;
  onAssign: (staffId: string, canteenId: string) => void;
  onRemoveAssignment: () => void;
  onToggleDisable: () => void;
  onDelete: () => void;
}

function StaffMobileCard({
  member,
  canteens,
  isAssignPending,
  actionsPending,
  onAssign,
  onRemoveAssignment,
  onToggleDisable,
  onDelete,
}: StaffMobileCardProps) {
  const [showAssignUI, setShowAssignUI] = useState(false);
  const [selectedCanteenId, setSelectedCanteenId] = useState("");

  const assignment = member.canteenStaffAssignment;
  const status: StaffStatus = member.status ?? "active";

  const handleAssign = () => {
    if (!selectedCanteenId) return;
    onAssign(member.id, selectedCanteenId);
    setShowAssignUI(false);
    setSelectedCanteenId("");
  };

  return (
    <div
      className="px-4 py-4 flex gap-3"
      style={{ opacity: status === "disabled" ? 0.65 : 1 }}
    >
      {/* Avatar */}
      <div
        className="w-9 h-9 rounded-full flex items-center justify-center text-sm font-bold flex-shrink-0 mt-0.5"
        style={{
          background: "var(--bg-tertiary)",
          color: "var(--text-secondary)",
        }}
      >
        {member.name?.[0]?.toUpperCase()}
      </div>

      {/* Content */}
      <div className="flex-1 min-w-0">
        {/* Name + actions row */}
        <div className="flex items-start justify-between gap-2">
          <div className="min-w-0">
            <p
              className="text-sm font-medium truncate"
              style={{ color: "var(--text-primary)" }}
            >
              {member.name}
            </p>
            <p
              className="text-xs flex items-center gap-1 mt-0.5 truncate"
              style={{ color: "var(--text-muted)" }}
            >
              <Mail size={10} className="shrink-0" />
              {member.email}
            </p>
          </div>
          <RowActionsMenu
            member={member}
            disabled={actionsPending}
            onToggleDisable={onToggleDisable}
            onDelete={onDelete}
          />
        </div>

        {/* Status + canteen row */}
        <div className="flex items-center flex-wrap gap-2 mt-2.5">
          <StaffStatusBadge status={status} />

          {assignment ?
            <div
              className="flex items-center gap-1.5 pl-2 pr-1 py-1 rounded-lg text-xs font-medium"
              style={{
                background: "var(--bg-tertiary)",
                border: "1px solid var(--border-input)",
                color: "var(--text-secondary)",
              }}
            >
              <MapPin
                size={10}
                style={{ color: "var(--text-muted)", flexShrink: 0 }}
              />
              <span>{assignment.canteen.name}</span>
              <button
                onClick={onRemoveAssignment}
                disabled={actionsPending}
                className="ml-0.5 flex items-center justify-center w-4 h-4 rounded hover:bg-(--bg-secondary) transition-colors disabled:opacity-40"
                style={{ color: "var(--text-muted)" }}
              >
                <X size={10} />
              </button>
            </div>
          : showAssignUI ?
            <div className="flex items-center gap-2 flex-wrap">
              <select
                value={selectedCanteenId}
                onChange={(e) => setSelectedCanteenId(e.target.value)}
                autoFocus
                className="text-xs rounded-lg px-2 py-1.5"
                style={{
                  background: "var(--bg-secondary)",
                  border: "1px solid var(--border-input)",
                  color: "var(--text-primary)",
                  outline: "none",
                  maxWidth: 160,
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
                onClick={handleAssign}
                disabled={isAssignPending || !selectedCanteenId}
                className="px-2.5 py-1.5 rounded-lg text-xs font-medium disabled:opacity-50 flex items-center gap-1"
                style={{
                  background: "var(--accent)",
                  color: "var(--accent-text)",
                }}
              >
                {isAssignPending ?
                  <Loader2 size={11} className="animate-spin" />
                : "Save"}
              </button>
              <button
                onClick={() => {
                  setShowAssignUI(false);
                  setSelectedCanteenId("");
                }}
                className="flex items-center justify-center w-6 h-6 rounded-lg transition-colors hover:bg-(--bg-tertiary)"
                style={{
                  color: "var(--text-muted)",
                  border: "1px solid var(--border-input)",
                }}
              >
                <X size={11} />
              </button>
            </div>
          : <button
              onClick={() => setShowAssignUI(true)}
              disabled={isAssignPending}
              className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg text-xs font-medium disabled:opacity-50 transition-colors hover:bg-(--bg-tertiary)"
              style={{
                background: "transparent",
                color: "var(--text-muted)",
                border: "1px dashed var(--border-input)",
              }}
            >
              <MapPin size={10} />
              Assign canteen
            </button>
          }
        </div>
      </div>
    </div>
  );
}

// ─── Desktop StaffRow (unchanged) ─────────────────────────────────────────────

interface StaffRowProps {
  member: StaffMember;
  canteens: Canteen[];
  isLast: boolean;
  isAssignPending: boolean;
  actionsPending: boolean;
  onAssign: (staffId: string, canteenId: string) => void;
  onRemoveAssignment: () => void;
  onToggleDisable: () => void;
  onDelete: () => void;
}

function StaffRow({
  member,
  canteens,
  isLast,
  isAssignPending,
  actionsPending,
  onAssign,
  onRemoveAssignment,
  onToggleDisable,
  onDelete,
}: StaffRowProps) {
  const [showAssignUI, setShowAssignUI] = useState(false);
  const [selectedCanteenId, setSelectedCanteenId] = useState("");

  const assignment = member.canteenStaffAssignment;
  const status: StaffStatus = member.status ?? "active";

  const handleAssign = () => {
    if (!selectedCanteenId) return;
    onAssign(member.id, selectedCanteenId);
    setShowAssignUI(false);
    setSelectedCanteenId("");
  };

  return (
    <tr
      className="transition-colors hover:bg-(--bg-secondary)"
      style={{
        borderBottom: isLast ? undefined : "1px solid var(--border-primary)",
        opacity: status === "disabled" ? 0.65 : 1,
      }}
    >
      {/* Name */}
      <td className="px-5 py-3.5">
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
            className="font-medium text-sm"
            style={{ color: "var(--text-primary)" }}
          >
            {member.name}
          </span>
        </div>
      </td>

      {/* Email */}
      <td
        className="px-5 py-3.5 text-xs"
        style={{ color: "var(--text-secondary)" }}
      >
        {member.email}
      </td>

      {/* Status */}
      <td className="px-5 py-3.5">
        <StaffStatusBadge status={status} />
      </td>

      {/* Canteen */}
      <td className="px-5 py-3.5">
        {assignment ?
          <div className="flex items-center gap-1.5">
            <div
              className="flex items-center gap-1.5 pl-2 pr-1 py-1 rounded-lg text-xs font-medium"
              style={{
                background: "var(--bg-tertiary)",
                border: "1px solid var(--border-input)",
                color: "var(--text-secondary)",
              }}
            >
              <MapPin
                size={11}
                style={{ color: "var(--text-muted)", flexShrink: 0 }}
              />
              <span>{assignment.canteen.name}</span>
              <button
                onClick={onRemoveAssignment}
                disabled={actionsPending}
                title="Remove assignment"
                className="ml-0.5 flex items-center justify-center w-4 h-4 rounded hover:bg-(--bg-secondary) transition-colors disabled:opacity-40"
                style={{ color: "var(--text-muted)" }}
              >
                <X size={10} />
              </button>
            </div>
          </div>
        : showAssignUI ?
          <div className="flex items-center gap-2">
            <select
              value={selectedCanteenId}
              onChange={(e) => setSelectedCanteenId(e.target.value)}
              autoFocus
              className="text-xs rounded-lg px-2 py-1.5"
              style={{
                background: "var(--bg-secondary)",
                border: "1px solid var(--border-input)",
                color: "var(--text-primary)",
                outline: "none",
                maxWidth: 150,
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
              onClick={handleAssign}
              disabled={isAssignPending || !selectedCanteenId}
              className="px-2.5 py-1.5 rounded-lg text-xs font-medium disabled:opacity-50 flex items-center gap-1"
              style={{
                background: "var(--accent)",
                color: "var(--accent-text)",
              }}
            >
              {isAssignPending ?
                <Loader2 size={11} className="animate-spin" />
              : "Save"}
            </button>
            <button
              onClick={() => {
                setShowAssignUI(false);
                setSelectedCanteenId("");
              }}
              className="flex items-center justify-center w-6 h-6 rounded-lg transition-colors hover:bg-(--bg-tertiary)"
              style={{
                color: "var(--text-muted)",
                border: "1px solid var(--border-input)",
              }}
            >
              <X size={11} />
            </button>
          </div>
        : <button
            onClick={() => setShowAssignUI(true)}
            disabled={isAssignPending}
            className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg text-xs font-medium disabled:opacity-50 transition-colors hover:bg-(--bg-tertiary)"
            style={{
              background: "transparent",
              color: "var(--text-muted)",
              border: "1px dashed var(--border-input)",
            }}
          >
            <MapPin size={11} />
            Assign canteen
          </button>
        }
      </td>

      {/* Actions */}
      <td className="px-5 py-3.5">
        <RowActionsMenu
          member={member}
          disabled={actionsPending}
          onToggleDisable={onToggleDisable}
          onDelete={onDelete}
        />
      </td>
    </tr>
  );
}
