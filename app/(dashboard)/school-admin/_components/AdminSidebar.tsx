"use client";

import React, { useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";
import {
  LayoutDashboard,
  School,
  GraduationCap,
  ChefHat,
  ClipboardList,
  DollarSign,
  Users2,
  Settings,
  PanelLeftClose,
  PanelLeftOpen,
  Menu,
  Users,
  UtensilsCrossed,
  UserCog,
  CalendarDays,
  Package,
  BarChart3,
  Building2,
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
import { cn } from "@/lib/utils";
import type { usersTable } from "@/drizzle/schema";

type User = typeof usersTable.$inferSelect;

const ADMIN_NAV_ITEMS = [
  {
    href: "/school-admin",
    label: "Overview",
    icon: LayoutDashboard,
    exact: true,
  },
  { href: "/school-admin/students", label: "Students", icon: GraduationCap },
  { href: "/school-admin/classes", label: "Classes", icon: Users },
  { href: "/school-admin/canteen", label: "Canteen", icon: UtensilsCrossed },
  { href: "/school-admin/staff", label: "Staff", icon: UserCog },
  { href: "/school-admin/menu", label: "Menu Schedule", icon: CalendarDays },
  { href: "/school-admin/inventory", label: "Inventory", icon: Package },
  { href: "/school-admin/reports", label: "Reports", icon: BarChart3 },
  { href: "/school-admin/profile", label: "School Profile", icon: Building2 },
] as const;

export function SchoolAdminSidebar({ user }: { user: User }) {
  const [isCollapsed, setIsCollapsed] = useState(false);
  const [isMobileOpen, setIsMobileOpen] = useState(false);
  const pathname = usePathname();

  return (
    <TooltipProvider delayDuration={0}>
      {/* Mobile Trigger - Fixed positioning aligned perfectly with Topbar height */}
      <div className="lg:hidden fixed top-3.5 left-4 z-50 flex items-center h-9">
        <Sheet open={isMobileOpen} onOpenChange={setIsMobileOpen}>
          <SheetTrigger asChild>
            <button className="p-2 bg-(--bg-card) border border-(--border-card) rounded-lg shadow-sm active:scale-95 transition-transform flex items-center justify-center">
              <Menu className="w-5 h-5 text-(--text-primary)" />
            </button>
          </SheetTrigger>
          <SheetContent
            side="left"
            className="p-0 w-[280px] bg-(--bg-primary) border-r-(--border-primary)"
          >
            {/* Screen reader titles to fix Radix UI console error */}
            <div className="sr-only">
              <SheetTitle>Admin Navigation Menu</SheetTitle>
              <SheetDescription>
                Access school management panels, menus, finances, and settings.
              </SheetDescription>
            </div>

            <AdminSidebarInner
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
        animate={{ width: isCollapsed ? 80 : 260 }}
        className="fixed top-0 left-0 bottom-0 hidden lg:flex flex-col bg-(--bg-primary) border-r border-(--border-primary) z-40 overflow-hidden"
      >
        <AdminSidebarInner
          user={user}
          pathname={pathname}
          isCollapsed={isCollapsed}
          onToggle={() => setIsCollapsed(!isCollapsed)}
        />
      </motion.aside>

      {/* Dynamic Content Layout Spacer */}
      <div
        className={cn(
          "hidden lg:block transition-[width] duration-300 ease-in-out shrink-0",
          isCollapsed ? "w-[80px]" : "w-[260px]",
        )}
      />
    </TooltipProvider>
  );
}

function AdminSidebarInner({
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
              <div className="w-8 h-8 bg-(--accent) text-(--accent-text) rounded-lg flex items-center justify-center font-bold shrink-0 shadow-md">
                SM
              </div>
              <span className="font-semibold text-(--text-primary) whitespace-nowrap tracking-tight">
                SchoolMealPay
              </span>
            </motion.div>
          )}
        </AnimatePresence>

        {onToggle && (
          <button
            onClick={onToggle}
            className={cn(
              "p-2 hover:bg-(--bg-tertiary) rounded-md text-(--text-muted) hover:text-(--text-primary) transition-colors",
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
        {ADMIN_NAV_ITEMS.map((item) => {
          const isActive =
            item.href === "/school-admin" ?
              pathname === "/school-admin"
            : pathname.startsWith(item.href);
          const Icon = item.icon;

          return (
            <Tooltip key={item.href}>
              <TooltipTrigger asChild>
                <Link
                  href={item.href}
                  onClick={closeMobileMenu}
                  className={cn(
                    "relative flex items-center p-3 rounded-xl transition-all duration-200 group",
                    isActive ?
                      "text-(--text-primary)"
                    : "text-(--text-secondary) hover:bg-(--bg-tertiary) hover:text-(--text-primary)",
                    isCollapsed ? "justify-center" : "gap-3",
                  )}
                >
                  <Icon
                    size={22}
                    className={cn(
                      "shrink-0 relative z-30 transition-transform duration-200 group-hover:scale-110",
                      isActive ? "text-(--accent)" : "opacity-80",
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
                      layoutId="active-pill-admin"
                      className="absolute inset-0 bg-(--bg-tertiary) rounded-xl z-0 border border-(--border-card) shadow-sm"
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
          "mt-auto pt-3 border-t border-(--border-primary) flex items-center px-2 transition-all duration-300",
          isCollapsed ? "justify-center" : "gap-3",
        )}
      >
        <div className="w-10 h-10 rounded-full bg-zinc-800 border border-(--border-primary) flex items-center justify-center overflow-hidden shrink-0 shadow-sm">
          {user.imageUrl ?
            <img
              src={user.imageUrl}
              alt={user.name}
              className="w-full h-full object-cover"
            />
          : <span className="text-sm font-bold text-white uppercase">
              {user.name?.[0] || "A"}
            </span>
          }
        </div>

        {!isCollapsed && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="flex flex-col min-w-0"
          >
            <span className="text-sm font-semibold text-(--text-primary) truncate leading-none mb-1">
              {user.name}
            </span>
            <span className="text-[10px] text-(--text-muted) uppercase tracking-widest font-bold">
              School Admin
            </span>
          </motion.div>
        )}
      </div>
    </div>
  );
}
