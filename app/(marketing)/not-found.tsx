import Link from "next/link";

export default function NotFound() {
  return (
    <div
      style={{
        background: "var(--bg-secondary)",
        color: "var(--text-primary)",
      }}
      className="flex flex-col min-h-[calc(100vh-var(--nav-height))] items-center justify-center gap-3"
    >
      <h1 className="text-4xl font-bold">404</h1>
      <p style={{ color: "var(--text-secondary)" }} className="mt-2">
        This page doesn't exist yet.
      </p>
      <Link
        href="/"
        style={{ color: "var(--text-muted)" }}
        className="mt-4 text-sm underline"
      >
        Go home
      </Link>
    </div>
  );
}
