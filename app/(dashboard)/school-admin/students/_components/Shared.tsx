import { AlertCircle } from "lucide-react";

export const inputCls =
  "w-full rounded-lg border border-(--border-input) bg-(--bg-secondary) px-3 py-2 text-sm text-(--text-primary) placeholder:text-(--text-muted) outline-none focus:ring-1 focus:ring-(--accent) transition-shadow";

export function FieldError({ message }: { message?: string }) {
  if (!message) return null;
  return <p className="mt-1 text-xs text-red-500">{message}</p>;
}

// Shared.tsx — add this alongside inputCls
export const selectCls =
  "w-full appearance-none rounded-lg border px-3 py-2.5 pr-9 text-sm outline-none transition-colors " +
  "bg-(--bg-secondary) border-(--border-input) text-(--text-primary) " +
  "hover:border-(--border-card) focus:border-(--accent) focus:ring-1 focus:ring-(--accent)/20";

export function ServerError({ message }: { message: string }) {
  return (
    <div className="flex items-center gap-2 rounded-lg bg-red-500/10 px-3 py-2 text-xs text-red-500 mb-3">
      <AlertCircle size={13} className="shrink-0" />
      <span className="break-all whitespace-pre-wrap">{message}</span>
    </div>
  );
}

export const isValidUrl = (str: string) => {
  try {
    new URL(str);
    return true;
  } catch {
    return false;
  }
};

export const ALLERGEN_COLORS: Record<string, string> = {
  nuts: "#f59e0b",
  gluten: "#f97316",
  dairy: "#3b82f6",
  eggs: "#eab308",
  soy: "#84cc16",
  shellfish: "#06b6d4",
  fish: "#6366f1",
  sesame: "#ec4899",
};
