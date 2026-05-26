"use client";

import React from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useTheme } from "@/components/ThemeProvider";
import { motion, AnimatePresence } from "framer-motion";
import { Search, Sun, Moon, Bell } from "lucide-react";

const ADMIN_BREADCRUMB_MAP: Record<string, string> = {
  "/admin": "Dashboard",
  "/admin/classes": "Classes & Rooms",
  "/admin/students": "Students",
  "/admin/menu": "Menu Management",
  "/admin/orders": "Orders & Logs",
  "/admin/finances": "Finances",
  "/admin/staff": "Staff Directory",
  "/admin/settings": "Settings",
};

interface SchoolAdminTopbarProps {
  user: any;
}

export function SchoolAdminTopbar({ user }: SchoolAdminTopbarProps) {
  const pathname = usePathname();
  const { resolvedTheme, setTheme } = useTheme();
  const isDark = resolvedTheme === "dark";

  const pageTitle =
    Object.entries(ADMIN_BREADCRUMB_MAP).find(
      ([path]) => pathname === path || pathname.startsWith(`${path}/`),
    )?.[1] ?? "Dashboard";

  return (
    <header className="sticky top-0 z-30 flex h-16 w-full items-center justify-between border-b border-(--border-primary) bg-(--bg-primary)/80 backdrop-blur-md px-4 sm:px-6 lg:px-8">
      {/* Left Section: Context Titles */}
      {/* pl-12 shifts the text over on mobile viewports to make clear room for the menu button */}
      <div className="flex flex-col justify-center pl-12 lg:pl-0">
        <h2 className="text-sm font-semibold text-(--text-primary) md:text-base leading-none mb-1">
          {pageTitle}
        </h2>
        <p className="text-[11px] text-(--text-muted) hidden sm:block leading-none">
          Manage your school&apos;s canteen system
        </p>
      </div>

      {/* Right Section: Interactive Tool Utilities */}
      <div className="flex items-center gap-2 sm:gap-3">
        {/* Global Search Bar */}
        <div className="hidden md:flex items-center gap-2 rounded-lg border border-(--border-input) bg-(--bg-secondary) px-3 py-1.5 focus-within:ring-1 focus-within:ring-(--accent) transition-all">
          <Search size={16} className="text-(--text-muted)" />
          <input
            type="text"
            placeholder="Search panels..."
            className="w-[180px] bg-transparent text-[13px] text-(--text-primary) outline-none placeholder:text-(--text-muted)"
          />
        </div>

        {/* Animated Theme Switcher */}
        <button
          onClick={() => setTheme(isDark ? "light" : "dark")}
          className="flex h-9 w-9 items-center justify-center rounded-lg border border-(--border-primary) bg-(--bg-secondary) text-(--text-secondary) hover:bg-(--bg-tertiary) hover:text-(--text-primary) transition-colors"
          aria-label="Toggle theme"
        >
          <AnimatePresence mode="wait" initial={false}>
            <motion.div
              key={isDark ? "sun" : "moon"}
              initial={{ opacity: 0, rotate: -30, scale: 0.8 }}
              animate={{ opacity: 1, rotate: 0, scale: 1 }}
              exit={{ opacity: 0, rotate: 30, scale: 0.8 }}
              transition={{ duration: 0.18 }}
              className="flex items-center justify-center"
            >
              {isDark ?
                <Sun size={16} />
              : <Moon size={16} />}
            </motion.div>
          </AnimatePresence>
        </button>

        {/* Activity Alerts Notifications */}
        <button className="flex h-9 w-9 items-center justify-center rounded-lg border border-(--border-primary) bg-(--bg-secondary) text-(--text-secondary) hover:bg-(--bg-tertiary) hover:text-(--text-primary) transition-colors">
          <Bell size={16} />
        </button>

        {/* User Status Profile Link */}
        <div className="w-8 h-8 rounded-full bg-zinc-800 border border-(--border-primary) flex items-center justify-center overflow-hidden shadow-sm shrink-0">
          {user.imageUrl ?
            <img
              src={user.imageUrl}
              alt={user.name}
              className="w-full h-full object-cover"
            />
          : <span className="text-xs font-bold text-white uppercase">
              {user.name?.[0] || "A"}
            </span>
          }
        </div>
      </div>
    </header>
  );
}
