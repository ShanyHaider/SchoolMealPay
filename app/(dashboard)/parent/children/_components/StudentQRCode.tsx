"use client";

import { useRef, useState } from "react";
import { QRCodeCanvas } from "qrcode.react";
import { Download, Printer, QrCode, X, Shield } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";

interface StudentQRCodeProps {
  studentId: string;
  studentName: string;
  className: string;
  photoUrl?: string | null;
}

export function StudentQRCode({
  studentId,
  studentName,
  className,
  photoUrl,
}: StudentQRCodeProps) {
  const [isOpen, setIsOpen] = useState(false);
  const canvasRef = useRef<HTMLDivElement>(null);

  const qrValue = studentId; // just the UUID — clean and simple

  const handleDownload = () => {
    const canvas = canvasRef.current?.querySelector("canvas");
    if (!canvas) return;

    // Create a decorated version for download
    const exportCanvas = document.createElement("canvas");
    const padding = 40;
    const labelHeight = 80;
    exportCanvas.width = canvas.width + padding * 2;
    exportCanvas.height = canvas.height + padding * 2 + labelHeight;

    const ctx = exportCanvas.getContext("2d")!;

    // White background
    ctx.fillStyle = "#ffffff";
    ctx.fillRect(0, 0, exportCanvas.width, exportCanvas.height);

    // Draw QR
    ctx.drawImage(canvas, padding, padding);

    // Student name label
    ctx.fillStyle = "#09090b";
    ctx.font = "bold 18px system-ui";
    ctx.textAlign = "center";
    ctx.fillText(
      studentName,
      exportCanvas.width / 2,
      canvas.height + padding + 30,
    );

    // Class label
    ctx.fillStyle = "#71717a";
    ctx.font = "14px system-ui";
    ctx.fillText(
      className,
      exportCanvas.width / 2,
      canvas.height + padding + 54,
    );

    const link = document.createElement("a");
    link.download = `${studentName.replace(/\s+/g, "-")}-canteen-qr.png`;
    link.href = exportCanvas.toDataURL("image/png");
    link.click();
  };

  const handlePrint = () => {
    const canvas = canvasRef.current?.querySelector("canvas");
    if (!canvas) return;
    const dataUrl = canvas.toDataURL("image/png");

    const win = window.open("", "_blank");
    if (!win) return;
    win.document.write(`
      <html>
        <head>
          <title>Canteen QR — ${studentName}</title>
          <style>
            body { margin: 0; display: flex; align-items: center; justify-content: center; min-height: 100vh; font-family: system-ui; }
            .card { text-align: center; padding: 32px; border: 2px solid #e4e4e7; border-radius: 16px; display: inline-block; }
            img { width: 200px; height: 200px; display: block; margin: 0 auto 16px; }
            h2 { margin: 0 0 4px; font-size: 18px; color: #09090b; }
            p { margin: 0; font-size: 13px; color: #71717a; }
            .badge { margin-top: 12px; font-size: 10px; color: #a1a1aa; letter-spacing: 0.1em; text-transform: uppercase; }
          </style>
        </head>
        <body>
          <div class="card">
            <img src="${dataUrl}" alt="QR Code" />
            <h2>${studentName}</h2>
            <p>${className}</p>
            <p class="badge">SchoolMealPay · Canteen Access</p>
          </div>
          <script>window.onload = () => { window.print(); window.close(); }<\/script>
        </body>
      </html>
    `);
    win.document.close();
  };

  return (
    <>
      {/* Trigger button — drop this wherever you render the child card */}
      <button
        onClick={() => setIsOpen(true)}
        className="flex items-center gap-2 rounded-xl border border-(--border-card) bg-(--bg-secondary) px-3 py-2 text-xs font-bold text-(--text-secondary) hover:bg-(--bg-tertiary) hover:text-(--text-primary) transition-colors cursor-pointer"
      >
        <QrCode size={13} />
        Canteen QR
      </button>

      {/* Modal */}
      <AnimatePresence>
        {isOpen && (
          <div className="fixed inset-0 z-[9999] flex items-center justify-center p-4 isolate">
            {/* Backdrop */}
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setIsOpen(false)}
              className="absolute inset-0 bg-black/50 backdrop-blur-md"
            />

            {/* Card */}
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: 12 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 12 }}
              transition={{ type: "spring", stiffness: 380, damping: 30 }}
              className="relative w-full max-w-sm rounded-3xl border border-zinc-200/80 bg-white dark:border-zinc-800/80 dark:bg-zinc-950 shadow-2xl overflow-hidden"
            >
              {/* Top accent */}
              <div className="h-1 w-full bg-gradient-to-r from-zinc-300 via-zinc-500 to-zinc-300 dark:from-zinc-700 dark:via-zinc-400 dark:to-zinc-700" />

              <div className="p-6">
                {/* Header */}
                <div className="flex items-start justify-between mb-5">
                  <div>
                    <h3 className="text-base font-black tracking-tight text-zinc-950 dark:text-white">
                      Canteen QR Code
                    </h3>
                    <p className="text-[11px] text-zinc-400 mt-0.5">
                      Show this at the canteen counter
                    </p>
                  </div>
                  <button
                    onClick={() => setIsOpen(false)}
                    className="rounded-xl p-1.5 text-zinc-400 hover:bg-zinc-100 dark:hover:bg-zinc-900 transition-colors cursor-pointer"
                  >
                    <X size={16} />
                  </button>
                </div>

                {/* QR + student info */}
                <div className="flex flex-col items-center gap-4">
                  {/* QR wrapper with corner decorations */}
                  <div className="relative p-4 rounded-2xl bg-white border border-zinc-100 dark:border-zinc-800 shadow-inner">
                    <div ref={canvasRef}>
                      <QRCodeCanvas
                        value={qrValue}
                        size={180}
                        level="H" // high error correction — more robust when printed
                        marginSize={1}
                        imageSettings={
                          photoUrl ?
                            {
                              src: photoUrl,
                              height: 36,
                              width: 36,
                              excavate: true,
                            }
                          : undefined
                        }
                      />
                    </div>
                    {/* Corner accents */}
                    {[
                      "top-0 left-0",
                      "top-0 right-0",
                      "bottom-0 left-0",
                      "bottom-0 right-0",
                    ].map((pos) => (
                      <div
                        key={pos}
                        className={`absolute ${pos} w-4 h-4 border-zinc-950 dark:border-white ${
                          pos.includes("top") && pos.includes("left") ?
                            "border-t-2 border-l-2 rounded-tl-lg"
                          : pos.includes("top") && pos.includes("right") ?
                            "border-t-2 border-r-2 rounded-tr-lg"
                          : pos.includes("bottom") && pos.includes("left") ?
                            "border-b-2 border-l-2 rounded-bl-lg"
                          : "border-b-2 border-r-2 rounded-br-lg"
                        }`}
                      />
                    ))}
                  </div>

                  {/* Student info pill */}
                  <div className="text-center">
                    <p className="text-sm font-bold text-zinc-950 dark:text-white">
                      {studentName}
                    </p>
                    <p className="text-[11px] text-zinc-400 mt-0.5">
                      {className}
                    </p>
                  </div>

                  {/* Security note */}
                  <div className="flex items-center gap-1.5 rounded-xl bg-zinc-50 dark:bg-zinc-900 border border-zinc-100 dark:border-zinc-800 px-3 py-2 w-full">
                    <Shield size={11} className="text-zinc-400 shrink-0" />
                    <p className="text-[10px] text-zinc-400 leading-relaxed">
                      This QR is unique to {studentName.split(" ")[0]}. Do not
                      share it publicly.
                    </p>
                  </div>
                </div>

                {/* Actions */}
                <div className="flex gap-2 mt-5">
                  <button
                    onClick={handleDownload}
                    className="flex-1 flex items-center justify-center gap-2 rounded-xl bg-zinc-950 dark:bg-white px-3 py-2.5 text-xs font-bold text-white dark:text-zinc-950 hover:bg-zinc-800 dark:hover:bg-zinc-100 transition-colors cursor-pointer"
                  >
                    <Download size={13} />
                    Download
                  </button>
                  <button
                    onClick={handlePrint}
                    className="flex-1 flex items-center justify-center gap-2 rounded-xl border border-zinc-200 dark:border-zinc-800 px-3 py-2.5 text-xs font-bold text-zinc-700 dark:text-zinc-300 hover:bg-zinc-50 dark:hover:bg-zinc-900 transition-colors cursor-pointer"
                  >
                    <Printer size={13} />
                    Print
                  </button>
                </div>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </>
  );
}
