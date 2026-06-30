"use client";

// app/(dashboard)/system-admin/_components/SystemAdminSidebar.tsx

import React, { useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";
import {
  LayoutDashboard,
  PanelLeftClose,
  PanelLeftOpen,
  Menu,
  ShieldCheck,
  Users,
  Building2,
  FileSpreadsheet,
  Activity,
  AlertTriangle,
} from "lucide-react";

import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import {
  Sheet,
  SheetContent,
  SheetTrigger,
  SheetTitle,
  SheetDescription,
} from "@/components/ui/sheet";

// Shared Popover Imports

import { cn } from "@/lib/utils";
import type { usersTable } from "@/drizzle/schema";
import { SidebarProfilePopover } from "../../../../components/SidebarProfilePopover";

type User = typeof usersTable.$inferSelect;

type NavItem = {
  href: string;
  label: string;
  icon: React.ElementType;
  exact?: boolean;
  badge?: string;
};

const NAV_ITEMS: NavItem[] = [
  {
    href: "/system-admin",
    label: "Overview",
    icon: LayoutDashboard,
    exact: true,
  },
  {
    href: "/system-admin/users",
    label: "User Ledger",
    icon: Users,
  },
  {
    href: "/system-admin/schools",
    label: "Schools",
    icon: Building2,
  },
  {
    href: "/system-admin/audit",
    label: "Audit Trail",
    icon: FileSpreadsheet,
  },
  {
    href: "/system-admin/health",
    label: "System Health",
    icon: Activity,
  },
];

// ─── Inner sidebar ────────────────────────────────────────────────────────────

function SystemAdminSidebarInner({
  user,
  pathname,
  isCollapsed = false,
  onToggle,
  closeMobileMenu,
}: {
  user: User;
  pathname: string;
  isCollapsed?: boolean;
  onToggle?: () => void;
  closeMobileMenu?: () => void;
}) {
  return (
    <div className="flex flex-col h-full py-3 px-3">
      {/* Header */}
      <div
        className={cn(
          "flex items-center mb-6 px-3 transition-all duration-300 min-h-[44px]",
          isCollapsed ? "justify-center" : "justify-between",
        )}
      >
        <AnimatePresence mode="wait">
          {!isCollapsed && (
            <motion.div
              key="logo"
              initial={{ opacity: 0, x: -10 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -10 }}
              className="flex items-center gap-3 shrink-0"
            >
              <div className="w-9 h-9 bg-zinc-950 dark:bg-white text-white dark:text-zinc-950 rounded-xl flex items-center justify-center shadow-md">
                <ShieldCheck size={18} />
              </div>
              <div className="flex flex-col leading-none">
                <span className="font-semibold text-(--text-primary)">
                  Super Console
                </span>
                <span className="text-[10px] uppercase tracking-[0.2em] text-(--text-muted) font-bold mt-1">
                  Root Access
                </span>
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        {onToggle && (
          <button
            onClick={onToggle}
            className={cn(
              "p-2 hover:bg-(--bg-tertiary) rounded-lg text-(--text-muted) hover:text-(--text-primary) transition-colors cursor-pointer",
              isCollapsed && "mx-auto",
            )}
          >
            {isCollapsed ?
              <PanelLeftOpen size={21} />
            : <PanelLeftClose size={21} />}
          </button>
        )}
      </div>

      {/* Warning banner */}
      {!isCollapsed && (
        <div className="mx-1 mb-4 flex items-center gap-2 rounded-xl border border-(--border-card) bg-(--bg-secondary) px-3 py-2.5">
          <AlertTriangle
            size={13}
            className="text-(--text-secondary) shrink-0"
          />
          <p className="text-[10px] font-semibold text-(--text-secondary) leading-snug">
            System-wide operations active. Changes are irreversible.
          </p>
        </div>
      )}

      {/* Navigation */}
      <nav className="flex-1 space-y-1.5 px-1 overflow-y-auto">
        {NAV_ITEMS.map((item) => {
          const isActive =
            item.exact ?
              pathname === item.href
            : pathname.startsWith(item.href);

          const Icon = item.icon;

          return (
            <div key={item.href} className="relative">
              <Tooltip>
                <TooltipTrigger asChild>
                  <Link
                    href={item.href}
                    onClick={closeMobileMenu}
                    className={cn(
                      "relative flex items-center rounded-xl p-3 transition-all duration-200 group overflow-hidden",
                      isCollapsed ? "justify-center" : "gap-3",
                      isActive ?
                        "text-(--text-primary) font-semibold"
                      : "text-(--text-secondary) hover:bg-(--bg-tertiary) hover:text-(--text-primary)",
                    )}
                  >
                    {isActive && (
                      <motion.div
                        layoutId="active-pill-sysadmin"
                        className="absolute inset-0 bg-(--bg-tertiary) border border-(--border-card) rounded-xl z-0 shadow-sm"
                        transition={{
                          type: "spring",
                          bounce: 0.15,
                          duration: 0.5,
                        }}
                      />
                    )}
                    <Icon
                      size={21}
                      className={cn(
                        "relative z-10 shrink-0 transition-transform duration-200 group-hover:scale-105",
                        isActive ? "text-(--text-primary)" : "opacity-85",
                      )}
                    />
                    {!isCollapsed && (
                      <motion.span
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        className="relative z-10 text-[14px] font-medium whitespace-nowrap"
                      >
                        {item.label}
                      </motion.span>
                    )}
                  </Link>
                </TooltipTrigger>
                <TooltipContent
                  side="right"
                  sideOffset={12}
                  className="bg-zinc-950 text-zinc-50 border border-zinc-800 shadow-xl px-3 py-1.5 text-xs font-medium rounded-lg"
                >
                  {item.label}
                </TooltipContent>
              </Tooltip>
            </div>
          );
        })}
      </nav>

      {/* Footer profile */}
      <div className="mt-auto pt-2 border-t border-(--border-primary)">
        <SidebarProfilePopover
          user={user}
          role="System Administrator"
          isCollapsed={isCollapsed}
          notificationsTab={
            <div className="text-sm text-(--text-secondary)">
              System alert preferences and logs dispatch options can be
              configured here.
            </div>
          }
        />
      </div>
    </div>
  );
}

// ─── Root export ──────────────────────────────────────────────────────────────

export function SystemAdminSidebar({ user }: { user: User }) {
  const [isCollapsed, setIsCollapsed] = useState(false);
  const [isMobileOpen, setIsMobileOpen] = useState(false);
  const pathname = usePathname();

  return (
    <TooltipProvider delayDuration={0}>
      {/* Mobile Trigger */}
      <div className="lg:hidden fixed top-3.5 left-4 z-50 flex items-center h-9">
        <Sheet open={isMobileOpen} onOpenChange={setIsMobileOpen}>
          <SheetTrigger asChild>
            <button className="p-2 bg-(--bg-card) border border-(--border-card) rounded-lg shadow-sm active:scale-95 transition-transform flex items-center justify-center cursor-pointer">
              <Menu className="w-5 h-5 text-(--text-primary)" />
            </button>
          </SheetTrigger>
          <SheetContent
            side="left"
            className="p-0 w-[280px] bg-(--bg-primary) border-r border-(--border-primary)"
          >
            <div className="sr-only">
              <SheetTitle>System Admin Navigation</SheetTitle>
              <SheetDescription>
                Access system-wide administration panels.
              </SheetDescription>
            </div>
            <SystemAdminSidebarInner
              user={user}
              pathname={pathname}
              closeMobileMenu={() => setIsMobileOpen(false)}
            />
          </SheetContent>
        </Sheet>
      </div>

      {/* Desktop Sidebar */}
      <motion.aside
        initial={false}
        animate={{ width: isCollapsed ? 82 : 270 }}
        className="fixed top-0 left-0 bottom-0 hidden lg:flex flex-col bg-(--bg-primary) border-r border-(--border-primary) z-40 overflow-hidden"
      >
        <SystemAdminSidebarInner
          user={user}
          pathname={pathname}
          isCollapsed={isCollapsed}
          onToggle={() => setIsCollapsed(!isCollapsed)}
        />
      </motion.aside>

      {/* Spacer */}
      <div
        className={cn(
          "hidden lg:block transition-[width] duration-300 ease-in-out shrink-0",
          isCollapsed ? "w-[82px]" : "w-[270px]",
        )}
      />
    </TooltipProvider>
  );
}
