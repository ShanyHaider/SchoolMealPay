"use client";

import React, { useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";
import {
  LayoutDashboard,
  ClipboardList,
  QrCode,
  Package,
  UtensilsCrossed,
  PanelLeftClose,
  PanelLeftOpen,
  Menu,
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
import { SidebarProfilePopover } from "../../../../components/SidebarProfilePopover";

const NAV_ITEMS = [
  {
    href: "/canteen-staff",
    label: "Overview",
    icon: LayoutDashboard,
    exact: true,
  },
  { href: "/canteen-staff/orders", label: "Live Orders", icon: ClipboardList },
  { href: "/canteen-staff/qr-scan", label: "QR Pickup", icon: QrCode },
  { href: "/canteen-staff/inventory", label: "Inventory", icon: Package },
  {
    href: "/canteen-staff/menu",
    label: "Menu Schedule",
    icon: UtensilsCrossed,
  },
] as const;

interface StaffSidebarProps {
  user: typeof usersTable.$inferSelect;
  canteen: {
    name: string;
    operatingFrom: string | null;
    operatingUntil: string | null;
    isActive: boolean;
  } | null;
  notificationsTab: React.ReactNode;
}

export function StaffSidebar({
  user,
  canteen,
  notificationsTab,
}: StaffSidebarProps) {
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
            className="p-0 w-70 bg-(--bg-primary) border-r border-(--border-primary)"
          >
            <div className="sr-only">
              <SheetTitle>Canteen Operations Menu</SheetTitle>
              <SheetDescription>
                Manage terminal menus, handle dynamic QR code pickups, and
                process point-of-sale orders.
              </SheetDescription>
            </div>
            <SidebarInner
              user={user}
              canteen={canteen}
              pathname={pathname}
              notificationsTab={notificationsTab}
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
        <SidebarInner
          user={user}
          canteen={canteen}
          pathname={pathname}
          notificationsTab={notificationsTab}
          isCollapsed={isCollapsed}
          onToggle={() => setIsCollapsed(!isCollapsed)}
        />
      </motion.aside>

      {/* Spacer */}
      <div
        className={cn(
          "hidden lg:block transition-[width] duration-300 ease-in-out shrink-0",
          isCollapsed ? "w-20.5" : "w-67.5",
        )}
      />
    </TooltipProvider>
  );
}

// ─── Helpers ──────────────────────────────────────────────────────────────────

function formatOperatingHours(
  from: string | null,
  until: string | null,
): string | null {
  if (!from || !until) return null;
  const fmt = (t: string) => t.slice(0, 5);
  return `${fmt(from)} – ${fmt(until)}`;
}

// ─── Inner Sidebar ────────────────────────────────────────────────────────────

function SidebarInner({
  user,
  canteen,
  pathname,
  notificationsTab,
  isCollapsed = false,
  onToggle,
  closeMobileMenu,
}: {
  user: StaffSidebarProps["user"];
  canteen: StaffSidebarProps["canteen"];
  pathname: string;
  notificationsTab: React.ReactNode;
  isCollapsed?: boolean;
  onToggle?: () => void;
  closeMobileMenu?: () => void;
}) {
  const isActiveRoute = (href: string, exact?: boolean) =>
    exact ?
      pathname === href
    : pathname === href || pathname.startsWith(href + "/");

  const operatingHours = formatOperatingHours(
    canteen?.operatingFrom ?? null,
    canteen?.operatingUntil ?? null,
  );

  return (
    <div className="flex flex-col h-full py-3 px-3">
      {/* Header */}
      <div
        className={cn(
          "flex items-center mb-6 px-3 transition-all duration-300 min-h-11",
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
              className="flex items-center gap-3 shrink-0 min-w-0"
            >
              <div className="w-9 h-9 bg-amber-500/15 text-amber-500 rounded-xl flex items-center justify-center shrink-0 shadow-md border border-amber-500/20">
                <UtensilsCrossed size={17} />
              </div>
              <div className="flex flex-col leading-none min-w-0">
                <span className="font-semibold text-(--text-primary) truncate">
                  {canteen?.name ?? "SchoolMealPay"}
                </span>
                <span className="text-[10px] uppercase tracking-[0.2em] text-(--text-muted) font-medium mt-1">
                  {canteen ?
                    <span className="flex items-center gap-1.5">
                      <span
                        className="w-1.5 h-1.5 rounded-full inline-block"
                        style={{
                          background: canteen.isActive ? "#22c55e" : "#6b7280",
                          boxShadow:
                            canteen.isActive ? "0 0 6px #22c55e" : undefined,
                        }}
                      />
                      {canteen.isActive ? "Open" : "Closed"}
                      {operatingHours ? ` · ${operatingHours}` : ""}
                    </span>
                  : "Canteen Staff"}
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

      {/* Navigation */}
      <nav className="flex-1 space-y-1.5 px-1 overflow-y-auto">
        {NAV_ITEMS.map((item) => {
          const isActive = isActiveRoute(
            item.href,
            "exact" in item ? item.exact : false,
          );
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
                        layoutId="active-pill-staff"
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
                        isActive ? "text-amber-500" : "opacity-85",
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

                {isCollapsed && (
                  <TooltipContent
                    side="right"
                    sideOffset={12}
                    className="bg-zinc-950 text-zinc-50 border border-zinc-800 shadow-xl px-3 py-1.5 text-xs font-medium rounded-lg"
                  >
                    {item.label}
                  </TooltipContent>
                )}
              </Tooltip>
            </div>
          );
        })}
      </nav>

      {/* Footer profile */}
      <div className="mt-4 pt-4 border-t border-(--border-primary)">
        <SidebarProfilePopover
          user={user}
          role="Canteen Staff"
          isCollapsed={isCollapsed}
          notificationsTab={notificationsTab}
        />
      </div>
    </div>
  );
}
