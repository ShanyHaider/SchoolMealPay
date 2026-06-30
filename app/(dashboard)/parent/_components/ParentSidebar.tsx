"use client";

// app/(dashboard)/parent/_components/ParentSidebar.tsx
// Subscription-aware — mirrors SchoolAdminSidebar's premium lock pattern.

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
  PanelLeftClose,
  PanelLeftOpen,
  Menu,
  Sparkles,
  Lock,
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
import { canParentAccess } from "@/data/subscriptionTiers";
import {
  SettingsTab,
  SidebarProfilePopover,
  SidebarSettingsModal,
} from "@/components/SidebarProfilePopover";

type User = typeof usersTable.$inferSelect;

type ParentFeature =
  | "hasNutritionDashboard"
  | "hasAiMealPlanning"
  | "hasHealthTrends"
  | "hasPrioritySupport";

type NavItem = {
  label: string;
  href: string;
  icon: React.ElementType;
  exact?: boolean;
  requiredFeature?: ParentFeature;
  premium?: boolean;
};

const NAV_ITEMS: NavItem[] = [
  { label: "Dashboard", href: "/parent", icon: LayoutDashboard, exact: true },
  { label: "Children", href: "/parent/children", icon: Users },
  { label: "Menu", href: "/parent/menu", icon: UtensilsCrossed },
  { label: "Orders", href: "/parent/orders", icon: ShoppingBag },
  {
    label: "Nutrition",
    href: "/parent/nutrition",
    icon: Salad,
    requiredFeature: "hasNutritionDashboard",
    premium: true,
  },
  { label: "Wallet", href: "/parent/wallet", icon: Wallet },
];

// ─── Root export ──────────────────────────────────────────────────────────────

