"use client";

// components/sidebar/SidebarProfilePopover.tsx
// Shared profile popover + settings modal used by ParentSidebar, SchoolAdminSidebar, and StaffSidebar.
// `billingTab` is optional — when omitted the Billing tab and menu button are hidden (staff use case).

import React, { useState, useRef, useEffect } from "react";
import { useClerk } from "@clerk/nextjs";
import { motion, AnimatePresence } from "framer-motion";
import { createPortal } from "react-dom";
import {
  Settings,
  CreditCard,
  Bell,
  LogOut,
  ChevronUp,
  X,
  User as UserIcon,
  ShieldCheck,
} from "lucide-react";
import { cn } from "@/lib/utils";
import type { usersTable } from "@/drizzle/schema";
import { ProfileTab } from "@/components/userMenu/tabs/ProfileTab";
import { SecurityTab } from "@/components/userMenu/tabs/SecurityTab";

type User = typeof usersTable.$inferSelect;
export type SettingsTab = "profile" | "security" | "billing" | "notifications";

const TAB_CONFIG: { id: SettingsTab; label: string; icon: React.ElementType }[] = [
  { id: "profile", label: "Profile", icon: UserIcon },
  { id: "security", label: "Security", icon: ShieldCheck },
  { id: "billing", label: "Billing", icon: CreditCard },
  { id: "notifications", label: "Notifications", icon: Bell },
];

// ─── Settings Modal ───────────────────────────────────────────────────────────

