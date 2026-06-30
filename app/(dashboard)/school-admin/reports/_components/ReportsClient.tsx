"use client";

import { useState } from "react";
import {
  BarChart3,
  TrendingUp,
  ShoppingBag,
  DollarSign,
  Award,
  Calendar,
  Download,
} from "lucide-react";
import { DownloadReportButton } from "./DownloadReportButton";

type DailyRow = { date: string; revenue: string | null; orderCount: number };
type TopItem = {
  name: string | null;
  totalSold: string | null;
  revenue: string | null;
};
type StatusRow = { status: string; count: number };

type Report = {
  daily: DailyRow[];
  topItems: TopItem[];
  statusBreakdown: StatusRow[];
};

const STATUS_COLORS: Record<string, string> = {
  pending: "#f59e0b",
  preparing: "#3b82f6",
  ready: "#8b5cf6",
  collected: "#22c55e",
  cancelled: "#ef4444",
};

function MiniBarChart({ data }: { data: { label: string; value: number }[] }) {
  const max = Math.max(...data.map((d) => d.value), 1);
  return (
    <div className="flex items-end gap-1 h-24 w-full">
      {data.map((d) => (
        <div
          key={d.label}
          className="flex-1 flex flex-col items-center gap-0.5 group relative"
        >
          <div
            className="w-full rounded-sm transition-all"
            style={{
              height: `${Math.max((d.value / max) * 88, 2)}px`,
              background: "var(--accent)",
              opacity: 0.75,
            }}
          />
          {/* Tooltip */}
          <div
            className="absolute bottom-full mb-1 left-1/2 -translate-x-1/2 hidden group-hover:block
            text-[10px] whitespace-nowrap px-1.5 py-0.5 rounded z-10"
            style={{
              background: "var(--text-primary)",
              color: "var(--bg-primary)",
            }}
          >
            {d.label}: {d.value.toLocaleString()}
          </div>
        </div>
      ))}
    </div>
  );
}

function StatCard({
  label,
  value,
  icon: Icon,
  sub,
  color,
}: {
  label: string;
  value: string;
  icon: React.ElementType;
  sub?: string;
  color: string;
}) {
  return (
    <div
      className="rounded-xl border p-5"
      style={{
        background: "var(--bg-card)",
        borderColor: "var(--border-card)",
        boxShadow: "var(--shadow-card)",
      }}
    >
      <div className="flex items-center justify-between mb-3">
        <span
          className="text-xs font-medium"
          style={{ color: "var(--text-muted)" }}
        >
          {label}
        </span>
        <div
          className="w-8 h-8 rounded-lg flex items-center justify-center"
          style={{ background: `${color}18` }}
        >
          <Icon size={15} style={{ color }} />
        </div>
      </div>
      <p
        className="text-2xl font-bold"
        style={{ color: "var(--text-primary)" }}
      >
        {value}
      </p>
      {sub && (
        <p className="text-xs mt-1" style={{ color: "var(--text-muted)" }}>
          {sub}
        </p>
      )}
    </div>
  );
}

