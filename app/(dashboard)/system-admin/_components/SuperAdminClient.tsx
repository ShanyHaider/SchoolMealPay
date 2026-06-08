"use client";

import { useState, useTransition } from "react";
import {
  Users,
  DollarSign,
  Building2,
  ShoppingBag,
  Activity,
  UserCheck,
  UserMinus,
  KeyRound,
  Sliders,
  CheckCircle,
  FileSpreadsheet,
} from "lucide-react";
import {
  updateSchoolSubscriptionLimit,
  toggleSchoolSubscriptionTier,
  toggleUserStatus,
  triggerClerkReverification,
} from "@/db/actions/SuperAdmin";

type User = {
  id: string;
  name: string;
  email: string;
  role: string;
  isActive: boolean;
  createdAt: Date;
};

type AuditLog = {
  id: string;
  action: string;
  entityType: string;
  entityId: string | null;
  oldValues: any;
  newValues: any;
  ipAddress: string | null;
  createdAt: Date;
  user: {
    name: string;
    email: string;
  } | null;
};

interface SuperAdminClientProps {
  stats: {
    revenue: number;
    activeOrdersCount: number;
    schoolsCount: number;
    latencyMs: number;
  };
  subscriptionData: {
    subscription: {
      id: string;
      tier: "free" | "premium_school" | "parent_pro";
      studentLimit: number;
    } | null;
    profile: {
      name: string;
      email: string | null;
      phone: string | null;
      city: string | null;
    } | null;
  };
  users: User[];
  auditLogs: AuditLog[];
  currentAdminUserId: string;
}

