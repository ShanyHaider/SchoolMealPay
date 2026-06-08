"use client";

import React, { useState, useRef, useEffect } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useClerk } from "@clerk/nextjs";
import { motion, AnimatePresence } from "framer-motion";
import {
  LayoutDashboard,
  GraduationCap,
  ClipboardList,
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
  Sparkles,
  Lock,
  Settings,
  CreditCard,
  Bell,
  LogOut,
  ChevronUp,
  X,
  User as UserIcon,
  ShieldCheck,
} from "lucide-react";
import { createPortal } from "react-dom";

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
import { canSchoolAccess } from "@/data/subscriptionTiers";
import { ProfileTab } from "@/components/userMenu/tabs/ProfileTab";
import { SecurityTab } from "@/components/userMenu/tabs/SecurityTab";
import { SidebarProfilePopover, SidebarSettingsModal } from "../../_components/SidebarProfilePopover";

type User = typeof usersTable.$inferSelect;
type SettingsTab = "profile" | "security" | "billing" | "notifications";

const TAB_CONFIG: {
  id: SettingsTab;
  label: string;
  icon: React.ElementType;
}[] = [
    { id: "profile", label: "Profile", icon: UserIcon },
    { id: "security", label: "Security", icon: ShieldCheck },
    { id: "billing", label: "Billing", icon: CreditCard },
    { id: "notifications", label: "Notifications", icon: Bell },
  ];

type SchoolFeature =
  | "hasAiNutrition"
  | "hasAdvancedAnalytics"
  | "hasPrioritySupport";

type AdminNavItem = {
  href: string;
  label: string;
  icon: React.ElementType;
  exact?: boolean;
  requiredFeature?: SchoolFeature;
  premium?: boolean;
};

const ADMIN_NAV_ITEMS: AdminNavItem[] = [
  { href: "/school-admin", label: "Overview", icon: LayoutDashboard, exact: true },
  { href: "/school-admin/students", label: "Students", icon: GraduationCap },
  { href: "/school-admin/classes", label: "Classes", icon: Users },
  { href: "/school-admin/canteen", label: "Canteen", icon: UtensilsCrossed },
  { href: "/school-admin/staff", label: "Staff", icon: UserCog },
  { href: "/school-admin/menu", label: "Scheduled Menu", icon: CalendarDays },
  { href: "/school-admin/inventory", label: "Inventory", icon: Package },
  {
    href: "/school-admin/reports",
    label: "Advanced Reports",
    icon: BarChart3,
    requiredFeature: "hasAdvancedAnalytics",
    premium: true,
  },
  {
    href: "/school-admin/ai-nutrition",
    label: "AI Nutrition",
    icon: ClipboardList,
    requiredFeature: "hasAiNutrition",
    premium: true,
  },
  { href: "/school-admin/profile", label: "School Profile", icon: Building2 },
];

// ─── Root export ──────────────────────────────────────────────────────────────

