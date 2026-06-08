"use client";

// app/(dashboard)/parent/_components/ParentTopbar.tsx
// Mirrors SchoolAdminTopbar. Adds: notification bell + UserMenu (matching ParentTopbar original intent).

import { usePathname } from "next/navigation";
import { useUser } from "@clerk/nextjs";
import { ThemeToggleButton } from "@/components/ThemeProvider";
import { Search } from "lucide-react";
import type { usersTable } from "@/drizzle/schema";

type User = typeof usersTable.$inferSelect;

const BREADCRUMB_MAP: Record<string, string> = {
  "/parent": "Dashboard",
  "/parent/children": "Children",
  "/parent/menu": "Menu",
  "/parent/orders": "Orders",
  "/parent/nutrition": "Nutrition",
  "/parent/spending": "Spending",
  "/parent/notifications": "Notifications",
  "/parent/settings": "Settings",
};

export function ParentTopbar({ user }: { user: User }) {
  const pathname = usePathname();
  const { isLoaded } = useUser();

  // Longest prefix wins — /parent/children/link → "Children"
  const pageTitle =
    Object.entries(BREADCRUMB_MAP)
      .filter(([path]) => pathname === path || pathname.startsWith(path + "/"))
      .sort((a, b) => b[0].length - a[0].length)[0]?.[1] ?? "Dashboard";

  return (
    <header className="sticky top-0 z-30 flex h-16 w-full items-center justify-between border-b border-[var(--border-primary)] bg-[var(--bg-primary)]/80 backdrop-blur-md px-4 sm:px-6 lg:px-8">
      {/* Left: page title — pl-12 clears mobile hamburger */}
      <div className="flex flex-col justify-center pl-12 lg:pl-0">
        <h2 className="text-sm font-semibold text-[var(--text-primary)] md:text-base leading-none mb-1">
          {pageTitle}
        </h2>
        <p className="text-[11px] text-[var(--text-muted)] hidden sm:block leading-none">
          Monitor meals and manage your children&apos;s accounts
        </p>
      </div>

      {/* Right: utilities */}
      <div className="flex items-center gap-2 sm:gap-3">
        {/* Search */}
        <div className="hidden md:flex items-center gap-2 rounded-lg border border-[var(--border-input)] bg-[var(--bg-secondary)] px-3 py-1.5 focus-within:ring-1 focus-within:ring-[var(--accent)] transition-all">
          <Search size={16} className="text-[var(--text-muted)]" />
          <input
            type="text"
            placeholder="Search panels..."
            className="w-[180px] bg-transparent text-[13px] text-[var(--text-primary)] outline-none placeholder:text-[var(--text-muted)]"
          />
        </div>

        {/* Theme toggle */}
        <ThemeToggleButton />
      </div>
    </header>
  );
}