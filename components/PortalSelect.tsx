// components/PortalSelect.tsx
"use client";

import { Check, ChevronDown } from "lucide-react";
import { useState, useRef } from "react";
import { createPortal } from "react-dom";

// ─── Core types ───────────────────────────────────────────────────────────────

export interface SelectOption {
  value: string;
  label: string;
  sublabel?: string; // second line below label (e.g. "Section A")
  icon?: React.ReactNode; // leading icon inside the option row
}

export interface PortalSelectProps {
  options: SelectOption[];
  value?: string | null;
  onChange: (value: string | undefined) => void;

  placeholder?: string; // shown when nothing is selected
  label?: string; // field label above the trigger
  hint?: string; // e.g. "(optional)" shown after label
  error?: string; // red error text below

  /** Icon shown inside the trigger button (left side) */
  triggerIcon?: React.ReactNode;

  /** If true, a "none" option is prepended with this label */
  noneLabel?: string;

  disabled?: boolean;

  /** compact = tighter padding, smaller text — for use inside table cells */
  compact?: boolean;
}

// ─── Component ────────────────────────────────────────────────────────────────

export function PortalSelect({
  options,
  value,
  onChange,
  placeholder = "Select…",
  label,
  hint,
  error,
  triggerIcon,
  noneLabel,
  disabled = false,
  compact = false,
}: PortalSelectProps) {
  const [open, setOpen] = useState(false);
  const btnRef = useRef<HTMLButtonElement>(null);
  const [coords, setCoords] = useState<{
    top?: number;
    bottom?: number;
    left: number;
    width: number;
  }>({ left: 0, width: 0 });

  const selected = options.find((o) => o.value === value);
  const allOptions: SelectOption[] =
    noneLabel ? [{ value: "__none__", label: noneLabel }, ...options] : options;

  // Estimate dropdown height for flip logic
  const dropdownH = Math.min(allOptions.length * 44 + 8, 240);

  const handleOpen = () => {
    if (disabled) return;
    if (open) {
      setOpen(false);
      return;
    }
    if (btnRef.current) {
      const rect = btnRef.current.getBoundingClientRect();
      const spaceBelow = window.innerHeight - rect.bottom;
      if (spaceBelow >= dropdownH + 8) {
        setCoords({
          top: rect.bottom + 6,
          bottom: undefined,
          left: rect.left,
          width: rect.width,
        });
      } else {
        setCoords({
          top: undefined,
          bottom: window.innerHeight - rect.top + 6,
          left: rect.left,
          width: rect.width,
        });
      }
    }
    setOpen(true);
  };

  const handleSelect = (val: string) => {
    onChange(val === "__none__" ? undefined : val);
    setOpen(false);
  };

  const py = compact ? "py-1.5" : "py-2.5";
  const px = compact ? "px-2" : "px-3";
  const textSize = compact ? "text-xs" : "text-sm";

  return (
    <div>
      {/* Label */}
      {label && (
        <label
          className="mb-1.5 block text-xs font-medium"
          style={{ color: "var(--text-secondary)" }}
        >
          {label}
          {hint && (
            <span
              className="ml-1 font-normal"
              style={{ color: "var(--text-muted)" }}
            >
              {hint}
            </span>
          )}
        </label>
      )}

      {/* Trigger */}
      <button
        ref={btnRef}
        type="button"
        onClick={handleOpen}
        disabled={disabled}
        className={`flex w-full items-center justify-between rounded-xl border ${px} ${py} text-left transition-colors disabled:opacity-50`}
        style={{
          borderColor:
            error ? "rgb(239 68 68)"
            : open ? "var(--accent)"
            : "var(--border-input)",
          background: "var(--bg-secondary)",
          outline: "none",
        }}
      >
        <div className={`flex items-center gap-2.5 min-w-0 ${textSize}`}>
          {/* Leading icon container */}
          {triggerIcon && (
            <div
              className="flex h-7 w-7 shrink-0 items-center justify-center rounded-lg"
              style={{ background: "var(--bg-tertiary)" }}
            >
              <span
                style={{
                  color: selected ? "var(--accent)" : "var(--text-muted)",
                }}
              >
                {triggerIcon}
              </span>
            </div>
          )}
          <p
            className="truncate"
            style={{
              color: selected ? "var(--text-primary)" : "var(--text-muted)",
              fontWeight: selected ? 500 : 400,
            }}
          >
            {selected ?
              selected.sublabel ?
                `${selected.label} — ${selected.sublabel}`
              : selected.label
            : placeholder}
          </p>
        </div>
        <ChevronDown
          size={14}
          className={`shrink-0 transition-transform duration-200 ${open ? "rotate-180" : ""}`}
          style={{ color: "var(--text-muted)" }}
        />
      </button>

      {/* Portal dropdown */}
      {open &&
        createPortal(
          <>
            <div
              className="fixed inset-0 z-40"
              onClick={() => setOpen(false)}
            />
            <div
              className="fixed z-50 overflow-hidden rounded-xl border"
              style={{
                top: coords.top,
                bottom: coords.bottom,
                left: coords.left,
                width: coords.width,
                background: "var(--bg-card)",
                borderColor: "var(--border-card)",
                boxShadow:
                  "0 8px 24px rgba(0,0,0,0.14), 0 2px 8px rgba(0,0,0,0.08)",
                maxHeight: dropdownH,
                overflowY: "auto",
              }}
            >
              {allOptions.map((opt, i) => {
                const isNone = opt.value === "__none__";
                const isSelected = isNone ? !value : value === opt.value;
                return (
                  <button
                    key={opt.value}
                    type="button"
                    onClick={() => handleSelect(opt.value)}
                    className="flex w-full items-center justify-between px-3 py-2.5 text-left transition-colors hover:bg-(--bg-secondary)"
                    style={{
                      background:
                        isSelected ? "var(--bg-secondary)" : undefined,
                      borderTop:
                        (
                          i > 0 &&
                          isNone === false &&
                          allOptions[i - 1]?.value === "__none__"
                        ) ?
                          "1px solid var(--border-primary)"
                        : undefined,
                    }}
                  >
                    <div className="flex items-center gap-2.5 min-w-0">
                      {opt.icon && (
                        <span
                          style={{
                            color:
                              isSelected ? "var(--accent)" : (
                                "var(--text-muted)"
                              ),
                          }}
                        >
                          {opt.icon}
                        </span>
                      )}
                      <div className="min-w-0">
                        <p
                          className="text-sm truncate"
                          style={{
                            color:
                              isSelected ? "var(--text-primary)"
                              : isNone ? "var(--text-muted)"
                              : "var(--text-secondary)",
                            fontWeight: isSelected ? 500 : 400,
                          }}
                        >
                          {opt.label}
                        </p>
                        {opt.sublabel && (
                          <p
                            className="text-xs"
                            style={{ color: "var(--text-muted)" }}
                          >
                            {opt.sublabel}
                          </p>
                        )}
                      </div>
                    </div>
                    {isSelected && (
                      <Check
                        size={14}
                        style={{ color: "var(--accent)" }}
                        className="shrink-0"
                      />
                    )}
                  </button>
                );
              })}
            </div>
          </>,
          document.body,
        )}

      {error && <p className="mt-1 text-xs text-red-500">{error}</p>}
    </div>
  );
}