export function SchoolAdminSidebar({
  user,
  tier,
  notificationsTab,
  billingTab,
}: {
  user: User;
  tier: string | null | undefined;
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
            <button className="p-2 bg-[var(--bg-card)] border border-[var(--border-card)] rounded-lg shadow-sm active:scale-95 transition-transform flex items-center justify-center cursor-pointer">
              <Menu className="w-5 h-5 text-[var(--text-primary)]" />
            </button>
          </SheetTrigger>
          <SheetContent
            side="left"
            className="p-0 w-[280px] bg-[var(--bg-primary)] border-r border-[var(--border-primary)]"
          >
            <div className="sr-only">
              <SheetTitle>Admin Navigation Menu</SheetTitle>
              <SheetDescription>
                Access school management panels and subscription features.
              </SheetDescription>
            </div>
            <AdminSidebarInner
              user={user}
              pathname={pathname}
              tier={tier}
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
        className="fixed top-0 left-0 bottom-0 hidden lg:flex flex-col bg-[var(--bg-primary)] border-r border-[var(--border-primary)] z-40 overflow-hidden"
      >
        <AdminSidebarInner
          user={user}
          pathname={pathname}
          tier={tier}
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

// ─── Settings modal ───────────────────────────────────────────────────────────

function SettingsModal({
  isOpen,
  onClose,
  initialTab,
  notificationsTab,
  billingTab,
}: {
  isOpen: boolean;
  onClose: () => void;
  initialTab: SettingsTab;
  notificationsTab: React.ReactNode;
  billingTab: React.ReactNode;
}) {
  const [activeTab, setActiveTab] = useState<SettingsTab>(initialTab);
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
    return () => setMounted(false);
  }, []);

  useEffect(() => {
    if (isOpen) setActiveTab(initialTab);
  }, [isOpen, initialTab]);

  if (!mounted) return null;

  return createPortal(
    <AnimatePresence>
      {isOpen && (
        <div className="fixed inset-0 z-[9999] flex items-center justify-center p-2 sm:p-4 isolate">
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
            className="absolute inset-0 bg-black/40 backdrop-blur-md dark:bg-black/60"
          />
          <motion.div
            initial={{ opacity: 0, scale: 0.98, y: 10 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.98, y: 10 }}
            className="relative flex flex-col md:flex-row h-full max-h-[90vh] md:h-[620px] w-full max-w-4xl overflow-hidden rounded-3xl border border-zinc-200/80 bg-white dark:border-zinc-800/80 dark:bg-zinc-950 text-zinc-800 dark:text-zinc-200 shadow-2xl"
          >
            {/* Sidebar nav */}
            <div className="w-full md:w-56 border-b md:border-b-0 md:border-r border-zinc-100 bg-zinc-50/50 dark:border-zinc-900 dark:bg-zinc-950/40 shrink-0 flex flex-col">
              <div className="flex items-start justify-between px-5 pt-5 pb-0 md:pt-8 md:pb-0">
                <div className="px-2 mb-3 md:mb-6">
                  <h2 className="text-lg md:text-xl font-black tracking-tight text-zinc-950 dark:text-white">
                    Settings
                  </h2>
                </div>
                <button
                  onClick={onClose}
                  className="rounded-xl p-1.5 text-zinc-400 hover:bg-zinc-200/60 dark:hover:bg-zinc-800 transition-colors cursor-pointer mt-0.5 shrink-0"
                >
                  <X size={18} />
                </button>
              </div>
              <nav
                className="flex md:flex-col gap-1 overflow-x-auto md:overflow-visible px-4 md:px-5 pb-4 md:pb-5"
                style={{ scrollbarWidth: "none" }}
              >
                {TAB_CONFIG.map(({ id, label, icon: Icon }) => (
                  <button
                    key={id}
                    onClick={() => setActiveTab(id)}
                    className={`flex items-center gap-2.5 rounded-xl px-3 py-2 md:py-2.5 text-xs font-bold capitalize transition-all shrink-0 cursor-pointer ${activeTab === id
                      ? "bg-zinc-950 text-white dark:bg-white dark:text-zinc-950"
                      : "text-zinc-500 hover:bg-zinc-100 dark:text-zinc-400 dark:hover:bg-zinc-900"
                      }`}
                  >
                    <Icon size={14} />
                    {label}
                  </button>
                ))}
              </nav>
            </div>

            {/* Scrollable content */}
            <div
              className="flex-1 p-5 sm:p-8 md:p-10 pt-8 overflow-y-auto"
              style={{ scrollbarWidth: "none" }}
            >
              {activeTab === "profile" && <ProfileTab />}
              {activeTab === "security" && <SecurityTab />}
              {activeTab === "billing" && billingTab}
              {activeTab === "notifications" && notificationsTab}
            </div>
          </motion.div>
        </div>
      )}
    </AnimatePresence>,
    document.body,
  );
}

// ─── Footer profile popover ───────────────────────────────────────────────────


// ─── Inner sidebar ────────────────────────────────────────────────────────────

