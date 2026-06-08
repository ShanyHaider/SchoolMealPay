"use client";

import React from "react";
import Link from "next/link";
import { useUser, useClerk } from "@clerk/nextjs";
import { motion, AnimatePresence } from "framer-motion";
import {
  X,
  LayoutDashboard,
  Settings,
  LogOut,
  CreditCard,
  UtensilsCrossed,
  Home,
  Sparkles,
  DollarSign,
  Info,
} from "lucide-react";

interface MobileMenuProps {
  open: boolean;
  onClose: () => void;
  activeIdx: number;
  initialSignedIn?: boolean;
}

const NAV_ITEMS = [
  { label: "Home", href: "/", icon: Home },
  { label: "Features", href: "/features", icon: Sparkles },
  { label: "Pricing", href: "/pricing", icon: DollarSign },
  { label: "About", href: "/about", icon: Info },
];

export function MobileMenu({
  open,
  onClose,
  activeIdx,
  initialSignedIn = false,
}: MobileMenuProps) {
  const { user, isLoaded } = useUser();
  const { signOut } = useClerk();

  const resolvedSignedIn = isLoaded ? !!user : initialSignedIn;
  const dashboardHref =
    user?.publicMetadata?.role === "school_admin" ? "/school-admin" : "/parent";

  return (
    <AnimatePresence>
      {open && (
        <>
          {/* Backdrop Blur Overlay */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
            className="fixed inset-0 z-50 bg-black/60 backdrop-blur-md"
          />

          {/* Right Side Drawer Sheet */}
          <motion.div
            initial={{ x: "100%" }}
            animate={{ x: 0 }}
            exit={{ x: "100%" }}
            transition={{ type: "spring", damping: 25, stiffness: 200 }}
            className="fixed top-0 right-0 bottom-0 z-50 flex w-full max-w-xs flex-col border-l border-zinc-200/10 bg-zinc-950 p-6 shadow-2xl text-zinc-200"
          >
            {/* Drawer Header Alignment */}
            <div className="flex items-center justify-between pb-6 border-b border-zinc-900">
              <div className="flex items-center gap-2">
                <div className="flex h-8 w-8 items-center justify-center rounded-full bg-zinc-100 text-zinc-950 shadow-sm">
                  <UtensilsCrossed size={14} />
                </div>
                <span className="font-bold tracking-tight text-sm text-zinc-50">
                  SchoolMealPay
                </span>
              </div>
              <button
                onClick={onClose}
                className="flex h-8 w-8 items-center justify-center rounded-full border border-zinc-800 bg-zinc-900/50 text-zinc-400 hover:text-zinc-100 transition-colors cursor-pointer"
                aria-label="Close menu"
              >
                <X size={16} />
              </button>
            </div>

            {/* Scrollable Container Layout */}
            <div className="flex-1 overflow-y-auto py-6 space-y-6">
              {/* ── 1. ACCOUNT OVERLAY CAPSULE (When Signed In) ── */}
              {resolvedSignedIn && user && (
                <div className="rounded-2xl bg-linear-to-b from-zinc-800/90 to-zinc-900/90 p-3.5 border border-zinc-950 shadow-[0_4px_12px_rgba(0,0,0,0.4),inset_0_1px_1px_rgba(255,255,255,0.08)] flex items-center gap-3">
                  <div className="h-10 w-10 overflow-hidden rounded-full border border-zinc-700/80 bg-zinc-800 shadow-sm shrink-0">
                    {user.imageUrl ?
                      <img
                        src={user.imageUrl}
                        alt="User Avatar"
                        className="h-full w-full object-cover"
                      />
                      : <div className="h-full w-full flex items-center justify-center bg-zinc-700 text-xs font-bold uppercase text-zinc-300">
                        {user.firstName?.[0] || "U"}
                      </div>
                    }
                  </div>
                  <div className="min-w-0 flex-1">
                    <p className="text-sm font-bold tracking-tight text-zinc-50 truncate">
                      {user.fullName}
                    </p>
                    <p className="text-[11px] font-medium text-zinc-400 truncate mt-0.5">
                      {user.primaryEmailAddress?.emailAddress}
                    </p>
                  </div>
                </div>
              )}

              {/* ── 2. GLOBAL DIRECTORY ROUTING TRACK ── */}
              <div className="space-y-1.5 rounded-2xl bg-zinc-900/40 p-1.5 border border-zinc-900/60 shadow-inner">
                <p className="text-[10px] font-bold tracking-wider text-zinc-500 uppercase px-2.5 pt-1 pb-1">
                  Navigation
                </p>
                {NAV_ITEMS.map((item, i) => {
                  const isActive = i === activeIdx;
                  const Icon = item.icon;

                  return (
                    <Link
                      key={item.href}
                      href={item.href}
                      className={`
                        relative flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-semibold tracking-tight transition-all select-none
                        ${isActive ?
                          "bg-linear-to-b from-white to-zinc-100 text-zinc-950 shadow-md border border-zinc-300/10"
                          : "text-zinc-400 hover:text-zinc-100 hover:bg-zinc-900/60"
                        }
                      `}
                    >
                      <Icon
                        size={16}
                        className={isActive ? "text-zinc-950" : "opacity-60"}
                      />
                      {item.label}
                    </Link>
                  );
                })}
              </div>

              {/* ── 3. PRIVATE MANAGEMENT ACTION PLATES ── */}
              {resolvedSignedIn ?
                <div className="space-y-1.5 rounded-2xl bg-zinc-900/40 p-1.5 border border-zinc-900/60 shadow-inner">
                  <p className="text-[10px] font-bold tracking-wider text-zinc-500 uppercase px-2.5 pt-1 pb-1">
                    Management
                  </p>

                  <Link
                    href={dashboardHref}
                    className="flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-semibold tracking-tight text-zinc-400 hover:text-zinc-100 hover:bg-zinc-900/60 transition-colors"
                  >
                    <LayoutDashboard size={16} className="opacity-60" />
                    Control Dashboard
                  </Link>

                  <Link
                    href={`${dashboardHref}/settings`}
                    className="flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-semibold tracking-tight text-zinc-400 hover:text-zinc-100 hover:bg-zinc-900/60 transition-colors"
                  >
                    <Settings size={16} className="opacity-60" />
                    Account Settings
                  </Link>

                  <Link
                    href={`${dashboardHref}/billing`}
                    className="flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-semibold tracking-tight text-zinc-400 hover:text-zinc-100 hover:bg-zinc-900/60 transition-colors"
                  >
                    <CreditCard size={16} className="opacity-60" />
                    Billing Setup
                  </Link>
                </div>
                : /* Unauthenticated Flow Access CTA Triggers */
                <div className="flex flex-col gap-2 pt-2">
                  <Link
                    href="/sign-in"
                    onClick={onClose}
                    className="flex h-11 items-center justify-center rounded-xl border border-zinc-800 bg-zinc-900/50 text-sm font-semibold text-zinc-200 active:scale-98 transition-transform"
                  >
                    Sign in
                  </Link>
                  <Link
                    href="/sign-up"
                    onClick={onClose}
                    className="flex h-11 items-center justify-center rounded-xl bg-zinc-100 text-sm font-bold text-zinc-950 shadow-sm active:scale-98 transition-transform"
                  >
                    Get started
                  </Link>
                </div>
              }
            </div>

            {/* ── 4. SECURE SIGN OUT ANCHOR FOOTER ── */}
            {resolvedSignedIn && (
              <div className="pt-4 border-t border-zinc-900">
                <button
                  onClick={async () => {
                    onClose();
                    await signOut({ redirectUrl: "/" });
                  }}
                  className="w-full flex h-11 items-center justify-center gap-2 rounded-xl bg-red-500/15 border border-red-500/10 text-sm font-bold text-red-500 active:scale-[0.98] transition-transform cursor-pointer"
                >
                  <LogOut size={15} />
                  Logout
                </button>
              </div>
            )}
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}
