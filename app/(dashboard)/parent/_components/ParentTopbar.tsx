"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { ThemeToggleButton, useTheme } from "@/components/ThemeProvider";
import { Search, Bell } from "lucide-react";
import type { usersTable } from "@/drizzle/schema";
import { UserMenu } from "@/components/userMenu/UserMenu";
import { useUser } from "@clerk/nextjs";

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

interface ParentTopbarProps {
  user: User;
}

export function ParentTopbar({ user }: ParentTopbarProps) {
  const pathname = usePathname();
  const { isLoaded } = useUser();

  const pageTitle =
    Object.entries(BREADCRUMB_MAP).find(
      ([path]) => pathname === path || pathname.startsWith(`${path}/`),
    )?.[1] ?? "Dashboard";

  return (
    <header className="sticky top-0 z-30 flex h-16 w-full items-center justify-between border-b border-(--border-primary) bg-(--bg-primary)/80 backdrop-blur-md px-4 sm:px-6 lg:px-8">
      {/* Left Side: Dynamic Titles with offset padding on mobile to clear hamburger */}
      <div className="flex flex-col justify-center pl-12 lg:pl-0">
        <h2 className="text-sm font-semibold text-(--text-primary) md:text-base leading-none mb-1">
          {pageTitle}
        </h2>
        <p className="text-[11px] text-(--text-muted) hidden sm:block leading-none">
          Monitor meals and manage school child balances
        </p>
      </div>

      {/* Right Side: Quick Action Utilities */}
      <div className="flex items-center gap-2 sm:gap-3">
        {/* Search Bar */}
        <div className="hidden md:flex items-center gap-2 rounded-lg border border-(--border-input) bg-(--bg-secondary) px-3 py-1.5 focus-within:ring-1 focus-within:ring-(--accent) transition-all">
          <Search size={16} className="text-(--text-muted)" />
          <input
            type="text"
            placeholder="Search panels..."
            className="w-45 bg-transparent text-[13px] text-(--text-primary) outline-none placeholder:text-(--text-muted)"
          />
        </div>
        {/* Animated Theme Switcher */}
        <ThemeToggleButton />

        {/* Account Notifications Link */}
        <Link
          href="/parent/notifications"
          className="flex h-9 w-9 items-center justify-center rounded-lg border border-(--border-primary) bg-(--bg-secondary) text-(--text-secondary) hover:bg-(--bg-tertiary) hover:text-(--text-primary) transition-colors relative"
        >
          <Bell size={16} />
          <span className="absolute top-2 right-2.5 w-2 h-2 bg-red-500 rounded-full border-2 border-(--bg-primary)" />
        </Link>
        {/* Profile Avatar Trigger Link */}
        <UserMenu isLoaded={isLoaded} />
      </div>
    </header>
  );
}
