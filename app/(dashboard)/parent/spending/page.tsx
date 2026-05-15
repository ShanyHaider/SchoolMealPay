import { currentUser } from "@clerk/nextjs/server";
import { redirect } from "next/navigation";
import { getUser } from "@/db/queries/Users";
import { getChildrenByParent } from "@/db/queries/Students";
import {
  getOrdersByParent,
  getTransactionsByParent,
} from "@/db/queries/Orders";
import { upsertChildProfile } from "@/db/actions/Students";
import {
  Wallet,
  CreditCard,
  CheckCircle2,
  XCircle,
  RefreshCcw,
  Save,
  TrendingUp,
  Calendar,
  AlertCircle,
  DollarSign,
  Users,
} from "lucide-react";

function SpendingBar({
  spent,
  limit,
}: {
  spent: number;
  limit: number | null;
}) {
  if (!limit) return null;
  const pct = Math.min((spent / limit) * 100, 100);
  const color =
    pct >= 90 ? "bg-red-500"
    : pct >= 70 ? "bg-amber-500"
    : "bg-emerald-500";

  return (
    <div className="h-2 bg-(--bg-tertiary) rounded-full overflow-hidden mt-3">
      <div
        className={`h-full rounded-full transition-all duration-500 ${color}`}
        style={{ width: `${pct}%` }}
      />
    </div>
  );
}