export function ParentSidebar({
  user,
  subscriptionStatus,
  notificationsTab,
  billingTab,
}: {
  user: User;
  /** Stripe subscription status: "active" | "trialing" | "canceled" | null */
  subscriptionStatus: string | null | undefined;
  notificationsTab: React.ReactNode;
  billingTab: React.ReactNode;
}) {
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
              <SheetTitle>Parent Navigation Menu</SheetTitle>
              <SheetDescription>
                Review meal menus, monitor children account metrics, and update
                allowances.
              </SheetDescription>
            </div>
            <SidebarInner
              user={user}
              pathname={pathname}
              subscriptionStatus={subscriptionStatus}
              closeMobileMenu={() => setIsMobileOpen(false)}
              notificationsTab={notificationsTab}
              billingTab={billingTab}
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
          pathname={pathname}
          subscriptionStatus={subscriptionStatus}
          isCollapsed={isCollapsed}
          onToggle={() => setIsCollapsed(!isCollapsed)}
          notificationsTab={notificationsTab}
          billingTab={billingTab}
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

// ─── Inner Sidebar ────────────────────────────────────────────────────────────

function SidebarInner({
  user,
  pathname,
  subscriptionStatus,
  isCollapsed = false,
  onToggle,
  closeMobileMenu,
  notificationsTab,
  billingTab,
}: {
  user: User;
  pathname: string;
  subscriptionStatus: string | null | undefined;
  isCollapsed?: boolean;
  onToggle?: () => void;
  closeMobileMenu?: () => void;
  notificationsTab: React.ReactNode;
  billingTab: React.ReactNode;
}) {
  const isPro =
    subscriptionStatus === "active" || subscriptionStatus === "trialing";

  // Billing modal state — owned here so the callout can trigger it
  const [settingsOpen, setSettingsOpen] = useState(false);
  const [activeTab, setActiveTab] = useState<SettingsTab>("profile");

  const openBilling = () => {
    setActiveTab("billing");
    setSettingsOpen(true);
  };
  return (
    <div className="flex flex-col h-full py-3 px-3">
      {/* ── ADD THIS ── */}
      <SidebarSettingsModal
        isOpen={settingsOpen}
        onClose={() => setSettingsOpen(false)}
        initialTab={activeTab}
        notificationsTab={notificationsTab}
        billingTab={billingTab}
      />

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
              <div className="w-9 h-9 bg-(--accent) text-(--accent-text) rounded-xl flex items-center justify-center font-bold shadow-md">
                SM
              </div>
              <div className="flex flex-col leading-none">
                <span className="font-semibold text-(--text-primary)">
                  SchoolMealPay
                </span>
                <span className="text-[10px] uppercase tracking-[0.2em] text-(--text-muted) font-medium mt-1">
                  Parent Portal
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
          const isActive =
            item.exact ?
              pathname === item.href
            : pathname === item.href || pathname.startsWith(item.href + "/");

          const hasAccess =
            !item.requiredFeature ||
            canParentAccess(item.requiredFeature, subscriptionStatus);

          const Icon = item.icon;

          return (
            <div key={item.href} className="relative">
              <Tooltip>
                <TooltipTrigger asChild>
                  {
                    hasAccess ?
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
                            layoutId="active-pill-parent"
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
                            isActive ? "text-(--accent)" : "opacity-85",
                          )}
                        />
                        {!isCollapsed && (
                          <>
                            <motion.span
                              initial={{ opacity: 0 }}
                              animate={{ opacity: 1 }}
                              className="relative z-10 text-[14px] font-medium whitespace-nowrap"
                            >
                              {item.label}
                            </motion.span>
                            {item.premium && (
                              <div className="ml-auto relative z-10 flex items-center gap-1 rounded-full border border-(--border-card) px-2 py-0.5 bg-(--bg-primary)">
                                <Sparkles
                                  size={10}
                                  className="text-(--accent)"
                                />
                                <span className="text-[9px] font-bold uppercase tracking-wide">
                                  Pro
                                </span>
                              </div>
                            )}
                          </>
                        )}
                      </Link>
                      // Locked item — navigates to billing with reason param
                    : <Link
                        href={`/parent/settings?tab=billing&reason=${item.requiredFeature}`}
                        onClick={closeMobileMenu}
                        className={cn(
                          "w-full relative flex items-center rounded-xl p-3 transition-all duration-200 opacity-50 hover:opacity-70",
                          isCollapsed ? "justify-center" : (
                            "gap-3 justify-between"
                          ),
                        )}
                      >
                        <div className="flex items-center gap-3">
                          <Icon
                            size={21}
                            className="shrink-0 text-(--text-muted)"
                          />
                          {!isCollapsed && (
                            <span className="text-[14px] font-medium text-(--text-muted)">
                              {item.label}
                            </span>
                          )}
                        </div>
                        {!isCollapsed && (
                          <div className="flex items-center gap-1 rounded-full border border-(--border-card) px-2 py-0.5 bg-(--bg-secondary)">
                            <Lock size={10} className="text-(--text-muted)" />
                            <span className="text-[9px] font-bold uppercase tracking-wide text-(--text-muted)">
                              Pro
                            </span>
                          </div>
                        )}
                      </Link>

                  }
                </TooltipTrigger>
                <TooltipContent
                  side="right"
                  sideOffset={12}
                  className="bg-zinc-950 text-zinc-50 border border-zinc-800 shadow-xl px-3 py-1.5 text-xs font-medium rounded-lg"
                >
                  {!hasAccess ?
                    "Upgrade to Parent Pro to unlock this feature"
                  : item.label}
                </TooltipContent>
              </Tooltip>
            </div>
          );
        })}
      </nav>

      {/* Upgrade callout — only shown when not Pro and sidebar is expanded */}
      {!isPro && !isCollapsed && (
        <motion.div
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          className="mt-4 rounded-2xl border border-(--border-card) bg-(--bg-secondary) p-4"
        >
          <div className="flex items-start gap-3">
            <div className="w-10 h-10 rounded-xl bg-(--accent) text-(--accent-text) flex items-center justify-center shrink-0">
              <Sparkles size={18} />
            </div>
            <div className="min-w-0">
              <h4 className="text-sm font-semibold text-(--text-primary)">
                Upgrade to Pro
              </h4>
              <p className="mt-1 text-xs leading-relaxed text-(--text-muted)">
                Unlock AI nutrition tracking, meal planning suggestions, and
                health trend reports.
              </p>
            </div>
          </div>
          {/* Replace <Link> with a button */}
          <button
            onClick={() => {
              setActiveTab("billing");
              setSettingsOpen(true);
            }}
            className="mt-4 inline-flex w-full items-center justify-center rounded-xl bg-(--accent) px-3 py-2.5 text-sm font-medium text-(--accent-text) transition-opacity hover:opacity-90 cursor-pointer"
          >
            Upgrade Plan
          </button>
        </motion.div>
      )}

      {/* Footer profile */}
      <div className="mt-4 pt-4 border-t border-(--border-primary)">
        <SidebarProfilePopover
          user={user}
          role="Parent"
          isCollapsed={isCollapsed}
          notificationsTab={notificationsTab}
          billingTab={billingTab}
        />
      </div>
    </div>
  );
}
