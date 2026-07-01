// app/(dashboard)/error.tsx
"use client";

import { useEffect } from "react";
import Link from "next/link";
import { AlertTriangle, RefreshCw } from "lucide-react";

export default function DashboardError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    console.error("[DashboardError]", error);
  }, [error]);

  // GuardError instances lose their prototype chain across the server/client
  // boundary in Next's error serialization, so match on name instead of
  // instanceof.
  const isGuardError = error.name === "GuardError";
  const isInfraError = error.name === "GuardInfraError";

  const code = (error as any).code as string | undefined;

  if (isGuardError && code === "UNAUTHORIZED") {
    return (
      <ErrorScreen
        title="Sign in required"
        message="You need to be signed in to view this page."
        actionHref="/sign-in"
        actionLabel="Sign in"
      />
    );
  }

  if (
    isGuardError &&
    code === "FORBIDDEN" &&
    error.message.includes("deactivated")
  ) {
    return (
      <ErrorScreen
        title="Account deactivated"
        message="Your account has been deactivated. Contact your school administrator if you believe this is a mistake."
        actionHref="/account-error?reason=deactivated"
        actionLabel="Learn more"
      />
    );
  }

  if (isGuardError && code === "FORBIDDEN") {
    return (
      <ErrorScreen
        title="Access denied"
        message="You don't have permission to view this page."
        actionHref="/dashboard"
        actionLabel="Go to dashboard"
      />
    );
  }

  if (isGuardError && code === "LIMIT_EXCEEDED") {
    return (
      <ErrorScreen
        title="Limit reached"
        message={error.message}
        actionHref="/school-admin/billing"
        actionLabel="Upgrade plan"
      />
    );
  }

  if (isGuardError && code === "FEATURE_GATED") {
    return (
      <ErrorScreen
        title="Feature not available"
        message={error.message}
        actionHref="/school-admin/billing"
        actionLabel="View plans"
      />
    );
  }

  if (isInfraError) {
    return (
      <ErrorScreen
        title="Something went wrong"
        message="We couldn't load this page right now. This is usually temporary."
        onRetry={reset}
        retryLabel="Try again"
      />
    );
  }

  // Unknown error — generic fallback, never show raw error.message to users
  return (
    <ErrorScreen
      title="Unexpected error"
      message="Something went wrong loading this page."
      onRetry={reset}
      retryLabel="Try again"
    />
  );
}

function ErrorScreen({
  title,
  message,
  actionHref,
  actionLabel,
  onRetry,
  retryLabel,
}: {
  title: string;
  message: string;
  actionHref?: string;
  actionLabel?: string;
  onRetry?: () => void;
  retryLabel?: string;
}) {
  return (
    <div className="flex min-h-[60vh] flex-col items-center justify-center gap-4 px-4 text-center">
      <AlertTriangle size={32} className="text-amber-500" />
      <h2 className="text-lg font-bold">{title}</h2>
      <p className="max-w-sm text-sm text-zinc-500">{message}</p>
      {actionHref && actionLabel && (
        <Link
          href={actionHref}
          className="rounded-xl bg-zinc-950 px-4 py-2 text-xs font-bold text-white dark:bg-white dark:text-zinc-950"
        >
          {actionLabel}
        </Link>
      )}
      {onRetry && (
        <button
          onClick={onRetry}
          className="flex items-center gap-1.5 rounded-xl border border-zinc-200 px-4 py-2 text-xs font-bold dark:border-zinc-800"
        >
          <RefreshCw size={12} />
          {retryLabel}
        </button>
      )}
    </div>
  );
}
