"use client";

interface NutrientBarProps {
  label: string;
  icon: React.ReactNode;
  value: number;
  target: number;
  unit: string;
  color: string;
}

export function NutrientBar({
  label,
  icon,
  value,
  target,
  unit,
  color,
}: NutrientBarProps) {
  const pct = Math.min((value / target) * 100, 100);

  // Logic for status labeling
  let status = "On Track";
  let statusClass = "text-emerald-600 bg-emerald-50 dark:bg-emerald-500/10";

  if (pct < 50) {
    status = "Low Intake";
    statusClass = "text-red-500 bg-red-50 dark:bg-red-500/10";
  } else if (pct < 80) {
    status = "Moderate";
    statusClass = "text-amber-600 bg-amber-50 dark:bg-amber-500/10";
  }

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <div className={`p-1.5 rounded-lg ${color} text-white`}>{icon}</div>
          <span className="text-sm font-bold text-(--text-primary)">
            {label}
          </span>
        </div>
        <div className="text-right">
          <span
            className={`text-[10px] px-2 py-0.5 rounded-full font-bold uppercase tracking-wider ${statusClass}`}
          >
            {status}
          </span>
        </div>
      </div>

      <div className="space-y-1.5">
        <div className="flex justify-between text-xs mb-1">
          <span className="text-(--text-secondary) font-medium">
            {value}
            {unit} <span className="text-(--text-muted) font-normal">avg</span>
          </span>
          <span className="text-(--text-muted)">
            Target: {target}
            {unit}
          </span>
        </div>
        <div className="relative h-3 bg-(--bg-tertiary) rounded-full overflow-hidden">
          {/* Background pattern for the bar */}
          <div className="absolute inset-0 opacity-10 bg-[url('https://www.transparenttextures.com/patterns/carbon-fibre.png')]" />
          <div
            className={`h-full rounded-full transition-all duration-1000 ease-out shadow-sm ${color}`}
            style={{ width: `${pct}%` }}
          />
        </div>
      </div>
    </div>
  );
}