export function ReportsClient({
  report,
  defaultStart,
  defaultEnd,
}: {
  report: Report;
  defaultStart: string;
  defaultEnd: string;
}) {
  const [start, setStart] = useState(defaultStart);
  const [end, setEnd] = useState(defaultEnd);

  const totalRevenue = report.daily.reduce(
    (s, d) => s + parseFloat(d.revenue ?? "0"),
    0,
  );
  const totalOrders = report.daily.reduce((s, d) => s + d.orderCount, 0);
  const avgOrderValue = totalOrders > 0 ? totalRevenue / totalOrders : 0;
  const totalSold = report.topItems.reduce(
    (s, i) => s + parseFloat(i.totalSold ?? "0"),
    0,
  );

  // Chart data — last 14 days shown if period is long
  const chartData = report.daily.slice(-14).map((d) => ({
    label: new Date(d.date).toLocaleDateString("en-GB", {
      day: "numeric",
      month: "short",
    }),
    value: parseFloat(d.revenue ?? "0"),
  }));

  const orderChartData = report.daily.slice(-14).map((d) => ({
    label: new Date(d.date).toLocaleDateString("en-GB", {
      day: "numeric",
      month: "short",
    }),
    value: d.orderCount,
  }));

  const inputSty = {
    background: "var(--bg-secondary)",
    borderColor: "var(--border-input)",
    color: "var(--text-primary)",
  };

  const cardStyle = {
    background: "var(--bg-card)",
    borderColor: "var(--border-card)",
    boxShadow: "var(--shadow-card)",
  };

  return (
    <div className="space-y-6">
      {/* Date range filter */}
      <div className="flex flex-wrap items-center gap-3">
        <Calendar size={14} style={{ color: "var(--text-muted)" }} />
        <div className="flex items-center gap-2">
          <input
            type="date"
            value={start}
            onChange={(e) => setStart(e.target.value)}
            className="px-3 py-1.5 text-sm rounded-lg border outline-none"
            style={inputSty}
          />
          <span className="text-sm" style={{ color: "var(--text-muted)" }}>to</span>
          <input
            type="date"
            value={end}
            onChange={(e) => setEnd(e.target.value)}
            className="px-3 py-1.5 text-sm rounded-lg border outline-none"
            style={inputSty}
          />
        </div>
        <span className="text-xs" style={{ color: "var(--text-muted)" }}>
          (Reload page after changing dates — live filtering coming soon)
        </span>
        <div className="ml-auto">
          <DownloadReportButton
            report={report}
            start={start}
            end={end}
            totalRevenue={totalRevenue}
            totalOrders={totalOrders}
            avgOrderValue={avgOrderValue}
            totalSold={totalSold}
          />
        </div>
      </div>

      {/* Summary stats */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard
          label="Total Revenue"
          value={`Rs. ${totalRevenue.toLocaleString("en-PK", { maximumFractionDigits: 0 })}`}
          icon={DollarSign}
          color="#22c55e"
          sub={`${report.daily.length} days`}
        />
        <StatCard
          label="Total Orders"
          value={totalOrders.toString()}
          icon={ShoppingBag}
          color="#3b82f6"
          sub="All statuses"
        />
        <StatCard
          label="Avg. Order Value"
          value={`Rs. ${avgOrderValue.toFixed(0)}`}
          icon={TrendingUp}
          color="#8b5cf6"
          sub="Per order"
        />
        <StatCard
          label="Items Sold"
          value={totalSold.toLocaleString()}
          icon={Award}
          color="#f59e0b"
          sub="Total quantity"
        />
      </div>

      {/* Charts row */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        {/* Revenue chart */}
        <div className="rounded-xl border p-5" style={cardStyle}>
          <div className="flex items-center justify-between mb-4">
            <div>
              <h3
                className="text-sm font-semibold"
                style={{ color: "var(--text-primary)" }}
              >
                Daily Revenue
              </h3>
              <p className="text-xs" style={{ color: "var(--text-muted)" }}>
                Last 14 days
              </p>
            </div>
            <BarChart3 size={16} style={{ color: "var(--text-muted)" }} />
          </div>
          {chartData.length === 0 ?
            <div className="h-24 flex items-center justify-center">
              <p className="text-sm" style={{ color: "var(--text-muted)" }}>
                No data for this period
              </p>
            </div>
            : <MiniBarChart data={chartData} />}
        </div>

        {/* Orders chart */}
        <div className="rounded-xl border p-5" style={cardStyle}>
          <div className="flex items-center justify-between mb-4">
            <div>
              <h3
                className="text-sm font-semibold"
                style={{ color: "var(--text-primary)" }}
              >
                Daily Orders
              </h3>
              <p className="text-xs" style={{ color: "var(--text-muted)" }}>
                Last 14 days
              </p>
            </div>
            <ShoppingBag size={16} style={{ color: "var(--text-muted)" }} />
          </div>
          {orderChartData.length === 0 ?
            <div className="h-24 flex items-center justify-center">
              <p className="text-sm" style={{ color: "var(--text-muted)" }}>
                No data for this period
              </p>
            </div>
            : <MiniBarChart data={orderChartData} />}
        </div>
      </div>

      {/* Bottom row */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        {/* Top menu items */}
        <div className="rounded-xl border p-5" style={cardStyle}>
          <div className="flex items-center gap-2 mb-4">
            <Award size={15} style={{ color: "#f59e0b" }} />
            <h3
              className="text-sm font-semibold"
              style={{ color: "var(--text-primary)" }}
            >
              Top Menu Items
            </h3>
          </div>
          {report.topItems.length === 0 ?
            <p
              className="text-sm text-center py-8"
              style={{ color: "var(--text-muted)" }}
            >
              No orders in this period
            </p>
            : <div className="space-y-2">
              {report.topItems.slice(0, 8).map((item, idx) => {
                const maxSold = parseFloat(
                  report.topItems[0]?.totalSold ?? "1",
                );
                const pct = (parseFloat(item.totalSold ?? "0") / maxSold) * 100;
                return (
                  <div key={idx} className="flex items-center gap-3">
                    <span
                      className="text-xs font-bold w-5 text-right flex-shrink-0"
                      style={{
                        color: idx === 0 ? "#f59e0b" : "var(--text-muted)",
                      }}
                    >
                      {idx + 1}
                    </span>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center justify-between mb-0.5">
                        <span
                          className="text-xs font-medium truncate"
                          style={{ color: "var(--text-primary)" }}
                        >
                          {item.name ?? "Unknown"}
                        </span>
                        <span
                          className="text-xs ml-2 flex-shrink-0"
                          style={{ color: "var(--text-secondary)" }}
                        >
                          {item.totalSold} sold · Rs.{" "}
                          {parseFloat(item.revenue ?? "0").toLocaleString(
                            "en-PK",
                            { maximumFractionDigits: 0 },
                          )}
                        </span>
                      </div>
                      <div
                        className="h-1 rounded-full"
                        style={{ background: "var(--bg-tertiary)" }}
                      >
                        <div
                          className="h-full rounded-full"
                          style={{ width: `${pct}%`, background: "#f59e0b" }}
                        />
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          }
        </div>

        {/* Order status breakdown */}
        <div className="rounded-xl border p-5" style={cardStyle}>
          <div className="flex items-center gap-2 mb-4">
            <ShoppingBag size={15} style={{ color: "#3b82f6" }} />
            <h3
              className="text-sm font-semibold"
              style={{ color: "var(--text-primary)" }}
            >
              Order Status Breakdown
            </h3>
          </div>
          {report.statusBreakdown.length === 0 ?
            <p
              className="text-sm text-center py-8"
              style={{ color: "var(--text-muted)" }}
            >
              No orders in this period
            </p>
            : <div className="space-y-3">
              {report.statusBreakdown.map((row) => {
                const total = report.statusBreakdown.reduce(
                  (s, r) => s + r.count,
                  0,
                );
                const pct = total > 0 ? (row.count / total) * 100 : 0;
                const color = STATUS_COLORS[row.status] ?? "#6b7280";
                return (
                  <div key={row.status}>
                    <div className="flex items-center justify-between mb-1">
                      <div className="flex items-center gap-2">
                        <div
                          className="w-2 h-2 rounded-full"
                          style={{ background: color }}
                        />
                        <span
                          className="text-xs font-medium capitalize"
                          style={{ color: "var(--text-primary)" }}
                        >
                          {row.status}
                        </span>
                      </div>
                      <span
                        className="text-xs"
                        style={{ color: "var(--text-secondary)" }}
                      >
                        {row.count} ({pct.toFixed(0)}%)
                      </span>
                    </div>
                    <div
                      className="h-1.5 rounded-full"
                      style={{ background: "var(--bg-tertiary)" }}
                    >
                      <div
                        className="h-full rounded-full transition-all"
                        style={{ width: `${pct}%`, background: color }}
                      />
                    </div>
                  </div>
                );
              })}

              <div
                className="pt-3 border-t"
                style={{ borderColor: "var(--border-primary)" }}
              >
                <div className="flex items-center justify-between">
                  <span
                    className="text-xs font-medium"
                    style={{ color: "var(--text-secondary)" }}
                  >
                    Total Orders
                  </span>
                  <span
                    className="text-sm font-bold"
                    style={{ color: "var(--text-primary)" }}
                  >
                    {report.statusBreakdown.reduce((s, r) => s + r.count, 0)}
                  </span>
                </div>
                <div className="flex items-center justify-between mt-1">
                  <span
                    className="text-xs font-medium"
                    style={{ color: "var(--text-secondary)" }}
                  >
                    Completion Rate
                  </span>
                  <span
                    className="text-sm font-bold"
                    style={{ color: "#22c55e" }}
                  >
                    {(() => {
                      const total = report.statusBreakdown.reduce(
                        (s, r) => s + r.count,
                        0,
                      );
                      const collected =
                        report.statusBreakdown.find(
                          (r) => r.status === "collected",
                        )?.count ?? 0;
                      return total > 0 ?
                        `${((collected / total) * 100).toFixed(0)}%`
                        : "—";
                    })()}
                  </span>
                </div>
              </div>
            </div>
          }
        </div>
      </div>
    </div>
  );
}
