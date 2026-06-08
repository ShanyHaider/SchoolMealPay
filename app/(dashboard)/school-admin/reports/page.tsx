// app/(dashboard)/school-admin/reports/page.tsx

import { requireSchoolFeature } from "@/lib/guards/pageGuards";
import { getSalesReport } from "@/db/queries/Admin";
import { ReportsClient } from "./_components/ReportsClient";
import { connection } from "next/server";



export default async function ReportsPage() {
  await requireSchoolFeature("hasAdvancedAnalytics");

  await connection();

  const end = new Date();
  const start = new Date();
  start.setDate(start.getDate() - 29);
  const fmt = (d: Date) => d.toISOString().split("T")[0];
  const report = await getSalesReport(fmt(start), fmt(end));


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

      {/* Props match ReportsClient exactly: defaultStart / defaultEnd */}
      <ReportsClient report={report} defaultStart={fmt(start)} defaultEnd={fmt(end)} />
    </div>
  );
}