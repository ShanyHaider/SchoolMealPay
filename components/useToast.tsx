"use client";

import { useState, useCallback, useRef, useEffect } from "react";
import { CheckCircle2, XCircle, AlertCircle, X } from "lucide-react";

// ─── Types ────────────────────────────────────────────────────────────────────

type ToastType = "success" | "error" | "warning";

interface Toast {
  id: string;
  type: ToastType;
  message: string;
}

// ─── Hook ─────────────────────────────────────────────────────────────────────

export function useToast() {
  const [toasts, setToasts] = useState<Toast[]>([]);
  const counterRef = useRef(0);

  const toast = useCallback((message: string, type: ToastType = "success") => {
    const id = `toast-${++counterRef.current}`;
    setToasts((prev) => [...prev, { id, type, message }]);
  }, []);

  const dismiss = useCallback((id: string) => {
    setToasts((prev) => prev.filter((t) => t.id !== id));
  }, []);

  return { toasts, toast, dismiss };
}

// ─── Single Toast Item ────────────────────────────────────────────────────────

const ICONS: Record<ToastType, React.ReactNode> = {
  success: <CheckCircle2 size={15} className="shrink-0 text-emerald-400" />,
  error: <XCircle size={15} className="shrink-0 text-red-400" />,
  warning: <AlertCircle size={15} className="shrink-0 text-amber-400" />,
};

const BAR_COLOR: Record<ToastType, string> = {
  success: "#34d399",
  error: "#f87171",
  warning: "#fbbf24",
};

const DURATION = 3500; // ms

function ToastItem({
  toast,
  onDismiss,
}: {
  toast: Toast;
  onDismiss: (id: string) => void;
}) {
  const [visible, setVisible] = useState(false);
  const [leaving, setLeaving] = useState(false);

  // Trigger enter animation on mount
  useEffect(() => {
    const t = requestAnimationFrame(() => setVisible(true));
    return () => cancelAnimationFrame(t);
  }, []);

  // Auto-dismiss
  useEffect(() => {
    const timer = setTimeout(() => handleDismiss(), DURATION);
    return () => clearTimeout(timer);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const handleDismiss = () => {
    setLeaving(true);
    setTimeout(() => onDismiss(toast.id), 280);
  };

  return (
    <div
      role="alert"
      aria-live="polite"
      onClick={handleDismiss}
      style={{
        transform:
          visible && !leaving ? "translateX(0)" : (
            "translateX(calc(100% + 16px))"
          ),
        opacity: visible && !leaving ? 1 : 0,
        transition:
          "transform 0.28s cubic-bezier(0.34,1.56,0.64,1), opacity 0.28s ease",
        background: "var(--bg-card)",
        borderColor: "var(--border-card)",
        boxShadow: "0 4px 24px rgba(0,0,0,0.18), 0 1px 4px rgba(0,0,0,0.12)",
        overflow: "hidden",
        cursor: "pointer",
        userSelect: "none",
      }}
      className="relative flex items-start gap-2.5 rounded-xl border px-3.5 py-3 pr-8 min-w-[220px] max-w-[320px]"
    >
      {/* Coloured left bar */}
      <span
        className="absolute left-0 inset-y-0 w-[3px] rounded-l-xl"
        style={{ background: BAR_COLOR[toast.type] }}
      />

      {ICONS[toast.type]}

      <p
        className="text-xs leading-snug"
        style={{ color: "var(--text-primary)" }}
      >
        {toast.message}
      </p>

      <button
        onClick={(e) => {
          e.stopPropagation();
          handleDismiss();
        }}
        className="absolute right-2.5 top-2.5 rounded p-0.5 transition-colors hover:bg-(--bg-tertiary)"
        aria-label="Dismiss"
      >
        <X size={11} style={{ color: "var(--text-muted)" }} />
      </button>

      {/* Progress bar */}
      <span
        className="absolute bottom-0 left-0 h-[2px] rounded-b-xl"
        style={{
          background: BAR_COLOR[toast.type],
          opacity: 0.35,
          width: "100%",
          animation: `toast-shrink ${DURATION}ms linear forwards`,
        }}
      />
    </div>
  );
}

// ─── Container ────────────────────────────────────────────────────────────────

interface ToastContainerProps {
  toasts: Toast[];
  dismiss: (id: string) => void;
}

export function ToastContainer({ toasts, dismiss }: ToastContainerProps) {
  return (
    <>
      {/* Keyframe injected once */}
      <style>{`
                @keyframes toast-shrink {
                    from { transform: scaleX(1); transform-origin: left; }
                    to   { transform: scaleX(0); transform-origin: left; }
                }
            `}</style>

      <div
        aria-label="Notifications"
        className="fixed bottom-5 right-5 z-[9999] flex flex-col gap-2 items-end pointer-events-none"
      >
        {toasts.map((t) => (
          <div key={t.id} className="pointer-events-auto">
            <ToastItem toast={t} onDismiss={dismiss} />
          </div>
        ))}
      </div>
    </>
  );
}