export default async function SpendingPage() {
  const clerkUser = await currentUser();
  if (!clerkUser) redirect("/sign-in");
  const dbUser = await getUser(clerkUser.id);
  if (!dbUser) redirect("/sign-in");

  const [children, orders, transactions] = await Promise.all([
    getChildrenByParent(dbUser.id),
    getOrdersByParent(dbUser.id),
    getTransactionsByParent(dbUser.id),
  ]);

  const approvedChildren = children.filter((c) => c.status === "approved");

  const now = new Date();
  const startOfWeek = new Date(now);
  startOfWeek.setDate(now.getDate() - now.getDay());
  const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);

  const childSpend = approvedChildren.map((link) => {
    const childOrders = orders.filter(
      (o) => o.studentId === link.student.id && o.status !== "cancelled",
    );
    const weekSpend = childOrders
      .filter((o) => new Date(o.orderDate) >= startOfWeek)
      .reduce((s, o) => s + parseFloat(o.totalAmount), 0);
    const monthSpend = childOrders
      .filter((o) => new Date(o.orderDate) >= startOfMonth)
      .reduce((s, o) => s + parseFloat(o.totalAmount), 0);
    return { link, weekSpend, monthSpend };
  });

  return (
    <div className="flex flex-col gap-8 max-w-6xl mx-auto">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-(--text-primary) tracking-tight flex items-center gap-2">
            <Wallet className="text-(--accent)" /> Spending
          </h1>
          <p className="text-sm text-(--text-secondary) mt-1">
            Monitor and control meal budgets for your children.
          </p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
        {/* Left/Main Column: Per-child spending cards */}
        <div className="lg:col-span-8 flex flex-col gap-6">
          {childSpend.length === 0 ?
            <div className="flex flex-col items-center justify-center py-20 bg-(--bg-card) border border-dashed border-(--border-card) rounded-3xl text-center px-6">
              <div className="p-4 bg-(--bg-tertiary) rounded-full mb-4">
                <Users size={32} className="text-(--text-muted)" />
              </div>
              <h3 className="text-lg font-semibold text-(--text-primary)">
                No children linked
              </h3>
              <p className="text-sm text-(--text-secondary) max-w-xs mt-2">
                Once you link a student to your account, their spending limits
                and activity will appear here.
              </p>
            </div>
          : childSpend.map(({ link, weekSpend, monthSpend }) => {
              const { student } = link;
              const dailyLimit =
                student.childProfile?.dailySpendingLimit ?
                  parseFloat(student.childProfile.dailySpendingLimit)
                : null;
              const weeklyLimit =
                student.childProfile?.weeklySpendingLimit ?
                  parseFloat(student.childProfile.weeklySpendingLimit)
                : null;

              async function handleSaveLimits(formData: FormData) {
                "use server";
                await upsertChildProfile({
                  studentId: student.id,
                  dailySpendingLimit: (formData.get("daily") as string) || null,
                  weeklySpendingLimit:
                    (formData.get("weekly") as string) || null,
                  approvalThreshold:
                    (formData.get("approval") as string) || null,
                });
              }

              return (
                <div
                  key={student.id}
                  className="bg-(--bg-card) border border-(--border-card) rounded-3xl p-6 shadow-sm flex flex-col gap-6"
                >
                  <div className="flex items-center gap-4">
                    <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-(--bg-tertiary) to-(--border-card) flex items-center justify-center font-bold text-lg text-(--text-primary) border border-(--border-card)">
                      {student.name.charAt(0).toUpperCase()}
                    </div>
                    <div>
                      <h3 className="font-bold text-lg text-(--text-primary)">
                        {student.name}
                      </h3>
                      <p className="text-xs text-(--text-muted) font-medium">
                        Student Budget Profile
                      </p>
                    </div>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="p-4 rounded-2xl bg-(--bg-secondary) border border-(--border-card)">
                      <div className="flex justify-between items-start mb-2">
                        <span className="text-[10px] font-bold text-(--text-muted) uppercase tracking-widest">
                          Weekly Spend
                        </span>
                        <TrendingUp size={14} className="text-emerald-500" />
                      </div>
                      <p className="text-2xl font-bold text-(--text-primary)">
                        ${weekSpend.toFixed(2)}
                      </p>
                      {weeklyLimit && (
                        <p className="text-xs text-(--text-secondary) mt-1">
                          Limit: ${weeklyLimit.toFixed(2)}
                        </p>
                      )}
                      <SpendingBar spent={weekSpend} limit={weeklyLimit} />
                    </div>

                    <div className="p-4 rounded-2xl bg-(--bg-secondary) border border-(--border-card)">
                      <div className="flex justify-between items-start mb-2">
                        <span className="text-[10px] font-bold text-(--text-muted) uppercase tracking-widest">
                          Monthly Total
                        </span>
                        <Calendar size={14} className="text-blue-500" />
                      </div>
                      <p className="text-2xl font-bold text-(--text-primary)">
                        ${monthSpend.toFixed(2)}
                      </p>
                      <p className="text-xs text-(--text-muted) mt-1 italic">
                        Current billing period
                      </p>
                    </div>
                  </div>

                  <form
                    action={handleSaveLimits}
                    className="bg-(--bg-tertiary)/30 p-5 rounded-2xl border border-(--border-card)"
                  >
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-5 mb-5">
                      {[
                        {
                          label: "Daily Limit",
                          name: "daily",
                          val: dailyLimit,
                        },
                        {
                          label: "Weekly Limit",
                          name: "weekly",
                          val: weeklyLimit,
                        },
                        {
                          label: "Alert Threshold",
                          name: "approval",
                          val: student.childProfile?.approvalThreshold,
                        },
                      ].map((input) => (
                        <div key={input.name} className="flex flex-col gap-2">
                          <label className="text-[10px] font-extrabold text-(--text-secondary) uppercase tracking-wider ml-1">
                            {input.label}
                          </label>
                          <div className="relative">
                            <span className="absolute left-3 top-1/2 -translate-y-1/2 text-(--text-muted)">
                              <DollarSign size={14} />
                            </span>
                            <input
                              name={input.name}
                              type="number"
                              step="0.01"
                              defaultValue={input.val ?? ""}
                              placeholder="No limit"
                              className="w-full pl-8 pr-3 py-2.5 text-sm rounded-xl border border-(--border-input) bg-(--bg-card) text-(--text-primary) focus:ring-2 ring-(--accent)/20 outline-none transition-all"
                            />
                          </div>
                        </div>
                      ))}
                    </div>
                    <button
                      type="submit"
                      className="w-full py-3 bg-(--text-primary) text-(--bg-card) rounded-xl text-sm font-bold hover:opacity-90 transition-all flex items-center justify-center gap-2"
                    >
                      <Save size={18} /> Save Preferences
                    </button>
                  </form>
                </div>
              );
            })
          }
        </div>

        {/* Right Column: Transaction history */}
        <div className="lg:col-span-4">
          <div className="bg-(--bg-card) border border-(--border-card) rounded-3xl p-6 shadow-sm">
            <h2 className="font-bold text-lg text-(--text-primary) mb-6 flex items-center gap-2">
              <CreditCard size={20} className="text-(--accent)" /> Transaction
              History
            </h2>
            {transactions.length === 0 ?
              <div className="text-center py-12">
                <div className="w-12 h-12 bg-(--bg-tertiary) rounded-full flex items-center justify-center mx-auto mb-3">
                  <AlertCircle
                    className="text-(--text-muted)"
                    size={24}
                    strokeWidth={1.5}
                  />
                </div>
                <p className="text-sm text-(--text-muted) font-medium">
                  No activity recorded yet.
                </p>
              </div>
            : <div className="flex flex-col gap-5">
                {transactions.slice(0, 10).map((tx) => {
                  const Icon =
                    tx.status === "success" ? CheckCircle2
                    : tx.status === "failed" ? XCircle
                    : RefreshCcw;
                  const statusColor =
                    tx.status === "success" ? "text-emerald-500"
                    : tx.status === "failed" ? "text-red-500"
                    : "text-blue-500";

                  return (
                    <div
                      key={tx.id}
                      className="flex items-center justify-between pb-4 border-b border-(--border-card) last:border-0 last:pb-0"
                    >
                      <div className="flex items-center gap-3">
                        <div
                          className={`p-2 rounded-xl bg-(--bg-tertiary) ${statusColor}`}
                        >
                          <Icon size={16} />
                        </div>
                        <div>
                          <p className="text-sm font-bold text-(--text-primary) capitalize">
                            {tx.paymentMethod?.replace("_", " ")}
                          </p>
                          <p className="text-[10px] text-(--text-muted) font-semibold uppercase">
                            {tx.processedAt ?
                              new Date(tx.processedAt).toLocaleDateString(
                                "en-US",
                                { month: "short", day: "numeric" },
                              )
                            : "Pending"}
                          </p>
                        </div>
                      </div>
                      <div className="text-right">
                        <p className="text-sm font-bold text-(--text-primary)">
                          ${parseFloat(tx.amount).toFixed(2)}
                        </p>
                        <p
                          className={`text-[10px] font-bold uppercase ${statusColor}`}
                        >
                          {tx.status}
                        </p>
                      </div>
                    </div>
                  );
                })}
              </div>
            }
          </div>
        </div>
      </div>
    </div>
  );
}
