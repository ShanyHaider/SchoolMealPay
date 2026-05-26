"use client";

import { ArrowDown } from "lucide-react";

const STEPS = [
  {
    number: "01",
    title: "Parents order meals",
    description:
      "Browse menus, nutrition info, and pre-order meals up to 7 days ahead.",
  },
  {
    number: "02",
    title: "Canteen prepares",
    description:
      "Staff receive orders instantly with allergy and dietary information.",
  },
  {
    number: "03",
    title: "Students collect",
    description:
      "Students scan their QR code and collect meals instantly without queues.",
  },
];

export function HowItWorks() {
  return (
    <section className="relative px-4 py-28 sm:px-6 lg:px-8">
      <div className="mx-auto max-w-5xl">
        {/* header */}
        <div className="mx-auto max-w-2xl text-center">
          <div className="mb-4 inline-flex rounded-full border border-zinc-200/60 bg-white/60 px-4 py-1.5 text-xs font-medium text-zinc-600 backdrop-blur dark:border-zinc-800 dark:bg-zinc-900/60 dark:text-zinc-300">
            Workflow
          </div>

          <h2 className="text-4xl font-black tracking-tighter text-zinc-950 dark:text-white sm:text-5xl">
            How it works
          </h2>
        </div>

        {/* steps */}
        <div className="mt-20 space-y-5">
          {STEPS.map((step, idx) => (
            <div key={step.number}>
              <div className="rounded-3xl border border-zinc-200/60 bg-white/70 p-8 shadow-sm backdrop-blur dark:border-zinc-800 dark:bg-zinc-900/60">
                <div className="flex flex-col gap-5 md:flex-row md:items-start md:justify-between">
                  <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-zinc-100 text-sm font-bold text-zinc-950 dark:bg-zinc-800 dark:text-white">
                    {step.number}
                  </div>

                  <div className="flex-1 md:px-6">
                    <h3 className="text-xl font-semibold tracking-tight text-zinc-950 dark:text-white">
                      {step.title}
                    </h3>

                    <p className="mt-3 max-w-2xl text-sm leading-7 text-zinc-600 dark:text-zinc-400">
                      {step.description}
                    </p>
                  </div>
                </div>
              </div>

              {idx !== STEPS.length - 1 && (
                <div className="flex justify-center py-5">
                  <ArrowDown className="text-zinc-400" size={18} />
                </div>
              )}
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
