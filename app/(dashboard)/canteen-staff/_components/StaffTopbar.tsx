"use client";

import { useEffect, useState } from "react";
import { usePathname } from "next/navigation";
import { ThemeToggleButton, useTheme } from "@/components/ThemeProvider";
import { Clock, Search } from "lucide-react";

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

export function StaffTopbar({ canteen }: StaffTopbarProps) {
  const pathname = usePathname();
  const [time, setTime] = useState("");

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
        {/* Search */}
        <div className="hidden md:flex items-center gap-2 rounded-lg border border-(--border-input) bg-(--bg-secondary) px-3 py-1.5 focus-within:ring-1 focus-within:ring-(--accent) transition-all">
          <Search size={16} className="text-(--text-muted)" />
          <input
            type="text"
            placeholder="Search panels..."
            className="w-45 bg-transparent text-[13px] text-(--text-primary) outline-none placeholder:text-(--text-muted)"
          />
        </div>

        {/* Theme toggle */}
        <ThemeToggleButton />
      </div>
    </header>
  );
}
