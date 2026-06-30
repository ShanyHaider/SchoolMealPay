"use client";

// app/(dashboard)/school-admin/_components/AdminTopbar.tsx

import { usePathname } from "next/navigation";
import { ThemeToggleButton, useTheme } from "@/components/ThemeProvider";
import { Search } from "lucide-react";

// Fixed: was /admin/... — corrected to /school-admin/...
const BREADCRUMB_MAP: Record<string, string> = {
  "/school-admin": "Dashboard",
  "/school-admin/students": "Students",
  "/school-admin/classes": "Classes",
  "/school-admin/canteen": "Canteen",
  "/school-admin/staff": "Staff",
  "/school-admin/menu": "Menu Schedule",
  "/school-admin/inventory": "Inventory",
  "/school-admin/reports": "Advanced Reports",
  "/school-admin/ai-nutrition": "AI Nutrition",
  "/school-admin/profile": "School Profile",
  "/school-admin/billing": "Billing",
};

export function SchoolAdminTopbar({ user }: { user: any }) {
  const pathname = usePathname();
  const { resolvedTheme, setTheme } = useTheme();
  const isDark = resolvedTheme === "dark";

  // Longest matching prefix wins — so /school-admin/students/xyz → "Students"
  const pageTitle =
    Object.entries(BREADCRUMB_MAP)
      .filter(([path]) => pathname === path || pathname.startsWith(path + "/"))
      .sort((a, b) => b[0].length - a[0].length)[0]?.[1] ?? "Dashboard";

  return (
    <header className="sticky top-0 z-30 flex h-16 w-full items-center justify-between border-b border-(--border-primary) bg-(--bg-primary)/80 backdrop-blur-md px-4 sm:px-6 lg:px-8">
      {/* Left: page title — pl-12 clears the mobile menu button */}
      <div className="flex flex-col justify-center pl-12 lg:pl-0">
        <h2 className="text-sm font-semibold text-(--text-primary) md:text-base leading-none mb-1">
          {pageTitle}
        </h2>
        <p className="text-[11px] text-(--text-muted) hidden sm:block leading-none">
          Manage your school&apos;s canteen system
        </p>
      </div>

      {/* Right: utilities */}
      <div className="flex items-center gap-2 sm:gap-3">
        {/* Search */}
        <div className="hidden md:flex items-center gap-2 rounded-lg border border-(--border-input) bg-(--bg-secondary) px-3 py-1.5 focus-within:ring-1 focus-within:ring-(--accent) transition-all">
          <Search size={16} className="text-(--text-muted)" />
          <input
            type="text"
            placeholder="Search panels..."
            className="w-[180px] bg-transparent text-[13px] text-(--text-primary) outline-none placeholder:text-(--text-muted)"
          />
        </div>

        {/* Theme toggle */}
        <ThemeToggleButton />
      </div>
    </header>
  );
}
