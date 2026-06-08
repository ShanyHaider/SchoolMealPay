import Link from "next/link";
import { headers } from "next/headers";

// ─── Shared layout wrapper ─────────────────────────────────────────────────

function ErrorShell({
  code,
  title,
  description,
  hint,
  action,
}: {
  code: string;
  title: string;
  description: string;
  hint?: string;
  action: { label: string; href: string };
}) {
  return (
    <div
      style={{ background: "var(--bg-secondary)", color: "var(--text-primary)" }}
      className="flex flex-col min-h-[calc(100vh-var(--nav-height))] items-center justify-center gap-3 px-4 text-center"
    >
      <p
        className="text-xs font-semibold tracking-widest uppercase mb-1"
        style={{ color: "var(--text-muted)" }}
      >
        {code}
      </p>
      <h1 className="text-3xl font-bold tracking-tight">{title}</h1>
      <p
        className="mt-1 text-sm max-w-sm leading-relaxed"
        style={{ color: "var(--text-secondary)" }}
      >
        {description}
      </p>
      {hint && (
        <p
          className="text-xs max-w-xs leading-relaxed"
          style={{ color: "var(--text-muted)" }}
        >
          {hint}
        </p>
      )}
      <Link
        href={action.href}
        style={{ color: "var(--text-muted)" }}
        className="mt-5 text-sm underline underline-offset-4 hover:opacity-70 transition-opacity"
      >
        {action.label}
      </Link>
    </div>
  );
}

// ─── /account-error page ───────────────────────────────────────────────────
// app/account-error/page.tsx
// Also used by the dashboard router after 5 failed setup attempts.

export function AccountErrorPage() {
  return (
    <ErrorShell
      code="Account Error"
      title="We couldn't set up your account"
      description="Your sign-in was successful but we weren't able to finish setting up your account profile."
      hint="This usually resolves itself. Try signing out and signing back in. If the problem persists, contact your school administrator."
      action={{ label: "Go to sign in", href: "/sign-in" }}
    />
  );
}

// ─── 404 page (default export) ────────────────────────────────────────────
// app/not-found.tsx

export default function NotFound() {
  return (
    <ErrorShell
      code="404"
      title="This page doesn't exist yet."
      description="The page you're looking for may have moved or never existed."
      action={{ label: "Go home", href: "/" }}
    />
  );
}