"use client";

import { useState, useRef, useEffect, useTransition, useCallback } from "react";
import { verifyAndCollectQr } from "@/db/actions/Staff";
import {
  QrCode,
  Camera,
  Keyboard,
  CheckCircle2,
  XCircle,
  RefreshCw,
  AlertTriangle,
  User,
  Package,
  Search,
} from "lucide-react";
import { verifyQrCodeSchema } from "@/lib/validations/actions";

type ScanResult =
  | { success: true; order: any }
  | { success: false; error: string }
  | null;

const ALLERGEN_COLORS: Record<string, string> = {
  nuts: "#f59e0b",
  gluten: "#f97316",
  dairy: "#3b82f6",
  eggs: "#eab308",
  soy: "#84cc16",
  shellfish: "#06b6d4",
  fish: "#6366f1",
};

// ─── Success card ─────────────────────────────────────────────────
function SuccessCard({ order, onReset }: { order: any; onReset: () => void }) {
  const allergens = order.student?.allergens ?? [];
  const itemCount =
    order.orderItems?.reduce((s: number, i: any) => s + (i.quantity ?? 1), 0) ??
    0;

  return (
    <div
      className="rounded-2xl border-2 p-6 animate-in fade-in duration-300 max-w-md mx-auto"
      style={{
        background: "var(--bg-card)",
        borderColor: "rgba(34,197,94,0.4)",
        boxShadow: "0 0 0 4px rgba(34,197,94,0.08)",
      }}
    >
      <div
        className="flex items-center gap-3 px-4 py-3 rounded-xl mb-5"
        style={{ background: "rgba(34,197,94,0.1)" }}
      >
        <CheckCircle2 size={22} style={{ color: "#22c55e", flexShrink: 0 }} />
        <div>
          <p className="text-sm font-bold" style={{ color: "#22c55e" }}>
            Meal Collected ✓
          </p>
          <p className="text-xs" style={{ color: "rgba(34,197,94,0.8)" }}>
            QR code verified and marked as collected
          </p>
        </div>
      </div>

      <div className="flex items-center gap-4 mb-5">
        <div
          className="w-14 h-14 rounded-full flex items-center justify-center text-xl font-bold flex-shrink-0"
          style={{
            background: "var(--bg-tertiary)",
            color: "var(--text-secondary)",
          }}
        >
          {order.student?.name?.[0]?.toUpperCase() ?? "?"}
        </div>
        <div>
          <p
            className="text-lg font-bold"
            style={{ color: "var(--text-primary)" }}
          >
            {order.student?.name ?? "Unknown"}
          </p>
          <p
            className="text-sm font-mono mt-0.5"
            style={{ color: "var(--text-muted)" }}
          >
            #{order.student?.studentCode}
          </p>
        </div>
      </div>

      {allergens.length > 0 && (
        <div
          className="flex items-start gap-3 px-4 py-3 rounded-xl mb-4"
          style={{
            background: "rgba(239,68,68,0.08)",
            border: "1px solid rgba(239,68,68,0.2)",
          }}
        >
          <AlertTriangle
            size={16}
            style={{ color: "#ef4444", flexShrink: 0, marginTop: 1 }}
          />
          <div>
            <p
              className="text-xs font-semibold mb-1"
              style={{ color: "#ef4444" }}
            >
              Allergen Alert
            </p>
            <div className="flex flex-wrap gap-1.5">
              {allergens.map((a: any) => (
                <span
                  key={a.allergen}
                  className="px-2 py-0.5 rounded-full text-xs font-medium capitalize"
                  style={{
                    background: `${ALLERGEN_COLORS[a.allergen] ?? "#6b7280"}20`,
                    color: ALLERGEN_COLORS[a.allergen] ?? "#6b7280",
                  }}
                >
                  {a.allergen}
                </span>
              ))}
            </div>
          </div>
        </div>
      )}

      <div
        className="rounded-xl p-4 mb-5"
        style={{ background: "var(--bg-secondary)" }}
      >
        <div className="flex items-center gap-2 mb-3">
          <Package size={14} style={{ color: "var(--text-muted)" }} />
          <p
            className="text-xs font-semibold"
            style={{ color: "var(--text-secondary)" }}
          >
            {itemCount} item{itemCount !== 1 ? "s" : ""} · Rs.{" "}
            {parseFloat(order.totalAmount ?? "0").toFixed(0)}
          </p>
        </div>
        <div className="space-y-2">
          {order.orderItems?.map((oi: any) => (
            <div key={oi.id} className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <span
                  className="w-5 h-5 rounded flex items-center justify-center text-xs font-bold"
                  style={{
                    background: "var(--bg-tertiary)",
                    color: "var(--text-secondary)",
                  }}
                >
                  {oi.quantity}
                </span>
                <span
                  className="text-sm"
                  style={{ color: "var(--text-secondary)" }}
                >
                  {oi.menuItem?.name ?? "Item"}
                </span>
              </div>
              <span className="text-xs" style={{ color: "var(--text-muted)" }}>
                Rs.{" "}
                {(parseFloat(oi.unitPrice ?? "0") * (oi.quantity ?? 1)).toFixed(
                  0,
                )}
              </span>
            </div>
          ))}
        </div>
      </div>

      <button
        onClick={onReset}
        className="w-full flex items-center justify-center gap-2 py-3 rounded-xl text-sm font-semibold transition-all hover:scale-[1.01]"
        style={{ background: "var(--accent)", color: "var(--accent-text)" }}
      >
        <QrCode size={16} />
        Scan Next Student
      </button>
    </div>
  );
}

