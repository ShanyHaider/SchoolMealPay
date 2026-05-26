import Link from "next/link";

export function CTASection() {
  return (
    <section className="relative overflow-hidden px-4 py-28 sm:px-6 lg:px-8">
      {/* glow */}
      <div className="absolute inset-0 -z-10">
        <div className="absolute left-1/2 top-1/2 h-125 w-125 -translate-x-1/2 -translate-y-1/2 rounded-full bg-violet-500/20 blur-3xl" />
      </div>

      <div className="mx-auto max-w-5xl overflow-hidden rounded-[2.5rem] border border-zinc-200/60 bg-linear-to-br from-zinc-100 to-white p-12 shadow-2xl dark:border-zinc-800 dark:from-zinc-900 dark:to-zinc-950 md:p-20">
        <div className="mx-auto max-w-3xl text-center">
          <h2 className="text-4xl font-black tracking-tighter text-zinc-950 dark:text-white sm:text-5xl">
            Ready to transform your school canteen?
          </h2>

          <p className="mt-6 text-lg leading-8 text-zinc-600 dark:text-zinc-400">
            Join schools saving time, reducing food waste, and improving student
            nutrition experiences.
          </p>

          <div className="mt-10 flex flex-col gap-4 sm:flex-row sm:justify-center">
            <Link
              href="/sign-up"
              className="inline-flex items-center justify-center rounded-2xl bg-zinc-950 px-6 py-3 text-sm font-semibold text-white transition hover:bg-zinc-800 dark:bg-white dark:text-black dark:hover:bg-zinc-200"
            >
              Start free
            </Link>

            <button className="inline-flex items-center justify-center rounded-2xl border border-zinc-200 bg-white/70 px-6 py-3 text-sm font-semibold text-zinc-700 backdrop-blur transition hover:bg-zinc-100 dark:border-zinc-800 dark:bg-zinc-900/60 dark:text-zinc-200 dark:hover:bg-zinc-800">
              Schedule demo
            </button>
          </div>
        </div>
      </div>
    </section>
  );
}
