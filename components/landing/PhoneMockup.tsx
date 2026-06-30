"use client";

import { QrCode, Wallet, CheckCircle2, Bell } from "lucide-react";

export function PhoneMockup() {
  return (
    <div className="relative flex items-center justify-center">
      {/* Glow Effect */}
      <div className="absolute h-104 w-104 rounded-full bg-violet-500/15 blur-3xl" />

      {/* Phone Case */}
      <div className="relative w-full max-w-sm rounded-[3rem] border border-(--border-primary) bg-(--bg-secondary) p-3 shadow-[0_40px_120px_rgba(0,0,0,0.15)] dark:border-white/10 dark:bg-zinc-900 dark:shadow-[0_40px_120px_rgba(0,0,0,0.45)]">
        {/* Internal Screen */}
        <div className="overflow-hidden rounded-[2.4rem] bg-(--bg-primary) dark:bg-zinc-950">
          {/* Dynamic Island Notch */}
          <div className="flex justify-center py-3">
            <div className="h-6 w-28 rounded-full bg-black" />
          </div>

          <div className="space-y-5 p-5">
            {/* App Header */}
            <div className="flex items-start justify-between">
              <div>
                <div className="text-xs text-(--text-muted)">
                  Good morning 👋
                </div>
                <div className="mt-1 text-sm font-bold text-(--text-primary) dark:text-white">
                  SchoolMealPay
                </div>
              </div>

              <div className="flex h-8 w-8 items-center justify-center rounded-full border border-(--border-primary) bg-(--bg-secondary) dark:border-zinc-800 dark:bg-zinc-900">
                <Bell
                  size={14}
                  className="text-(--text-muted) dark:text-zinc-300"
                />
              </div>
            </div>

            {/* Order Card */}
            <div className="rounded-2xl border border-(--border-primary) bg-(--bg-secondary) p-4 dark:border-zinc-800 dark:bg-zinc-900">
              <div className="mb-3 text-[10px] font-semibold uppercase tracking-[0.18em] text-(--text-muted) dark:text-zinc-500">
                Today's Order
              </div>

              <div className="flex items-center gap-3">
                <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-(--bg-tertiary) text-lg dark:bg-zinc-800">
                  🍱
                </div>

                <div className="flex-1">
                  <div className="text-sm font-semibold text-(--text-primary) dark:text-white">
                    Grilled Chicken Rice
                  </div>
                  <div className="text-xs text-(--text-muted) dark:text-zinc-500">
                    520 cal · Protein 38g
                  </div>
                </div>

                <div className="flex items-center gap-1 rounded-full bg-emerald-500/10 px-2 py-1 text-[10px] font-semibold text-emerald-600 dark:text-emerald-400">
                  <CheckCircle2 size={10} />
                  Ready
                </div>
              </div>
            </div>

            {/* QR Collection Card */}
            <div className="rounded-2xl border border-(--border-primary) bg-(--bg-secondary) p-5 dark:border-zinc-800 dark:bg-zinc-900">
              <div className="mb-4 text-center text-[10px] font-semibold uppercase tracking-[0.2em] text-(--text-muted) dark:text-zinc-500">
                Scan to collect
              </div>

              <div className="flex justify-center">
                <div className="rounded-2xl bg-(--text-primary) p-4 text-(--bg-primary) shadow-inner dark:bg-white dark:text-black">
                  <QrCode size={92} strokeWidth={1.5} />
                </div>
              </div>
            </div>

            {/* Wallet Balance Card */}
            <div className="flex items-center justify-between rounded-2xl bg-linear-to-r from-blue-500 to-violet-500 px-4 py-4 shadow-sm">
              <div className="flex items-center gap-2">
                <Wallet size={16} className="text-white/90" />
                <div className="text-xs text-white/90">Wallet balance</div>
              </div>

              <div className="text-lg font-bold tracking-tight text-white">
                Rs. 2,450
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