// ─── Error card ───────────────────────────────────────────────────
function ErrorCard({ error, onReset }: { error: string; onReset: () => void }) {
  return (
    <div
      className="rounded-2xl border-2 p-6 max-w-md mx-auto"
      style={{
        background: "var(--bg-card)",
        borderColor: "rgba(239,68,68,0.4)",
        boxShadow: "0 0 0 4px rgba(239,68,68,0.06)",
      }}
    >
      <div className="flex items-center gap-3 mb-5">
        <XCircle size={28} style={{ color: "#ef4444", flexShrink: 0 }} />
        <div>
          <p className="text-sm font-bold" style={{ color: "#ef4444" }}>
            Verification Failed
          </p>
          <p
            className="text-xs mt-0.5"
            style={{ color: "var(--text-secondary)" }}
          >
            {error}
          </p>
        </div>
      </div>
      <button
        onClick={onReset}
        className="w-full flex items-center justify-center gap-2 py-3 rounded-xl text-sm font-semibold"
        style={{
          background: "var(--bg-secondary)",
          border: "1px solid var(--border-input)",
          color: "var(--text-secondary)",
        }}
      >
        <RefreshCw size={15} />
        Try Again
      </button>
    </div>
  );
}

interface QrScannerClientProps {
  canteenId: string;
  initialOrders?: any[];
}

