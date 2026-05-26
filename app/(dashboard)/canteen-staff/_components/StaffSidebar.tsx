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
  { href: "/canteen-staff/menu", label: "Today's Menu", icon: UtensilsCrossed },
] as const;

interface StaffSidebarProps {
  user: {
    name: string | null;
    imageUrl: string | null;
  };
  canteen: {
    name: string;
    operatingHours: string | null;
    isActive: boolean;
  } | null;
}

export function StaffSidebar({ user, canteen }: StaffSidebarProps) {
  const [isCollapsed, setIsCollapsed] = useState(false);
  const [isMobileOpen, setIsMobileOpen] = useState(false);
  const pathname = usePathname();

  return (
    <TooltipProvider delayDuration={0}>
      {/* Mobile Menu Trigger */}
      <div className="lg:hidden fixed top-3.5 left-4 z-50 flex items-center h-9">
        <Sheet open={isMobileOpen} onOpenChange={setIsMobileOpen}>
          <SheetTrigger asChild>
            <button className="p-2 bg-(--bg-card) border border border-(--border-card) rounded-lg shadow-sm active:scale-95 transition-transform flex items-center justify-center">
              <Menu className="w-5 h-5 text-(--text-primary)" />
            </button>
          </SheetTrigger>
          <SheetContent
            side="left"
            className="p-0 w-[280px] bg-(--bg-primary) border-r-(--border-primary)"
          >
            {/* Accessibility Descriptors for Screen Readers */}
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
              closeMobileMenu={() => setIsMobileOpen(false)}
            />
          </SheetContent>
        </Sheet>
      </div>

      {/* Desktop Persistent Layout */}
      <motion.aside
        initial={false}
        animate={{ width: isCollapsed ? 80 : 260 }}
        className="fixed top-0 left-0 bottom-0 hidden lg:flex flex-col bg-(--bg-primary) border-r border-(--border-primary) z-40 overflow-hidden"
      >
        <SidebarInner
          user={user}
          canteen={canteen}
          pathname={pathname}
          isCollapsed={isCollapsed}
          onToggle={() => setIsCollapsed(!isCollapsed)}
        />
      </motion.aside>

      {/* Dynamic Content Spacer to prevent absolute overlap glitches */}
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
  canteen,
  pathname,
  isCollapsed = false,
  onToggle,
  closeMobileMenu,
}: {
  user: any;
  canteen: any;
  pathname: string;
  isCollapsed?: boolean;
  onToggle?: () => void;
  closeMobileMenu?: () => void;
}) {
  const isActiveRoute = (href: string, exact?: boolean) =>
    exact ?
      pathname === href
    : pathname === href || pathname.startsWith(href + "/");

  return (
    <div className="flex flex-col h-full py-3 px-3">
      {/* Dynamic Header */}
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
              className="flex items-center gap-3 shrink-0 min-w-0"
            >
              <div className="w-8 h-8 bg-amber-500/15 text-amber-500 rounded-lg flex items-center justify-center font-bold shrink-0 shadow-sm border border-amber-500/20">
                <UtensilsCrossed size={16} />
              </div>
              <div className="flex flex-col min-w-0">
                <span className="font-semibold text-(--text-primary) text-sm truncate tracking-tight">
                  {canteen?.name ?? "SchoolMealPay"}
                </span>
                {canteen && (
                  <div className="flex items-center gap-1.5 mt-0.5">
                    <span
                      className="w-1.5 h-1.5 rounded-full"
                      style={{
                        background: canteen.isActive ? "#22c55e" : "#6b7280",
                        boxShadow:
                          canteen.isActive ? "0 0 6px #22c55e" : undefined,
                      }}
                    />
                    <span className="text-[10px] text-(--text-muted) font-medium">
                      {canteen.isActive ? "Open Terminal" : "Closed"}
                    </span>
                  </div>
                )}
              </div>
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

      {/* Navigation Matrix */}
      <nav className="flex-1 space-y-1.5 px-1">
        {NAV_ITEMS.map((item) => {
          const isActive = isActiveRoute(
            item.href,
            "exact" in item ? item.exact : false,
          );
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
                      isActive ? "text-amber-500" : "opacity-80",
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

                  {/* Shared Layout Active Background Pill */}
                  {isActive && (
                    <motion.div
                      layoutId="active-pill-staff"
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

      {/* Staff User Section */}
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
              alt={user.name ?? "Staff"}
              className="w-full h-full object-cover"
            />
          : <span className="text-sm font-bold text-white uppercase">
              {user.name?.[0] || "S"}
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
            <span className="text-[10px] text-amber-500/90 uppercase tracking-widest font-bold">
              Canteen Staff
            </span>
          </motion.div>
        )}
      </div>
    </div>
  );
}