export function SidebarSettingsModal({
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
  billingTab?: React.ReactNode;
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

  // Only show billing tab if billingTab content was provided
  const visibleTabs = billingTab
    ? TAB_CONFIG
    : TAB_CONFIG.filter((t) => t.id !== "billing");

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
                {visibleTabs.map(({ id, label, icon: Icon }) => (
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

// ─── Profile Popover ──────────────────────────────────────────────────────────

export function SidebarProfilePopover({
  user,
  role,
  isCollapsed,
  notificationsTab,
  billingTab,
}: {
  user: User;
  /** Label shown under the name, e.g. "Parent", "School Admin", "Canteen Staff" */
  role: string;
  isCollapsed: boolean;
  notificationsTab: React.ReactNode;
  /** Optional — omit for roles without billing (e.g. canteen staff) */
  billingTab?: React.ReactNode;
}) {
  const { signOut } = useClerk();
  const [isOpen, setIsOpen] = useState(false);
  const [mounted, setMounted] = useState(false);
  const [popoverStyle, setPopoverStyle] = useState<React.CSSProperties>({});
  const [settingsOpen, setSettingsOpen] = useState(false);
  const [activeTab, setActiveTab] = useState<SettingsTab>("profile");
  const triggerRef = useRef<HTMLButtonElement>(null);
  const popoverRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    setMounted(true);
    return () => setMounted(false);
  }, []);

  useEffect(() => {
    function handleClickOutside(e: MouseEvent) {
      const target = e.target as Node;
      if (
        !triggerRef.current?.contains(target) &&
        !popoverRef.current?.contains(target)
      ) {
        setIsOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const handleTriggerClick = () => {
    if (!triggerRef.current) return;
    const rect = triggerRef.current.getBoundingClientRect();
    setPopoverStyle({
      position: "fixed",
      left: rect.right + 12,
      bottom: window.innerHeight - rect.bottom,
      zIndex: 99999,
    });
    setIsOpen((v) => !v);
  };

  const openSettings = (tab: SettingsTab) => {
    setActiveTab(tab);
    setIsOpen(false);
    setSettingsOpen(true);
  };

  const popover = mounted
    ? createPortal(
      <AnimatePresence>
        {isOpen && (
          <motion.div
            ref={popoverRef}
            initial={{ opacity: 0, x: -8, scale: 0.96 }}
            animate={{ opacity: 1, x: 0, scale: 1 }}
            exit={{ opacity: 0, x: -8, scale: 0.96 }}
            transition={{ duration: 0.15 }}
            style={popoverStyle}
            className="w-52 p-1.5 rounded-2xl border border-[var(--border-card)] bg-[var(--bg-card)] shadow-2xl"
          >
            {/* User info */}
            <div className="px-3 py-2.5 border-b border-[var(--border-primary)] mb-1">
              <p className="text-xs font-bold text-[var(--text-primary)] truncate">
                {user.name}
              </p>
              <p className="text-[10px] text-[var(--text-muted)] truncate mt-0.5">
                {role}
              </p>
            </div>

            {/* Actions */}
            <div className="space-y-0.5">
              <button
                onClick={() => openSettings("profile")}
                className="w-full flex items-center gap-2.5 rounded-xl px-3 py-2 text-xs font-medium text-[var(--text-secondary)] hover:bg-[var(--bg-tertiary)] hover:text-[var(--text-primary)] text-left cursor-pointer transition-colors"
              >
                <Settings size={13} /> Settings
              </button>

              {billingTab && (
                <button
                  onClick={() => openSettings("billing")}
                  className="w-full flex items-center gap-2.5 rounded-xl px-3 py-2 text-xs font-medium text-[var(--text-secondary)] hover:bg-[var(--bg-tertiary)] hover:text-[var(--text-primary)] text-left cursor-pointer transition-colors"
                >
                  <CreditCard size={13} /> Billing
                </button>
              )}

              <button
                onClick={() => openSettings("notifications")}
                className="w-full flex items-center gap-2.5 rounded-xl px-3 py-2 text-xs font-medium text-[var(--text-secondary)] hover:bg-[var(--bg-tertiary)] hover:text-[var(--text-primary)] text-left cursor-pointer transition-colors"
              >
                <Bell size={13} /> Notifications
              </button>

              <div className="h-px bg-[var(--border-primary)] my-1" />

              <button
                onClick={async () => {
                  setIsOpen(false);
                  await signOut({ redirectUrl: "/" });
                }}
                className="w-full flex items-center gap-2.5 rounded-xl px-3 py-2 text-xs font-semibold text-red-500 hover:bg-red-500/10 text-left cursor-pointer transition-colors"
              >
                <LogOut size={13} /> Logout
              </button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>,
      document.body,
    )
    : null;

  return (
    <>
      <SidebarSettingsModal
        isOpen={settingsOpen}
        onClose={() => setSettingsOpen(false)}
        initialTab={activeTab}
        notificationsTab={notificationsTab}
        billingTab={billingTab}
      />

      {popover}

      <button
        ref={triggerRef}
        onClick={handleTriggerClick}
        className={cn(
          "w-full flex items-center gap-3 px-2 py-2 rounded-xl hover:bg-[var(--bg-tertiary)] transition-colors cursor-pointer",
          isCollapsed && "justify-center px-0",
        )}
      >
        <div className="w-9 h-9 rounded-full bg-zinc-800 border border-[var(--border-primary)] overflow-hidden shrink-0 shadow-sm flex items-center justify-center">
          {user.imageUrl ? (
            <img
              src={user.imageUrl}
              alt={user.name ?? "User avatar"}
              className="w-full h-full object-cover"
            />
          ) : (
            <span className="text-sm font-bold text-white uppercase">
              {user.name?.[0] || "U"}
            </span>
          )}
        </div>

        {!isCollapsed && (
          <>
            <div className="flex flex-col min-w-0 flex-1 text-left">
              <span className="text-sm font-semibold text-[var(--text-primary)] truncate leading-tight">
                {user.name}
              </span>
              <span className="text-[10px] uppercase tracking-[0.2em] text-[var(--text-muted)] font-bold mt-0.5">
                {role}
              </span>
            </div>
            <ChevronUp
              size={14}
              className={cn(
                "text-[var(--text-muted)] shrink-0 transition-transform duration-200",
                isOpen && "rotate-180",
              )}
            />
          </>
        )}
      </button>
    </>
  );
}