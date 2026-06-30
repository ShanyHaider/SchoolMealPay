// components/staff/RowActionsMenu.tsx
"use client";

import { useState, useRef } from "react";
import { createPortal } from "react-dom";
import { MoreHorizontal, UserX, UserCheck, Trash2 } from "lucide-react";
import type { StaffStatus } from "./StaffStatusBadge";

type StaffMember = {
  id: string;
  name: string;
  email: string;
  status?: StaffStatus;
};

interface RowActionsMenuProps {
  member: StaffMember;
  onToggleDisable: () => void;
  onDelete: () => void;
  disabled: boolean;
}

export function RowActionsMenu({
  member,
  onToggleDisable,
  onDelete,
  disabled: globalDisabled,
}: RowActionsMenuProps) {
  const [open, setOpen] = useState(false);
  const [coords, setCoords] = useState({ top: 0, right: 0 });
  const btnRef = useRef<HTMLButtonElement>(null);

  const isDisabled = member.status === "disabled";

  const handleOpen = () => {
    if (btnRef.current) {
      const rect = btnRef.current.getBoundingClientRect();
      setCoords({
        top: rect.bottom + 6,
        right: window.innerWidth - rect.right,
      });
    }
    setOpen((v) => !v);
  };

  const close = () => setOpen(false);

  return (
    <div>
      <button
        ref={btnRef}
        onClick={handleOpen}
        disabled={globalDisabled}
        aria-label="Staff actions"
        className="flex items-center justify-center w-8 h-8 rounded-lg transition-colors disabled:opacity-40"
        style={{
          background: open ? "var(--bg-tertiary)" : "transparent",
          border: "1px solid var(--border-input)",
          color: "var(--text-secondary)",
          cursor: "pointer",
        }}
      >
        <MoreHorizontal size={15} />
      </button>

      {open &&
        createPortal(
          <>
            <div className="fixed inset-0 z-60" onClick={close} />
            <div
              role="menu"
              className="fixed z-61 w-48 rounded-xl py-1.5 border"
              style={{
                top: coords.top,
                right: coords.right,
                background: "var(--bg-card)",
                borderColor: "var(--border-card)",
                boxShadow:
                  "0 8px 24px rgba(0,0,0,0.12), 0 2px 8px rgba(0,0,0,0.08)",
              }}
            >
              {/* Disable / Enable */}
              <button
                role="menuitem"
                onClick={() => {
                  close();
                  onToggleDisable();
                }}
                className="flex items-center gap-2.5 w-full px-3 py-2.5 text-xs transition-colors hover:bg-(--bg-secondary)"
                style={{ color: isDisabled ? "#34d399" : "#f59e0b" }}
              >
                <span
                  className="flex items-center justify-center w-6 h-6 rounded-md flex-shrink-0"
                  style={{
                    background:
                      isDisabled ?
                        "rgba(52,211,153,0.12)"
                      : "rgba(245,158,11,0.12)",
                  }}
                >
                  {isDisabled ?
                    <UserCheck size={12} />
                  : <UserX size={12} />}
                </span>
                {isDisabled ? "Enable access" : "Disable staff"}
              </button>

              <div
                className="mx-3 my-1 border-t"
                style={{ borderColor: "var(--border-primary)" }}
              />

              {/* Delete */}
              <button
                role="menuitem"
                onClick={() => {
                  close();
                  onDelete();
                }}
                className="flex items-center gap-2.5 w-full px-3 py-2.5 text-xs transition-colors hover:bg-(--bg-secondary)"
                style={{ color: "#ef4444" }}
              >
                <span
                  className="flex items-center justify-center w-6 h-6 rounded-md flex-shrink-0"
                  style={{ background: "rgba(239,68,68,0.10)" }}
                >
                  <Trash2 size={12} />
                </span>
                Delete staff member
              </button>
            </div>
          </>,
          document.body,
        )}
    </div>
  );
}
