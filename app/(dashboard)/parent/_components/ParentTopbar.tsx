"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useTheme } from "@/Components/ThemeProvider";
import { motion, AnimatePresence } from "framer-motion";
import { Search, Sun, Moon, Bell, Menu } from "lucide-react";
import { cn } from "@/lib/utils";
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

interface ParentTopbarProps {
  user: User;
}

export function ParentTopbar({ user }: ParentTopbarProps) {
  const pathname = usePathname();
  const { resolvedTheme, setTheme } = useTheme();
  const isDark = resolvedTheme === "dark";

  // Find the match or handle sub-routes (e.g., /parent/children/1)
  const pageTitle =
    Object.entries(BREADCRUMB_MAP).find(
      ([path]) => pathname === path || pathname.startsWith(`${path}/`),
    )?.[1] ?? "Dashboard";

  return (
    <header className="sticky top-0 z-30 flex h-16 w-full items-center justify-between border-b border-[var(--border-primary)] bg-[var(--bg-primary)] px-4">
      <div className="flex items-center gap-4">
        {/* 1. The Mobile Menu Button (Hamburger) */}
        <button className="lg:hidden p-2 rounded-lg border border-[var(--border-primary)] bg-[var(--bg-secondary)] hover:bg-[var(--bg-tertiary)] transition-colors">
          <Menu size={20} className="text-[var(--text-primary)]" />
        </button>
        {/* Left Side: Title */}
        {/* 2. The Page Title (Dashboard) */}
        <h2 className="text-sm font-semibold text-[var(--text-primary)] md:text-base">
          Dashboard
        </h2>
      </div>

      {/* Right Side: Tools */}
      <div className="flex items-center gap-3">
        {/* Search Bar */}
        <div className="hidden md:flex items-center gap-2 rounded-lg border border-[var(--border-input)] bg-[var(--bg-secondary)] px-3 py-1.5 focus-within:ring-1 focus-within:ring-[var(--accent)] transition-all">
          <Search size={16} className="text-[var(--text-muted)]" />
          <input
            type="text"
            placeholder="Search..."
            className="w-[180px] bg-transparent text-[13px] text-[var(--text-primary)] outline-none placeholder:text-[var(--text-muted)]"
          />
        </div>

        {/* Theme Toggle */}
        <button
          onClick={() => setTheme(isDark ? "light" : "dark")}
          className="flex h-9 w-9 items-center justify-center rounded-lg border border-[var(--border-primary)] bg-[var(--bg-secondary)] text-[var(--text-secondary)] hover:bg-[var(--bg-tertiary)] hover:text-[var(--text-primary)] transition-colors"
          aria-label="Toggle theme"
        >
          <AnimatePresence mode="wait" initial={false}>
            <motion.div
              key={isDark ? "sun" : "moon"}
              initial={{ opacity: 0, rotate: -30, scale: 0.8 }}
              animate={{ opacity: 1, rotate: 0, scale: 1 }}
              exit={{ opacity: 0, rotate: 30, scale: 0.8 }}
              transition={{ duration: 0.18 }}
            >
              {isDark ?
                <Sun size={18} />
              : <Moon size={18} />}
            </motion.div>
          </AnimatePresence>
        </button>

        {/* Notifications */}
        <Link
          href="/parent/notifications"
          className="flex h-9 w-9 items-center justify-center rounded-lg border border-[var(--border-primary)] bg-[var(--bg-secondary)] text-[var(--text-secondary)] hover:bg-[var(--bg-tertiary)] hover:text-[var(--text-primary)] transition-colors relative"
        >
          <Bell size={18} />
          {/* Optional: Notification dot */}
          <span className="absolute top-2 right-2.5 w-2 h-2 bg-red-500 rounded-full border-2 border-[var(--bg-primary)]" />
        </Link>

        {/* Avatar */}
        <Link
          href="/parent/settings"
          className="ml-1 flex h-8 w-8 items-center justify-center overflow-hidden rounded-full border-2 border-[var(--border-primary)] bg-[var(--bg-tertiary)] shadow-sm hover:opacity-80 transition-opacity"
        >
          {user.imageUrl ?
            <img
              src={user.imageUrl}
              alt={user.name}
              className="h-full w-full object-cover"
            />
          : <span className="text-[12px] font-bold text-[var(--text-primary)]">
              {user.name.charAt(0).toUpperCase()}
            </span>
          }
        </Link>
      </div>
    </header>
  );
}
