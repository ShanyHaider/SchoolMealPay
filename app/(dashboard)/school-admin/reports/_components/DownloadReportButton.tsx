// app/(dashboard)/school-admin/reports/_components/DownloadReportButton.tsx
"use client";

import { Download } from "lucide-react";

type DailyRow = { date: string; revenue: string | null; orderCount: number };
type TopItem = { name: string | null; totalSold: string | null; revenue: string | null };
type StatusRow = { status: string; count: number };
type Report = { daily: DailyRow[]; topItems: TopItem[]; statusBreakdown: StatusRow[] };

interface DownloadReportButtonProps {
    report: Report;
    start: string;
    end: string;
    totalRevenue: number;
    totalOrders: number;
    avgOrderValue: number;
    totalSold: number;
}

export function DownloadReportButton({
    report,
    start,
    end,
    totalRevenue,
    totalOrders,
    avgOrderValue,
    totalSold,
}: DownloadReportButtonProps) {
    const downloadPDF = () => {
        const script = document.createElement("script");
        script.src = "https://cdnjs.cloudflare.com/ajax/libs/jspdf/2.5.1/jspdf.umd.min.js";
        script.onload = () => {
            const { jsPDF } = (window as any).jspdf;
            const doc = new jsPDF({ orientation: "portrait", unit: "mm", format: "a4" });

            const W = 210;
            const margin = 16;
            let y = 0;

            const accent = [245, 158, 11] as [number, number, number];
            const dark = [9, 9, 11] as [number, number, number];
            const muted = [113, 113, 122] as [number, number, number];
            const light = [244, 244, 245] as [number, number, number];
            const white = [255, 255, 255] as [number, number, number];

            // ── Header band ──────────────────────────────────
            doc.setFillColor(...dark);
            doc.rect(0, 0, W, 22, "F");
            doc.setTextColor(...white);
            doc.setFontSize(13);
            doc.setFont("helvetica", "bold");
            doc.text("SchoolMealPay", margin, 13);
            doc.setFontSize(8);
            doc.setFont("helvetica", "normal");
            doc.setTextColor(180, 180, 180);
            doc.text("Reports & Analytics", margin, 19);
            doc.setTextColor(180, 180, 180);
            doc.setFontSize(8);
            doc.text(`${start} — ${end}`, W - margin, 13, { align: "right" });
            doc.text(
                `Generated ${new Date().toLocaleDateString("en-GB", { day: "numeric", month: "long", year: "numeric" })}`,
                W - margin, 19, { align: "right" },
            );
            y = 30;

            // ── Summary cards ─────────────────────────────────
            const cards = [
                { label: "Total Revenue", value: `Rs. ${totalRevenue.toLocaleString("en-PK", { maximumFractionDigits: 0 })}` },
                { label: "Total Orders", value: totalOrders.toString() },
                { label: "Avg. Order Value", value: `Rs. ${avgOrderValue.toFixed(0)}` },
                { label: "Items Sold", value: totalSold.toLocaleString() },
            ];
            const cardW = (W - margin * 2 - 6) / 2;
            const cardH = 18;
            cards.forEach((card, i) => {
                const x = margin + (i % 2) * (cardW + 6);
                const cy = y + Math.floor(i / 2) * (cardH + 4);
                doc.setFillColor(...light);
                doc.roundedRect(x, cy, cardW, cardH, 2, 2, "F");
                doc.setTextColor(...muted);
                doc.setFontSize(7);
                doc.setFont("helvetica", "normal");
                doc.text(card.label.toUpperCase(), x + 8, cy + 6);
                doc.setTextColor(...dark);
                doc.setFontSize(11);
                doc.setFont("helvetica", "bold");
                doc.text(card.value, x + 8, cy + 13);
            });
            y += cardH * 2 + 4 * 2 + 8;

            // ── Helpers ───────────────────────────────────────
            const sectionHeading = (title: string) => {
                doc.setFillColor(...accent);
                doc.rect(margin, y, 3, 5, "F");
                doc.setTextColor(...dark);
                doc.setFontSize(9);
                doc.setFont("helvetica", "bold");
                doc.text(title, margin + 6, y + 4);
                y += 10;
            };

            const drawTable = (headers: string[], rows: string[][], colWidths: number[], startX = margin) => {
                const rowH = 7;
                const tableW = colWidths.reduce((a, b) => a + b, 0);

                doc.setFillColor(...dark);
                doc.rect(startX, y, tableW, rowH, "F");
                doc.setTextColor(...white);
                doc.setFontSize(7);
                doc.setFont("helvetica", "bold");
                let cx = startX;
                headers.forEach((h, i) => { doc.text(h, cx + 3, y + 4.8); cx += colWidths[i]; });
                y += rowH;

                rows.forEach((row, ri) => {
                    if (y > 265) { doc.addPage(); y = 16; }
                    const fill = ri % 2 === 0 ? 255 : 248;
                    doc.setFillColor(fill, fill, ri % 2 === 0 ? 255 : 250);
                    doc.rect(startX, y, tableW, rowH, "F");
                    doc.setTextColor(...dark);
                    doc.setFontSize(7);
                    doc.setFont("helvetica", "normal");
                    cx = startX;
                    row.forEach((cell, i) => { doc.text(String(cell), cx + 3, y + 4.8); cx += colWidths[i]; });
                    y += rowH;
                });
                y += 6;
            };

            // ── Daily breakdown ───────────────────────────────
            sectionHeading("Daily Breakdown");
            drawTable(
                ["Date", "Revenue (Rs.)", "Orders"],
                report.daily.map((d) => [
                    d.date,
                    parseFloat(d.revenue ?? "0").toLocaleString("en-PK", { maximumFractionDigits: 0 }),
                    d.orderCount.toString(),
                ]),
                [60, 60, 40],
            );

            // ── Top menu items ────────────────────────────────
            if (y > 220) { doc.addPage(); y = 16; }
            sectionHeading("Top Menu Items");
            drawTable(
                ["#", "Item", "Qty Sold", "Revenue (Rs.)"],
                report.topItems.slice(0, 10).map((item, i) => [
                    (i + 1).toString(),
                    item.name ?? "Unknown",
                    item.totalSold ?? "0",
                    parseFloat(item.revenue ?? "0").toLocaleString("en-PK", { maximumFractionDigits: 0 }),
                ]),
                [10, 80, 30, 40],
            );

            // ── Order status breakdown ────────────────────────
            if (y > 220) { doc.addPage(); y = 16; }
            sectionHeading("Order Status Breakdown");
            const statusTotal = report.statusBreakdown.reduce((s, r) => s + r.count, 0);
            drawTable(
                ["Status", "Count", "% of Total"],
                report.statusBreakdown.map((row) => [
                    row.status.charAt(0).toUpperCase() + row.status.slice(1),
                    row.count.toString(),
                    statusTotal > 0 ? `${((row.count / statusTotal) * 100).toFixed(1)}%` : "0%",
                ]),
                [50, 30, 30],
            );

            // ── Footer on every page ──────────────────────────
            const pageCount = doc.getNumberOfPages();
            for (let p = 1; p <= pageCount; p++) {
                doc.setPage(p);
                doc.setFillColor(...light);
                doc.rect(0, 285, W, 12, "F");
                doc.setTextColor(...muted);
                doc.setFontSize(7);
                doc.setFont("helvetica", "normal");
                doc.text("SchoolMealPay — Confidential", margin, 292);
                doc.text(`Page ${p} of ${pageCount}`, W - margin, 292, { align: "right" });
            }

            doc.save(`report-${start}-to-${end}.pdf`);
        };
        document.head.appendChild(script);
    };

    return (
        <button
            onClick={downloadPDF}
            className="flex items-center gap-2 px-3 py-1.5 rounded-lg text-xs font-medium transition-colors hover:opacity-80"
            style={{
                background: "var(--bg-secondary)",
                border: "1px solid var(--border-input)",
                color: "var(--text-secondary)",
            }}
        >
            <Download size={13} />
            Download PDF
        </button>
    );
}