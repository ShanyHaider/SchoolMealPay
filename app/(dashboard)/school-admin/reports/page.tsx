import { getSalesReport } from "@/db/queries/Admin";
import { ReportsClient } from "./_components/ReportsClient";

function getDefaultRange() {
  const end = new Date();
  const start = new Date();
  start.setDate(start.getDate() - 29);
  const fmt = (d: Date) => d.toISOString().split("T")[0];
  return { start: fmt(start), end: fmt(end) };
}

export default async function ReportsPage() {
  const { start, end } = getDefaultRange();
  const report = await getSalesReport(start, end);

  return (
    <div className="space-y-6">
      <div>
        <h1
          className="text-2xl font-bold tracking-tight"
          style={{ color: "var(--text-primary)" }}
        >
          Reports & Analytics
        </h1>
        <p className="text-sm mt-1" style={{ color: "var(--text-secondary)" }}>
          Sales performance, top menu items, and order breakdowns.
        </p>
      </div>
      <ReportsClient report={report} defaultStart={start} defaultEnd={end} />
    </div>
  );
}