export function SuperAdminClient({
  stats,
  subscriptionData,
  users,
  auditLogs,
  currentAdminUserId,
}: SuperAdminClientProps) {
  const [isPending, startTransition] = useTransition();
  const [message, setMessage] = useState<{ type: "success" | "error"; text: string } | null>(null);

  // Form states
  const [studentLimitInput, setStudentLimitInput] = useState(
    subscriptionData.subscription?.studentLimit?.toString() ?? "50",
  );

  const showMsg = (text: string, type: "success" | "error" = "success") => {
    setMessage({ type, text });
    setTimeout(() => setMessage(null), 5000);
  };

  const handleUpdateLimit = () => {
    const limit = parseInt(studentLimitInput, 10);
    if (isNaN(limit) || limit < 0) {
      showMsg("Invalid student limit count.", "error");
      return;
    }

    startTransition(async () => {
      try {
        await updateSchoolSubscriptionLimit(limit, currentAdminUserId);
        showMsg("School student limit updated successfully.");
      } catch (err: any) {
        showMsg(err.message ?? "Failed to update limit.", "error");
      }
    });
  };

  const handleToggleTier = (newTier: "free" | "premium_school") => {
    startTransition(async () => {
      try {
        await toggleSchoolSubscriptionTier(newTier, currentAdminUserId);
        showMsg(`School subscription tier set to ${newTier === "premium_school" ? "Premium" : "Free"}.`);
      } catch (err: any) {
        showMsg(err.message ?? "Failed to switch plan tier.", "error");
      }
    });
  };

  const handleToggleActive = (userId: string, currentActive: boolean) => {
    startTransition(async () => {
      try {
        await toggleUserStatus(userId, !currentActive, currentAdminUserId);
        showMsg(`User account status updated successfully.`);
      } catch (err: any) {
        showMsg(err.message ?? "Failed to change user status.", "error");
      }
    });
  };

  const handleReverify = (userId: string) => {
    startTransition(async () => {
      try {
        await triggerClerkReverification(userId, currentAdminUserId);
        showMsg("User session revoked. Global reverification flag triggered in Clerk.");
      } catch (err: any) {
        showMsg(err.message ?? "Failed to trigger user reverification.", "error");
      }
    });
  };

  return (
    <div className="space-y-8">
      {/* Notifications banner */}
      {message && (
        <div
          className={`flex items-center gap-3 p-4 rounded-xl border animate-in fade-in-0 duration-300`}
          style={{
            background: message.type === "success" ? "rgba(34,197,94,0.08)" : "rgba(239,68,68,0.08)",
            borderColor: message.type === "success" ? "rgba(34,197,94,0.2)" : "rgba(239,68,68,0.2)",
            color: message.type === "success" ? "#22c55e" : "#ef4444",
          }}
        >
          <CheckCircle size={18} />
          <span className="text-sm font-medium">{message.text}</span>
        </div>
      )}

      {/* Analytics summary grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {[
          {
            label: "Total Processing Volume",
            value: `Rs. ${stats.revenue.toLocaleString()}`,
            desc: "System-wide success purchases",
            icon: DollarSign,
            color: "text-emerald-500",
          },
          {
            label: "Daily Pre-Orders",
            value: stats.activeOrdersCount.toString(),
            desc: "Active scheduled today",
            icon: ShoppingBag,
            color: "text-amber-500",
          },
          {
            label: "Registered Campuses",
            value: stats.schoolsCount.toString(),
            desc: "Active academic clients",
            icon: Building2,
            color: "text-blue-500",
          },
          {
            label: "Database Latency",
            value: `${stats.latencyMs}ms`,
            desc: "Single-tenant query time",
            icon: Activity,
            color: "text-green-500",
          },
        ].map((card) => {
          const Icon = card.icon;
          return (
            <div
              key={card.label}
              className="rounded-2xl border p-5 flex items-start justify-between shadow-sm"
              style={{
                background: "var(--bg-card)",
                borderColor: "var(--border-card)",
              }}
            >
              <div className="space-y-1">
                <p className="text-xs font-bold text-(--text-secondary) uppercase tracking-wider">
                  {card.label}
                </p>
                <h3 className="text-2xl font-black text-(--text-primary)">{card.value}</h3>
                <p className="text-[10px] text-(--text-muted) font-medium">{card.desc}</p>
              </div>
              <div className={`p-2.5 rounded-xl bg-(--bg-secondary) border border-(--border-card) ${card.color}`}>
                <Icon size={18} />
              </div>
            </div>
          );
        })}
      </div>

      {/* Institutional management & feature toggles */}
      <div className="grid grid-cols-1 lg:grid-cols-[1fr_400px] gap-6 items-start">
        {/* User ledger accounts */}
        <div
          className="rounded-2xl border overflow-hidden shadow-sm"
          style={{
            background: "var(--bg-card)",
            borderColor: "var(--border-card)",
          }}
        >
          <div className="p-5 border-b border-(--border-primary) flex items-center justify-between">
            <div>
              <h3 className="text-sm font-bold text-(--text-primary) uppercase tracking-widest">
                Global User Ledger
              </h3>
              <p className="text-[10px] text-(--text-secondary) mt-0.5">
                Manage accounts, block logins, and trigger Clerk session resets.
              </p>
            </div>
            <span className="px-2.5 py-1 rounded-md text-[10px] font-bold bg-zinc-100 text-zinc-900 dark:bg-zinc-800 dark:text-zinc-100 border border-(--border-card)">
              {users.length} registered
            </span>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs border-collapse">
              <thead>
                <tr className="bg-(--bg-secondary) border-b border-(--border-primary) text-(--text-secondary) uppercase tracking-wider font-bold">
                  <th className="p-4">Name / Email</th>
                  <th className="p-4">Role</th>
                  <th className="p-4">Status</th>
                  <th className="p-4 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-(--divider)">
                {users.map((u) => (
                  <tr key={u.id} className="hover:bg-black/5 dark:hover:bg-white/5 transition-colors">
                    <td className="p-4">
                      <p className="font-bold text-(--text-primary)">{u.name}</p>
                      <p className="text-[10px] text-(--text-muted) font-mono">{u.email}</p>
                    </td>
                    <td className="p-4">
                      <span className="px-2 py-0.5 rounded text-[10px] font-semibold uppercase tracking-wider bg-zinc-100 text-zinc-800 dark:bg-zinc-800 dark:text-zinc-200 border border-(--border-card)">
                        {u.role}
                      </span>
                    </td>
                    <td className="p-4">
                      <span
                        className={`px-2 py-0.5 rounded text-[10px] font-bold uppercase ${
                          u.isActive ?
                            "bg-green-500/10 text-green-600 border border-green-500/20"
                          : "bg-red-500/10 text-red-600 border border-red-500/20"
                        }`}
                      >
                        {u.isActive ? "Active" : "Blocked"}
                      </span>
                    </td>
                    <td className="p-4 text-right space-x-1.5 whitespace-nowrap">
                      <button
                        onClick={() => handleToggleActive(u.id, u.isActive)}
                        disabled={isPending || u.id === currentAdminUserId}
                        className={`p-1.5 rounded-lg border transition-all ${
                          u.isActive ?
                            "bg-red-500/10 text-red-600 hover:bg-red-500/20 border-red-500/20"
                          : "bg-green-500/10 text-green-600 hover:bg-green-500/20 border-green-500/20"
                        } disabled:opacity-40`}
                        title={u.isActive ? "Block Account" : "Re-activate Account"}
                      >
                        {u.isActive ? <UserMinus size={13} /> : <UserCheck size={13} />}
                      </button>
                      <button
                        onClick={() => handleReverify(u.id)}
                        disabled={isPending}
                        className="p-1.5 rounded-lg border bg-zinc-100 text-zinc-700 hover:bg-zinc-200 border-zinc-200 dark:bg-zinc-800 dark:text-zinc-300 dark:hover:bg-zinc-700 dark:border-zinc-700 transition-all"
                        title="Force Reverification"
                      >
                        <KeyRound size={13} />
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        {/* School settings manager */}
        <div className="space-y-6">
          <div
            className="rounded-2xl border p-5 shadow-sm space-y-4"
            style={{
              background: "var(--bg-card)",
              borderColor: "var(--border-card)",
            }}
          >
            <div>
              <h3 className="text-sm font-bold text-(--text-primary) uppercase tracking-widest">
                School Profile Manager
              </h3>
              <p className="text-[10px] text-(--text-secondary) mt-0.5">
                Campus: <span className="font-bold">{subscriptionData.profile?.name ?? "Main Campus"}</span>
              </p>
            </div>

            <div className="space-y-4 pt-2">
              {/* Student limit input */}
              <div className="space-y-1.5">
                <label className="text-[10px] font-bold text-(--text-secondary) uppercase tracking-wider flex items-center gap-1.5">
                  <Sliders size={12} /> Student Footprint Cap (`maxStudents`)
                </label>
                <div className="flex gap-2">
                  <input
                    type="number"
                    value={studentLimitInput}
                    onChange={(e) => setStudentLimitInput(e.target.value)}
                    disabled={subscriptionData.subscription?.tier === "premium_school"}
                    className="flex-1 px-3 py-2 text-xs font-bold rounded-lg border border-(--border-input) bg-(--bg-secondary) text-(--text-primary) outline-none disabled:opacity-40"
                  />
                  <button
                    onClick={handleUpdateLimit}
                    disabled={isPending || subscriptionData.subscription?.tier === "premium_school"}
                    className="px-4 py-2 rounded-lg bg-black text-white dark:bg-white dark:text-black text-xs font-bold hover:opacity-95 transition-all disabled:opacity-40"
                  >
                    Set
                  </button>
                </div>
                {subscriptionData.subscription?.tier === "premium_school" && (
                  <p className="text-[9px] text-green-500 font-bold uppercase tracking-tight">
                    * School is Premium: Limits are bypassed.
                  </p>
                )}
              </div>

              {/* Subscription Tier selector */}
              <div className="space-y-2 border-t border-(--border-primary) pt-4">
                <label className="text-[10px] font-bold text-(--text-secondary) uppercase tracking-wider">
                  Override Campus Tier Flag
                </label>
                <div className="grid grid-cols-2 gap-2">
                  {[
                    { key: "free" as const, label: "School Free" },
                    { key: "premium_school" as const, label: "School Premium" },
                  ].map((tierOpt) => {
                    const active = subscriptionData.subscription?.tier === tierOpt.key;
                    return (
                      <button
                        key={tierOpt.key}
                        onClick={() => handleToggleTier(tierOpt.key)}
                        disabled={isPending}
                        className={`py-2 rounded-lg text-xs font-bold border transition-all ${
                          active ?
                            "bg-black text-white border-black dark:bg-white dark:text-black"
                          : "bg-white text-zinc-500 border-zinc-200 hover:text-black hover:border-black dark:bg-zinc-900 dark:border-zinc-800 dark:text-zinc-400 dark:hover:text-white dark:hover:border-zinc-600"
                        }`}
                      >
                        {tierOpt.label}
                      </button>
                    );
                  })}
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Compliance System Audit Logs Table */}
      <div
        className="rounded-2xl border overflow-hidden shadow-sm"
        style={{
          background: "var(--bg-card)",
          borderColor: "var(--border-card)",
        }}
      >
        <div className="p-5 border-b border-(--border-primary)">
          <h3 className="text-sm font-bold text-(--text-primary) uppercase tracking-widest flex items-center gap-2">
            <FileSpreadsheet size={15} /> System Audit Trail Stream
          </h3>
          <p className="text-[10px] text-(--text-secondary) mt-0.5">
            Immutable tracking logs of administrative updates across the single-tenant setup.
          </p>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs border-collapse">
            <thead>
              <tr className="bg-(--bg-secondary) border-b border-(--border-primary) text-(--text-secondary) uppercase tracking-wider font-bold">
                <th className="p-4">Action</th>
                <th className="p-4">Entity</th>
                <th className="p-4">User</th>
                <th className="p-4">Audit Values</th>
                <th className="p-4">IP Address</th>
                <th className="p-4">Timestamp</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-(--divider) font-medium text-(--text-secondary)">
              {auditLogs.map((log) => (
                <tr key={log.id} className="hover:bg-black/5 dark:hover:bg-white/5 transition-colors">
                  <td className="p-4">
                    <span className="px-2 py-0.5 rounded text-[10px] font-bold uppercase bg-amber-500/10 text-amber-600 border border-amber-500/20">
                      {log.action.replace(/_/g, " ")}
                    </span>
                  </td>
                  <td className="p-4">
                    <p className="text-(--text-primary) font-mono leading-none">{log.entityType}</p>
                    <p className="text-[9px] text-(--text-muted) font-mono truncate mt-0.5 max-w-[120px]">
                      {log.entityId}
                    </p>
                  </td>
                  <td className="p-4">
                    <p className="font-bold text-(--text-primary)">{log.user?.name ?? "System"}</p>
                    <p className="text-[10px] text-(--text-muted) font-mono">{log.user?.email}</p>
                  </td>
                  <td className="p-4 max-w-xs font-mono text-[10px] leading-tight">
                    <div className="space-y-0.5">
                      <p className="text-red-500 truncate">
                        - {JSON.stringify(log.oldValues ?? {})}
                      </p>
                      <p className="text-green-500 truncate">
                        + {JSON.stringify(log.newValues ?? {})}
                      </p>
                    </div>
                  </td>
                  <td className="p-4 font-mono text-[11px]">{log.ipAddress ?? "local"}</td>
                  <td className="p-4 whitespace-nowrap text-(--text-muted)">
                    {new Date(log.createdAt).toLocaleString("en-US", {
                      month: "short",
                      day: "numeric",
                      hour: "2-digit",
                      minute: "2-digit",
                    })}
                  </td>
                </tr>
              ))}
              {auditLogs.length === 0 && (
                <tr>
                  <td colSpan={6} className="p-8 text-center text-(--text-muted) italic">
                    No compliance audit logs recorded.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