export function QrScannerClient({ canteenId, initialOrders = [] }: QrScannerClientProps) {
  const [mode, setMode] = useState<"camera" | "manual">("manual");
  const [manualCode, setManualCode] = useState("");
  const [result, setResult] = useState<ScanResult>(null);
  const [isPending, startTransition] = useTransition();
  const inputRef = useRef<HTMLInputElement>(null);
  const videoRef = useRef<HTMLVideoElement>(null);
  const streamRef = useRef<MediaStream | null>(null);

  // Search/feed states
  const [searchQuery, setSearchQuery] = useState("");
  const [feedOrders, setFeedOrders] = useState(initialOrders);

  // Sync feed on parent updates
  useEffect(() => {
    setFeedOrders(initialOrders);
  }, [initialOrders]);

  const reset = useCallback(() => {
    setResult(null);
    setManualCode("");
    setTimeout(() => inputRef.current?.focus(), 100);
  }, []);

  const verify = useCallback(
    (code: string, orderId?: string) => {
      const trimmed = code.trim();
      if (!trimmed) return;

      // 1. Zod validation check
      const payload = {
        orderId: orderId || null,
        verificationToken: trimmed,
      };

      const parseResult = verifyQrCodeSchema.safeParse(payload);
      if (!parseResult.success) {
        setResult({ success: false, error: parseResult.error.issues[0]?.message ?? "Verification token is invalid." });
        return;
      }

      startTransition(async () => {
        const res = await verifyAndCollectQr(trimmed, canteenId);
        setResult(res);
      });
    },
    [canteenId],
  );

  // Camera scanner jsQR effect
  useEffect(() => {
    if (mode !== "camera") return;

    let animFrame: number;
    let jsQR: any;

    const startCamera = async () => {
      try {
        jsQR = (await import("jsqr")).default;
        const stream = await navigator.mediaDevices.getUserMedia({
          video: { facingMode: "environment" },
        });
        streamRef.current = stream;
        if (videoRef.current) {
          videoRef.current.srcObject = stream;
          videoRef.current.play();
        }

        const canvas = document.createElement("canvas");
        const ctx = canvas.getContext("2d");

        const scan = () => {
          if (!videoRef.current || !ctx) return;
          const { videoWidth: w, videoHeight: h } = videoRef.current;
          if (w > 0 && h > 0) {
            canvas.width = w;
            canvas.height = h;
            ctx.drawImage(videoRef.current, 0, 0, w, h);
            const imageData = ctx.getImageData(0, 0, w, h);
            const code = jsQR(imageData.data, w, h);
            if (code?.data) {
              stopCamera();
              verify(code.data);
              return;
            }
          }
          animFrame = requestAnimationFrame(scan);
        };
        animFrame = requestAnimationFrame(scan);
      } catch {
        setMode("manual");
      }
    };

    const stopCamera = () => {
      cancelAnimationFrame(animFrame);
      streamRef.current?.getTracks().forEach((t) => t.stop());
      streamRef.current = null;
    };

    startCamera();
    return () => stopCamera();
  }, [mode, verify]);

  // Auto-focus manual input
  useEffect(() => {
    if (mode === "manual" && !result) {
      setTimeout(() => inputRef.current?.focus(), 50);
    }
  }, [mode, result]);

  if (result?.success) {
    return <SuccessCard order={result.order} onReset={reset} />;
  }
  if (result && !result.success) {
    return <ErrorCard error={result.error} onReset={reset} />;
  }

  // Filter orders that are ready or preparing
  const filteredFeed = feedOrders.filter((o) => {
    const isCollectible = o.status === "ready" || o.status === "preparing";
    if (!isCollectible) return false;

    const matchesSearch =
      o.student?.name?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      o.student?.studentCode?.toLowerCase().includes(searchQuery.toLowerCase());
    return matchesSearch;
  });

  return (
    <div className="grid grid-cols-1 lg:grid-cols-[400px_1fr] gap-8">
      {/* Left Column: QR Scan inputs */}
      <div className="space-y-4">
        <div
          className="flex rounded-lg p-1 gap-1 w-fit"
          style={{ background: "var(--bg-pill)" }}
        >
          {(["camera", "manual"] as const).map((m) => (
            <button
              key={m}
              onClick={() => setMode(m)}
              className="flex items-center gap-2 px-4 py-2 rounded-md text-xs font-bold uppercase tracking-wider transition-all"
              style={{
                background: mode === m ? "var(--bg-primary)" : "transparent",
                color: mode === m ? "var(--text-primary)" : "var(--text-secondary)",
                boxShadow: mode === m ? "var(--shadow-pill)" : undefined,
              }}
            >
              {m === "camera" ? <Camera size={13} /> : <Keyboard size={13} />}
              {m === "camera" ? "Camera Scan" : "Manual Entry"}
            </button>
          ))}
        </div>

        {mode === "camera" ? (
          <div
            className="rounded-2xl border overflow-hidden relative aspect-video"
            style={{
              background: "#000",
              borderColor: "var(--border-card)",
              boxShadow: "var(--shadow-card)",
            }}
          >
            <video
              ref={videoRef}
              className="w-full h-full object-cover"
              muted
              playsInline
            />
            <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
              <div
                className="w-48 h-48 rounded-xl"
                style={{
                  border: "2px solid rgba(255,255,255,0.8)",
                  boxShadow: "0 0 0 9999px rgba(0,0,0,0.5)",
                }}
              />
            </div>
            <div className="absolute bottom-4 left-0 right-0 text-center">
              <span
                className="px-3 py-1.5 rounded-full text-[10px] font-bold uppercase tracking-wider"
                style={{ background: "rgba(0,0,0,0.7)", color: "#fff" }}
              >
                Focus camera on order QR
              </span>
            </div>
          </div>
        ) : (
          <div
            className="rounded-2xl border p-6 space-y-4"
            style={{
              background: "var(--bg-card)",
              borderColor: "var(--border-card)",
              boxShadow: "var(--shadow-card)",
            }}
          >
            <div className="flex justify-center">
              <div className="w-12 h-12 rounded-xl flex items-center justify-center bg-purple-500/10 text-purple-600">
                <QrCode size={24} />
              </div>
            </div>

            <div className="space-y-1.5">
              <label
                className="block text-xs font-bold uppercase tracking-wider text-center"
                style={{ color: "var(--text-secondary)" }}
              >
                Scan/Type QR Token
              </label>
              <input
                ref={inputRef}
                value={manualCode}
                onChange={(e) => setManualCode(e.target.value)}
                onKeyDown={(e) => e.key === "Enter" && verify(manualCode)}
                placeholder="Scan code or type UUID..."
                className="w-full text-center text-sm font-mono py-3 px-4 rounded-xl border border-(--border-input) bg-(--bg-secondary) text-(--text-primary) outline-none"
                autoComplete="off"
                spellCheck={false}
              />
            </div>

            <button
              onClick={() => verify(manualCode)}
              disabled={!manualCode.trim() || isPending}
              className="w-full py-3 rounded-xl text-xs font-bold uppercase tracking-widest bg-black text-white dark:bg-white dark:text-black hover:opacity-90 disabled:opacity-40 transition-all"
            >
              {isPending ? "Verifying..." : "Verify & Collect"}
            </button>
          </div>
        )}

        {isPending && (
          <div className="flex items-center justify-center gap-2 py-2">
            <RefreshCw size={13} className="animate-spin text-(--text-muted)" />
            <span className="text-xs text-(--text-muted) font-medium">Processing scan validation...</span>
          </div>
        )}
      </div>

      {/* Right Column: Live ready order feed */}
      <div
        className="rounded-2xl border p-6 flex flex-col gap-4 shadow-sm"
        style={{
          background: "var(--bg-card)",
          borderColor: "var(--border-card)",
        }}
      >
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-(--border-primary) pb-4">
          <div>
            <h3 className="text-sm font-bold uppercase tracking-widest text-(--text-primary)">
              Ready for Collection Feed
            </h3>
            <p className="text-[10px] text-(--text-secondary) mt-0.5">
              Tap directly on any student record to instantly process verification.
            </p>
          </div>

          {/* Feed Search */}
          <div className="flex items-center gap-2 px-3 py-1.5 rounded-lg border border-(--border-card) bg-(--bg-secondary)">
            <Search size={14} className="text-(--text-muted)" />
            <input
              type="text"
              placeholder="Search student..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="bg-transparent text-xs font-bold text-(--text-primary) outline-none placeholder:text-(--text-muted)"
            />
          </div>
        </div>

        {/* Live List */}
        <div className="space-y-2 max-h-[400px] overflow-y-auto pr-1">
          {filteredFeed.map((order) => {
            const itemCount =
              order.orderItems?.reduce((s: number, i: any) => s + (i.quantity ?? 1), 0) ?? 0;
            return (
              <div
                key={order.id}
                className="flex items-center justify-between p-4 rounded-xl border border-(--border-card) bg-(--bg-card) hover:shadow-xs transition-shadow"
              >
                <div className="min-w-0 flex-1 pr-4">
                  <div className="flex items-center gap-2">
                    <div className="w-6 h-6 rounded-full bg-(--bg-secondary) flex items-center justify-center text-[10px] font-bold text-(--text-primary)">
                      {order.student?.name?.[0]?.toUpperCase() ?? "?"}
                    </div>
                    <p className="text-xs font-bold text-(--text-primary) truncate">
                      {order.student?.name}
                    </p>
                  </div>
                  <p className="text-[10px] text-(--text-muted) font-mono mt-1">
                    Code: #{order.student?.studentCode} · {itemCount} items
                  </p>
                  <p className="text-[9px] text-amber-500 font-bold uppercase mt-0.5">
                    Slot: {order.mealSlot ?? "lunch"} · Status: {order.status}
                  </p>
                </div>

                <button
                  onClick={() => verify(order.qrCode || "", order.id)}
                  disabled={isPending}
                  className="px-3 py-2 bg-zinc-900 text-white dark:bg-zinc-100 dark:text-zinc-900 rounded-lg text-[10px] font-bold uppercase tracking-wider hover:opacity-90 transition-all active:scale-95 disabled:opacity-40"
                >
                  Verify & Collect
                </button>
              </div>
            );
          })}
          {filteredFeed.length === 0 && (
            <div className="text-center py-12 text-(--text-muted) italic text-xs">
              No orders are currently ready or preparing.
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
