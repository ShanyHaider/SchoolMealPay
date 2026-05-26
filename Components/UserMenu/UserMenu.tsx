"use client";

import { useState, useRef, useEffect } from "react";
import { createPortal } from "react-dom";
import { useUser, useClerk } from "@clerk/nextjs";
import { useSearchParams, useRouter, usePathname } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";
import {
  LayoutDashboard,
  Settings,
  LogOut,
  ChevronDown,
  X,
  User as UserIcon,
  ShieldCheck,
  CreditCard,
} from "lucide-react";
import { ProfileTab } from "./ProfileTab";
import { SecurityTab } from "./SecurityTab";
import { BillingTab } from "./BillingTab";

interface UserMenuProps {
  isLoaded: boolean;
}
type SettingsTab = "profile" | "security" | "billing";

export function UserMenu({ isLoaded }: UserMenuProps) {
  const { user } = useUser();
  const { signOut } = useClerk();
  const searchParams = useSearchParams();
  const router = useRouter();
  const pathname = usePathname();

  const [isOpen, setIsOpen] = useState(false);
  const [isSettingsOpen, setIsSettingsOpen] = useState(false);
  const [activeTab, setActiveTab] = useState<SettingsTab>("profile");
  const [mounted, setMounted] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);

  const isAlreadyOnDashboard =
    pathname === "/parent" ||
    pathname === "/school-admin" ||
    pathname === "/super-admin" ||
    pathname === "/canteen-staff";

  useEffect(() => {
    setMounted(true);
    return () => setMounted(false);
  }, []);

  useEffect(() => {
    const tab = searchParams.get("tab") as SettingsTab | null;
    if (tab && ["profile", "security", "billing"].includes(tab)) {
      setActiveTab(tab);
      setIsSettingsOpen(true);
      const params = new URLSearchParams(searchParams.toString());
      params.delete("tab");
      params.delete("status");
      const newUrl =
        params.toString() ? `?${params.toString()}` : window.location.pathname;
      router.replace(newUrl, { scroll: false });
    }
  }, [searchParams]);

  useEffect(() => {
    function handleClickOutside(e: MouseEvent) {
      if (menuRef.current && !menuRef.current.contains(e.target as Node))
        setIsOpen(false);
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  if (!isLoaded || !user) {
    return (
      <div className="h-11 w-28 animate-pulse rounded-full bg-zinc-200/50 dark:bg-zinc-800/50" />
    );
  }

  return (
    <div className="relative" ref={menuRef}>
      {/* Trigger */}
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="flex h-11 items-center gap-2.5 rounded-full px-3.5 py-2 text-base font-bold transition-all bg-linear-to-b from-zinc-100 to-zinc-200/80 text-zinc-800 border border-zinc-300/80 dark:from-zinc-800/90 dark:to-zinc-900/90 dark:text-zinc-200 dark:border-zinc-950 cursor-pointer"
      >
        <div className="h-6.5 w-6.5 overflow-hidden rounded-full border border-zinc-300/50 bg-zinc-300 dark:bg-zinc-700 flex items-center justify-center shrink-0">
          {user.imageUrl ?
            <img
              src={user.imageUrl}
              className="h-full w-full object-cover"
              alt="avatar"
            />
          : user.firstName?.[0]}
        </div>
        <span className="max-w-25 truncate text-sm">
          {user.firstName || "Account"}
        </span>
        <ChevronDown
          size={15}
          className={`opacity-60 transition-transform ${isOpen ? "rotate-180" : ""}`}
        />
      </button>

      {/* Dropdown Menu */}
      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ opacity: 0, y: 8, scale: 0.96 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 8, scale: 0.96 }}
            className="absolute right-0 mt-2 z-50 w-56 p-1.5 border backdrop-blur-xl rounded-2xl border-zinc-200/80 bg-white/95 dark:border-zinc-800/80 dark:bg-zinc-950/95 text-zinc-800 dark:text-zinc-200 shadow-2xl"
          >
            <div className="px-3 py-2.5 border-b border-zinc-100 dark:border-zinc-900 mb-1">
              <p className="text-xs font-bold text-zinc-900 dark:text-zinc-50 truncate">
                {user.fullName}
              </p>
              <p className="text-[10px] text-zinc-400 truncate mt-0.5">
                {user.primaryEmailAddress?.emailAddress}
              </p>
            </div>
            <div className="space-y-0.5">
              {!isAlreadyOnDashboard && (
                <a
                  href="/dashboard"
                  onClick={() => setIsOpen(false)}
                  className="flex items-center gap-2.5 rounded-xl px-3 py-2 text-xs font-medium text-zinc-600 dark:text-zinc-400 hover:bg-zinc-100 dark:hover:bg-zinc-900"
                >
                  <LayoutDashboard size={14} /> Control Dashboard
                </a>
              )}
              <button
                onClick={() => {
                  setIsOpen(false);
                  setIsSettingsOpen(true);
                }}
                className="w-full flex items-center gap-2.5 rounded-xl px-3 py-2 text-xs font-medium text-zinc-600 dark:text-zinc-400 hover:bg-zinc-100 dark:hover:bg-zinc-900 text-left cursor-pointer"
              >
                <Settings size={14} /> Account Settings
              </button>
              <div className="h-px bg-zinc-100 dark:bg-zinc-900 my-1" />
              <button
                onClick={async () => {
                  setIsOpen(false);
                  await signOut({ redirectUrl: "/" });
                }}
                className="w-full flex items-center gap-2.5 rounded-xl px-3 py-2 text-xs font-semibold text-red-500 hover:bg-red-500/10 text-left cursor-pointer"
              >
                <LogOut size={14} /> Logout
              </button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Settings Modal Portal */}
      {mounted &&
        createPortal(
          <AnimatePresence>
            {isSettingsOpen && (
              <div className="fixed inset-0 z-9999 flex items-center justify-center p-2 sm:p-4 isolate">
                {/* Backdrop */}
                <motion.div
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  exit={{ opacity: 0 }}
                  onClick={() => setIsSettingsOpen(false)}
                  className="absolute inset-0 bg-black/40 backdrop-blur-md dark:bg-black/60"
                />

                {/* Modal Layout Frame */}
                <motion.div
                  initial={{ opacity: 0, scale: 0.98, y: 10 }}
                  animate={{ opacity: 1, scale: 1, y: 0 }}
                  exit={{ opacity: 0, scale: 0.98, y: 10 }}
                  className="relative flex flex-col md:flex-row h-full max-h-[90vh] md:h-155 w-full max-w-4xl overflow-hidden rounded-3xl border border-zinc-200/80 bg-white dark:border-zinc-800/80 dark:bg-zinc-950 text-zinc-800 dark:text-zinc-200 shadow-2xl"
                >
                  {/* Sidebar / Nav — contains close button on desktop so it never
                      overlaps the scrollable content area */}
                  <div className="w-full md:w-56 border-b md:border-b-0 md:border-r border-zinc-100 bg-zinc-50/50 dark:border-zinc-900 dark:bg-zinc-950/40 shrink-0 flex flex-col">
                    {/* Header row with title + close button */}
                    <div className="flex items-start justify-between px-5 pt-5 pb-0 md:pt-8 md:pb-0">
                      <div className="px-2 mb-3 md:mb-6">
                        <h2 className="text-lg md:text-xl font-black tracking-tight text-zinc-950 dark:text-white">
                          Settings
                        </h2>
                      </div>
                      {/* Close button — part of the non-scrolling sidebar so it
                          can never overlap the scrollable content on the right */}
                      <button
                        onClick={() => setIsSettingsOpen(false)}
                        className="rounded-xl p-1.5 text-zinc-400 hover:bg-zinc-200/60 dark:hover:bg-zinc-800 transition-colors cursor-pointer mt-0.5 shrink-0"
                      >
                        <X size={18} />
                      </button>
                    </div>

                    {/* Tab nav */}
                    <nav className="flex md:flex-col gap-1 overflow-x-auto style-scroll-hidden md:overflow-visible px-4 md:px-5 pb-4 md:pb-5">
                      {(
                        ["profile", "security", "billing"] as SettingsTab[]
                      ).map((tab) => (
                        <button
                          key={tab}
                          onClick={() => setActiveTab(tab)}
                          className={`flex items-center gap-2.5 rounded-xl px-3 py-2 md:py-2.5 text-xs font-bold capitalize transition-all shrink-0 cursor-pointer ${
                            activeTab === tab ?
                              "bg-zinc-950 text-white dark:bg-white dark:text-zinc-950"
                            : "text-zinc-500 hover:bg-zinc-100 dark:text-zinc-400 dark:hover:bg-zinc-900"
                          }`}
                        >
                          {tab === "profile" && <UserIcon size={14} />}
                          {tab === "security" && <ShieldCheck size={14} />}
                          {tab === "billing" && <CreditCard size={14} />}
                          {tab}
                        </button>
                      ))}
                    </nav>
                  </div>

                  {/* Scrollable content — close button is NOT inside here */}
                  <div className="flex-1 p-5 sm:p-8 md:p-10 pt-8 overflow-y-auto style-scroll-hidden">
                    {activeTab === "profile" && <ProfileTab />}
                    {activeTab === "security" && <SecurityTab />}
                    {activeTab === "billing" && <BillingTab />}
                  </div>
                </motion.div>
              </div>
            )}
          </AnimatePresence>,
          document.body,
        )}

      <style jsx global>{`
        .style-scroll-hidden::-webkit-scrollbar {
          display: none;
        }
        .style-scroll-hidden {
          -ms-overflow-style: none;
          scrollbar-width: none;
        }
      `}</style>
    </div>
  );
}
