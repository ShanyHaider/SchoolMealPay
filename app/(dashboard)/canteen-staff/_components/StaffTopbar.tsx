"use client";

import React, { useEffect, useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useTheme } from "@/components/ThemeProvider";
import { motion, AnimatePresence } from "framer-motion";
import { Clock, Sun, Moon, Search, Bell } from "lucide-react";
import { UserMenu } from "@/components/userMenu/UserMenu";
import { useUser } from "@clerk/nextjs";

const BREADCRUMB_MAP: Record<string, string> = {
  "/canteen-staff": "Terminal Overview",
  "/canteen-staff/orders": "Live Orders",
  "/canteen-staff/qr-scan": "QR Pickup Scanner",
  "/canteen-staff/inventory": "Inventory Stock",
  "/canteen-staff/menu": "Today's Canteen Menu",
};

interface StaffTopbarProps {
  user: {
    name: string | null;
    imageUrl: string | null;
  };
  canteen: {
    name: string;
  } | null;
}

export function StaffTopbar({ user, canteen }: StaffTopbarProps) {
  const pathname = usePathname();
  const { resolvedTheme, setTheme } = useTheme();
  const isDark = resolvedTheme === "dark";
  const [time, setTime] = useState("");
  const { isSignedIn, isLoaded } = useUser();

  // Live running digital clock update tick
  useEffect(() => {
    const update = () =>
      setTime(
        new Date().toLocaleTimeString("en-US", {
          hour: "2-digit",
          minute: "2-digit",
        }),
      );
    update();
    const id = setInterval(update, 1000);
    return () => clearInterval(id);
  }, []);

  // Compute active page header mapping properties
  const pageTitle =
    Object.entries(BREADCRUMB_MAP).find(
      ([path]) => pathname === path || pathname.startsWith(`${path}/`),
    )?.[1] ?? "Canteen Terminal";

  return (
    <header className="sticky top-0 z-30 flex h-16 w-full items-center justify-between border-b border-(--border-primary) bg-(--bg-primary)/80 backdrop-blur-md px-4 sm:px-6 lg:px-8">
      {/* Left Side: Dynamic Workspace Titles (Offset on mobile to clear sidebar trigger) */}
      <div className="flex flex-col justify-center pl-12 lg:pl-0">
        <h2 className="text-sm font-semibold text-(--text-primary) md:text-base leading-none mb-1">
          {pageTitle}
        </h2>
        <div className="hidden sm:flex items-center gap-1.5 text-[11px] text-(--text-muted) leading-none">
          <Clock size={11} className="tabular-nums" />
          <span className="font-medium tabular-nums">{time}</span>
          <span>·</span>
          <span>{canteen?.name ?? "Canteen Terminal Operations"}</span>
        </div>
      </div>

      {/* Right Side: Action Utilities */}
      <div className="flex items-center gap-2 sm:gap-3">
        {/* Operations Fast Search Container */}
        <div className="hidden md:flex items-center gap-2 rounded-lg border border-(--border-input) bg-(--bg-secondary) px-3 py-1.5 focus-within:ring-1 focus-within:ring-amber-500 transition-all">
          <Search size={16} className="text-(--text-muted)" />
          <input
            type="text"
            placeholder="Search terminal..."
            className="w-[180px] bg-transparent text-[13px] text-(--text-primary) outline-none placeholder:text-(--text-muted)"
          />
        </div>

        {/* Animated Dark / Light Toggle Switcher */}
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
                <Sun size={16} className="text-amber-500" />
              : <Moon size={16} />}
            </motion.div>
          </AnimatePresence>
        </button>

        {/* Order Notifications Dispatch Center */}
        <Link
          href="/canteen-staff/orders"
          className="flex h-9 w-9 items-center justify-center rounded-lg border border-(--border-primary) bg-(--bg-secondary) text-(--text-secondary) hover:bg-(--bg-tertiary) hover:text-(--text-primary) transition-colors relative"
        >
          <Bell size={16} />
          <span className="absolute top-2 right-2.5 w-2 h-2 bg-amber-500 rounded-full border-2 border-(--bg-primary)" />
        </Link>

        {/* User Account Context Anchor */}
        <UserMenu isLoaded />
      </div>
    </header>
  );
}
