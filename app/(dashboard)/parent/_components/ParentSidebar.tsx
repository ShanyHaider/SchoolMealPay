"use client";

import React, { useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";
import {
  LayoutDashboard,
  Users,
  UtensilsCrossed,
  ShoppingBag,
  Salad,
  Wallet,
  Bell,
  Settings,
  PanelLeftClose,
  PanelLeftOpen,
  Menu,
} from "lucide-react";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/Components/ui/tooltip";
import { Sheet, SheetContent, SheetTrigger } from "@/Components/ui/sheet";
import { cn } from "@/lib/utils";
import type { usersTable } from "@/drizzle/schema";

type User = typeof usersTable.$inferSelect;

const NAV_ITEMS = [
  { label: "Dashboard", href: "/parent", icon: LayoutDashboard },
  { label: "Children", href: "/parent/children", icon: Users },
  { label: "Menu", href: "/parent/menu", icon: UtensilsCrossed },
  { label: "Orders", href: "/parent/orders", icon: ShoppingBag },
  { label: "Nutrition", href: "/parent/nutrition", icon: Salad },
  { label: "Spending", href: "/parent/spending", icon: Wallet },
  { label: "Notifications", href: "/parent/notifications", icon: Bell },
  { label: "Settings", href: "/parent/settings", icon: Settings },
] as const;

export function ParentSidebar({ user }: { user: User }) {
  const [isCollapsed, setIsCollapsed] = useState(false);
  const [isMobileOpen, setIsMobileOpen] = useState(false);
  const pathname = usePathname();

  return (
    <TooltipProvider delayDuration={0}>
      {/* Mobile Trigger */}
      <div className="lg:hidden fixed top-4 left-4 z-50">
        <Sheet open={isMobileOpen} onOpenChange={setIsMobileOpen}>
          <SheetTrigger asChild>
            <button className="p-2 bg-[var(--bg-card)] border border-[var(--border-card)] rounded-lg shadow-sm active:scale-95 transition-transform">
              <Menu className="w-5 h-5 text-[var(--text-primary)]" />
            </button>
          </SheetTrigger>
          <SheetContent
            side="left"
            className="p-0 w-[280px] bg-[var(--bg-primary)] border-r-[var(--border-primary)]"
          >
            <SidebarInner user={user} pathname={pathname} />
          </SheetContent>
        </Sheet>
      </div>

      {/* Desktop Sidebar */}
      <motion.aside
        initial={false}
        animate={{ width: isCollapsed ? 80 : 260 }}
        className="fixed top-0 left-0 bottom-0 hidden lg:flex flex-col bg-[var(--bg-primary)] border-r border-[var(--border-primary)] z-40 overflow-hidden"
      >
        <SidebarInner
          user={user}
          pathname={pathname}
          isCollapsed={isCollapsed}
          onToggle={() => setIsCollapsed(!isCollapsed)}
        />
      </motion.aside>

      {/* Content Spacer */}
      <div
        className={cn(
          "hidden lg:block transition-[width] duration-300 ease-in-out shrink-0",
          isCollapsed ? "w-[80px]" : "w-[260px]",
        )}
      />
    </TooltipProvider>
  );
}

function SidebarInner({
  user,
  pathname,
  isCollapsed = false,
  onToggle,
}: {
  user: User;
  pathname: string;
  isCollapsed?: boolean;
  onToggle?: () => void;
}) {
  return (
    <div className="flex flex-col h-full py-3 px-3">
      {/* Header - Logo hidden when collapsed to fix overlap */}
      <div
        className={cn(
          "flex items-center mb-6 px-3 transition-all duration-300 min-h-[40px]",
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
              <div className="w-8 h-8 bg-[var(--accent)] text-[var(--accent-text)] rounded-lg flex items-center justify-center font-bold shrink-0 shadow-md">
                SM
              </div>
              <span className="font-semibold text-[var(--text-primary)] whitespace-nowrap tracking-tight">
                SchoolMealPay
              </span>
            </motion.div>
          )}
        </AnimatePresence>

        {onToggle && (
          <button
            onClick={onToggle}
            className={cn(
              "p-2 hover:bg-[var(--bg-tertiary)] rounded-md text-[var(--text-muted)] hover:text-[var(--text-primary)] transition-colors",
              isCollapsed && "mx-auto",
            )}
          >
            {isCollapsed ?
              <PanelLeftOpen size={22} />
            : <PanelLeftClose size={20} />}
          </button>
        )}
      </div>

      {/* Navigation Links */}
      <nav className="flex-1 space-y-1.5 px-1">
        {NAV_ITEMS.map((item) => {
          const isActive =
            item.href === "/parent" ?
              pathname === "/parent"
            : pathname.startsWith(item.href);
          const Icon = item.icon;

          return (
            <Tooltip key={item.href}>
              <TooltipTrigger asChild>
                <Link
                  href={item.href}
                  className={cn(
                    "relative flex items-center p-3 rounded-xl transition-all duration-200 group",
                    isActive ?
                      "text-[var(--text-primary)]"
                    : "text-[var(--text-secondary)] hover:bg-[var(--bg-tertiary)] hover:text-[var(--text-primary)]",
                    isCollapsed ? "justify-center" : "gap-3",
                  )}
                >
                  {/* Lucide Icon - SVG ensures visibility */}
                  <Icon
                    size={22}
                    className={cn(
                      "shrink-0 relative z-30 transition-transform duration-200 group-hover:scale-110",
                      isActive ? "text-[var(--accent)]" : "opacity-80",
                    )}
                  />

                  {!isCollapsed && (
                    <motion.span
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                      className="text-[14px] font-medium z-10 whitespace-nowrap"
                    >
                      {item.label}
                    </motion.span>
                  )}

                  {/* Active Background Pill */}
                  {isActive && (
                    <motion.div
                      layoutId="active-pill"
                      className="absolute inset-0 bg-[var(--bg-tertiary)] rounded-xl z-0 border border-[var(--border-card)] shadow-sm"
                      transition={{
                        type: "spring",
                        bounce: 0.15,
                        duration: 0.5,
                      }}
                    />
                  )}
                </Link>
              </TooltipTrigger>

              {isCollapsed && (
                <TooltipContent
                  side="right"
                  sideOffset={15}
                  className="bg-zinc-900 text-white border-none shadow-xl px-3 py-1.5 text-xs font-semibold"
                >
                  {item.label}
                </TooltipContent>
              )}
            </Tooltip>
          );
        })}
      </nav>

      {/* User Section */}
      <div
        className={cn(
          "mt-auto pt-3 border-t border-[var(--border-primary)] flex items-center px-2 transition-all duration-300",
          isCollapsed ? "justify-center" : "gap-3",
        )}
      >
        <div className="w-10 h-10 rounded-full bg-zinc-800 border border-[var(--border-primary)] flex items-center justify-center overflow-hidden shrink-0 shadow-sm">
          {user.imageUrl ?
            <img
              src={user.imageUrl}
              alt={user.name}
              className="w-full h-full object-cover"
            />
          : <span className="text-sm font-bold text-white uppercase">
              {user.name[0]}
            </span>
          }
        </div>

        {!isCollapsed && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="flex flex-col min-w-0"
          >
            <span className="text-sm font-semibold text-[var(--text-primary)] truncate leading-none mb-1">
              {user.name}
            </span>
            <span className="text-[10px] text-[var(--text-muted)] uppercase tracking-widest font-bold">
              Parent
            </span>
          </motion.div>
        )}
      </div>
    </div>
  );
}
