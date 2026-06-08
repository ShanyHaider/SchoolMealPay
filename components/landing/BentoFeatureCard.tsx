import { LucideIcon } from "lucide-react";

interface BentoFeatureCardProps {
  title: string;
  description: string;
  icon: LucideIcon;
  className?: string;
}

export function BentoFeatureCard({
  title,
  description,
  icon: Icon,
  className = "",
}: BentoFeatureCardProps) {
  return (
    <div
      className={`group relative overflow-hidden rounded-3xl border border-zinc-200/60 bg-white/70 p-8 shadow-sm backdrop-blur transition-all duration-300 hover:-translate-y-1 hover:shadow-2xl dark:border-zinc-800 dark:bg-zinc-900/60 ${className}`}
    >
      {/* gradient hover glow */}
      <div className="absolute inset-0 bg-linear-to-br from-blue-500/0 via-violet-500/0 to-fuchsia-500/0 opacity-0 transition-opacity duration-500 group-hover:opacity-100 group-hover:from-blue-500/5 group-hover:via-violet-500/5 group-hover:to-fuchsia-500/5" />

      <div className="relative z-10">
        <div className="mb-6 flex h-14 w-14 items-center justify-center rounded-2xl bg-zinc-100 text-zinc-950 transition-colors group-hover:bg-zinc-200 dark:bg-zinc-800 dark:text-white dark:group-hover:bg-zinc-700">
          <Icon size={22} strokeWidth={1.8} />
        </div>

        <h3 className="text-lg font-semibold tracking-tight text-zinc-950 dark:text-white">
          {title}
        </h3>

        <p className="mt-3 text-sm leading-7 text-zinc-600 dark:text-zinc-400">
          {description}
        </p>
      </div>
    </div>
  );
}