function AdminSidebarInner({
  user,
  pathname,
  tier,
  isCollapsed = false,
  onToggle,
  closeMobileMenu,
  notificationsTab,
  billingTab,
}: {
  user: User;
  pathname: string;
  tier: string | null | undefined;
  isCollapsed?: boolean;
  onToggle?: () => void;
  closeMobileMenu?: () => void;
  notificationsTab: React.ReactNode;
  billingTab: React.ReactNode;
}) {
  // ── Billing shortcut state ──────────────────────────────────────
  const [settingsOpen, setSettingsOpen] = useState(false);
  const [activeTab, setActiveTab] = useState<SettingsTab>("billing");
  return (

    <div className="flex flex-col h-full py-3 px-3">
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
              <div className="w-9 h-9 bg-[var(--accent)] text-[var(--accent-text)] rounded-xl flex items-center justify-center font-bold shadow-md">
                SM
              </div>
              <div className="flex flex-col leading-none">
                <span className="font-semibold text-[var(--text-primary)]">
                  SchoolMealPay
                </span>
                <span className="text-[10px] uppercase tracking-[0.2em] text-[var(--text-muted)] font-medium mt-1">
                  Admin Panel
                </span>
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        {onToggle && (
          <button
            onClick={onToggle}
            className={cn(
              "p-2 hover:bg-[var(--bg-tertiary)] rounded-lg text-[var(--text-muted)] hover:text-[var(--text-primary)] transition-colors cursor-pointer",
              isCollapsed && "mx-auto",
            )}
          >
            {isCollapsed ? (
              <PanelLeftOpen size={21} />
            ) : (
              <PanelLeftClose size={21} />
            )}
          </button>
        )}
      </div>

      {/* Navigation */}
      <nav className="flex-1 space-y-1.5 px-1 overflow-y-auto">
        {ADMIN_NAV_ITEMS.map((item) => {
          const isActive =
            item.href === "/school-admin"
              ? pathname === "/school-admin"
              : pathname.startsWith(item.href);

          const hasAccess =
            !item.requiredFeature || canSchoolAccess(item.requiredFeature, tier);

          const Icon = item.icon;

          return (
            <div key={item.href} className="relative">
              <Tooltip>
                <TooltipTrigger asChild>
                  {hasAccess ? (
                    <Link
                      href={item.href}
                      onClick={closeMobileMenu}
                      className={cn(
                        "relative flex items-center rounded-xl p-3 transition-all duration-200 group overflow-hidden",
                        isCollapsed ? "justify-center" : "gap-3",
                        isActive
                          ? "text-[var(--text-primary)] font-semibold"
                          : "text-[var(--text-secondary)] hover:bg-[var(--bg-tertiary)] hover:text-[var(--text-primary)]",
                      )}
                    >
                      {isActive && (
                        <motion.div
                          layoutId="active-pill-admin"
                          className="absolute inset-0 bg-[var(--bg-tertiary)] border border-[var(--border-card)] rounded-xl z-0 shadow-sm"
                          transition={{ type: "spring", bounce: 0.15, duration: 0.5 }}
                        />
                      )}
                      <Icon
                        size={21}
                        className={cn(
                          "relative z-10 shrink-0 transition-transform duration-200 group-hover:scale-105",
                          isActive ? "text-[var(--accent)]" : "opacity-85",
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
                            <div className="ml-auto relative z-10 flex items-center gap-1 rounded-full border border-[var(--border-card)] px-2 py-0.5 bg-[var(--bg-primary)]">
                              <Sparkles size={10} className="text-[var(--accent)]" />
                              <span className="text-[9px] font-bold uppercase tracking-wide">
                                Pro
                              </span>
                            </div>
                          )}
                        </>
                      )}
                    </Link>
                  ) : (
                    <button
                      type="button"
                      className={cn(
                        "w-full relative flex items-center rounded-xl p-3 transition-all duration-200 opacity-50 cursor-not-allowed",
                        isCollapsed ? "justify-center" : "gap-3 justify-between",
                      )}
                    >
                      <div className="flex items-center gap-3">
                        <Icon size={21} className="shrink-0 text-[var(--text-muted)]" />
                        {!isCollapsed && (
                          <span className="text-[14px] font-medium text-[var(--text-muted)]">
                            {item.label}
                          </span>
                        )}
                      </div>
                      {!isCollapsed && (
                        <div className="flex items-center gap-1 rounded-full border border-[var(--border-card)] px-2 py-0.5 bg-[var(--bg-secondary)]">
                          <Lock size={10} className="text-[var(--text-muted)]" />
                          <span className="text-[9px] font-bold uppercase tracking-wide text-[var(--text-muted)]">
                            Upgrade
                          </span>
                        </div>
                      )}
                    </button>
                  )}
                </TooltipTrigger>
                <TooltipContent
                  side="right"
                  sideOffset={12}
                  className="bg-zinc-950 text-zinc-50 border border-zinc-800 shadow-xl px-3 py-1.5 text-xs font-medium rounded-lg"
                >
                  {!hasAccess
                    ? "Upgrade to Premium School to unlock feature"
                    : item.label}
                </TooltipContent>
              </Tooltip>
            </div>
          );
        })}
      </nav>

      {/* Upgrade callout */}
      {tier !== "premium_school" && !isCollapsed && (
        <motion.div
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          className="mt-4 rounded-2xl border border-[var(--border-card)] bg-[var(--bg-secondary)] p-4"
        >
          <div className="flex items-start gap-3">
            <div className="w-10 h-10 rounded-xl bg-[var(--accent)] text-[var(--accent-text)] flex items-center justify-center shrink-0">
              <Sparkles size={18} />
            </div>
            <div className="min-w-0">
              <h4 className="text-sm font-semibold text-[var(--text-primary)]">
                Upgrade to Premium
              </h4>
              <p className="mt-1 text-xs leading-relaxed text-[var(--text-muted)]">
                Unlock AI nutrition forecasting, advanced reports, and campus
                telemetry tracking.
              </p>
            </div>
          </div>
          <button
            onClick={() => {
              setActiveTab("billing");
              setSettingsOpen(true);
            }}
            className="mt-4 inline-flex w-full items-center justify-center rounded-xl bg-[var(--accent)] px-3 py-2.5 text-sm font-medium text-[var(--accent-text)] transition-opacity hover:opacity-90 cursor-pointer"
          >
            Upgrade Plan
          </button>
        </motion.div>
      )}

      {/* Footer profile */}
      <SidebarProfilePopover
        user={user}
        role="School Admin"
        isCollapsed={isCollapsed}
        notificationsTab={notificationsTab}
        billingTab={billingTab}
      />
    </div>
  );
}