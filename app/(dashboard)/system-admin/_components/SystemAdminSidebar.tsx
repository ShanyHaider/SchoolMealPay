"use client";

// app/(dashboard)/system-admin/_components/SystemAdminSidebar.tsx

import React, { useState, useRef, useEffect } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useClerk } from "@clerk/nextjs";
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
    Settings2,
    LogOut,
    ChevronUp,
    X,
    AlertTriangle,
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

// ─── Profile Popover ──────────────────────────────────────────────────────────

function ProfilePopover({
    user,
    isCollapsed,
}: {
    user: User;
    isCollapsed: boolean;
}) {
    const [open, setOpen] = useState(false);
    const [mounted, setMounted] = useState(false);
    const [pos, setPos] = useState({ top: 0, left: 0, width: 0 });
    const triggerRef = useRef<HTMLButtonElement>(null);
    const { signOut } = useClerk();

    useEffect(() => {
        setMounted(true);
        return () => setMounted(false);
    }, []);

    const openPopover = () => {
        if (!triggerRef.current) return;
        const rect = triggerRef.current.getBoundingClientRect();
        setPos({
            top: rect.top,
            left: rect.left + rect.width + 8,
            width: 240,
        });
        setOpen(true);
    };

    const initials = user.name
        ?.split(" ")
        .map((n) => n[0])
        .join("")
        .toUpperCase()
        .slice(0, 2) ?? "SA";

    return (
        <>
            <button
                ref={triggerRef}
                onClick={open ? () => setOpen(false) : openPopover}
                className={cn(
                    "mt-3 w-full flex items-center rounded-xl p-2.5 border border-[var(--border-card)] bg-[var(--bg-card)] hover:bg-[var(--bg-tertiary)] transition-all cursor-pointer group",
                    isCollapsed ? "justify-center" : "gap-3",
                )}
            >
                {/* Avatar */}
                <div className="w-8 h-8 rounded-lg bg-red-500/15 text-red-600 flex items-center justify-center font-bold text-xs shrink-0">
                    {initials}
                </div>

                {!isCollapsed && (
                    <>
                        <div className="flex-1 min-w-0 text-left">
                            <p className="text-[13px] font-semibold text-[var(--text-primary)] truncate leading-tight">
                                {user.name}
                            </p>
                            <p className="text-[10px] text-red-500 font-bold uppercase tracking-wider leading-tight mt-0.5">
                                Root Access
                            </p>
                        </div>
                        <ChevronUp
                            size={14}
                            className={cn(
                                "text-[var(--text-muted)] transition-transform duration-200 shrink-0",
                                open && "rotate-180",
                            )}
                        />
                    </>
                )}
            </button>

            {mounted &&
                open &&
                createPortal(
                    <>
                        {/* Backdrop */}
                        <div
                            className="fixed inset-0 z-[9998]"
                            onClick={() => setOpen(false)}
                        />
                        {/* Popover */}
                        <motion.div
                            initial={{ opacity: 0, scale: 0.97, y: 6 }}
                            animate={{ opacity: 1, scale: 1, y: 0 }}
                            exit={{ opacity: 0, scale: 0.97, y: 6 }}
                            style={{
                                position: "fixed",
                                top: pos.top,
                                left: pos.left,
                                width: pos.width,
                                zIndex: 9999,
                                transform: "translateY(-100%)",
                            }}
                            className="rounded-2xl border border-[var(--border-card)] bg-[var(--bg-card)] shadow-2xl overflow-hidden"
                        >
                            {/* Header */}
                            <div className="px-4 py-3 border-b border-[var(--border-primary)] bg-[var(--bg-secondary)]">
                                <div className="flex items-center gap-2.5">
                                    <div className="w-9 h-9 rounded-xl bg-red-500/15 text-red-600 flex items-center justify-center font-bold text-sm">
                                        {initials}
                                    </div>
                                    <div className="min-w-0">
                                        <p className="text-sm font-semibold text-[var(--text-primary)] truncate">
                                            {user.name}
                                        </p>
                                        <p className="text-[10px] text-[var(--text-muted)] truncate">
                                            {user.email}
                                        </p>
                                    </div>
                                </div>
                                <div className="mt-2 flex items-center gap-1.5 px-2 py-1 rounded-lg bg-red-500/10 border border-red-500/20 w-fit">
                                    <ShieldCheck size={11} className="text-red-500" />
                                    <span className="text-[10px] font-bold text-red-500 uppercase tracking-wider">
                                        System Administrator
                                    </span>
                                </div>
                            </div>

                            {/* Actions */}
                            <div className="p-2 space-y-0.5">
                                <Link
                                    href="/school-admin"
                                    onClick={() => setOpen(false)}
                                    className="flex items-center gap-2.5 w-full rounded-xl px-3 py-2.5 text-sm text-[var(--text-secondary)] hover:bg-[var(--bg-tertiary)] hover:text-[var(--text-primary)] transition-colors cursor-pointer"
                                >
                                    <LayoutDashboard size={14} />
                                    <span>School Admin Panel</span>
                                </Link>
                                <button
                                    onClick={() => signOut({ redirectUrl: "/sign-in" })}
                                    className="flex items-center gap-2.5 w-full rounded-xl px-3 py-2.5 text-sm text-red-500 hover:bg-red-500/10 transition-colors cursor-pointer"
                                >
                                    <LogOut size={14} />
                                    <span>Sign Out</span>
                                </button>
                            </div>
                        </motion.div>
                    </>,
                    document.body,
                )}
        </>
    );
}

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
                                <span className="font-semibold text-[var(--text-primary)]">
                                    Super Console
                                </span>
                                <span className="text-[10px] uppercase tracking-[0.2em] text-red-500 font-bold mt-1">
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

            {/* Warning banner */}
            {!isCollapsed && (
                <div className="mx-1 mb-4 flex items-center gap-2 rounded-xl border border-red-500/20 bg-red-500/8 px-3 py-2.5">
                    <AlertTriangle size={13} className="text-red-500 shrink-0" />
                    <p className="text-[10px] font-semibold text-red-500 leading-snug">
                        System-wide operations active. Changes are irreversible.
                    </p>
                </div>
            )}

            {/* Navigation */}
            <nav className="flex-1 space-y-1.5 px-1 overflow-y-auto">
                {NAV_ITEMS.map((item) => {
                    const isActive = item.exact
                        ? pathname === item.href
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
                                            isActive
                                                ? "text-[var(--text-primary)] font-semibold"
                                                : "text-[var(--text-secondary)] hover:bg-[var(--bg-tertiary)] hover:text-[var(--text-primary)]",
                                        )}
                                    >
                                        {isActive && (
                                            <motion.div
                                                layoutId="active-pill-sysadmin"
                                                className="absolute inset-0 bg-[var(--bg-tertiary)] border border-[var(--border-card)] rounded-xl z-0 shadow-sm"
                                                transition={{ type: "spring", bounce: 0.15, duration: 0.5 }}
                                            />
                                        )}
                                        <Icon
                                            size={21}
                                            className={cn(
                                                "relative z-10 shrink-0 transition-transform duration-200 group-hover:scale-105",
                                                isActive ? "text-red-500" : "opacity-85",
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

            {/* Exit console link */}
            {!isCollapsed && (
                <div className="px-1 mt-2 mb-1">
                    <Link
                        href="/school-admin"
                        className="flex items-center gap-2.5 w-full rounded-xl px-3 py-2.5 text-[13px] font-medium text-[var(--text-muted)] hover:bg-[var(--bg-tertiary)] hover:text-[var(--text-primary)] transition-colors border border-transparent hover:border-[var(--border-card)]"
                    >
                        <LayoutDashboard size={16} className="shrink-0" />
                        <span>Back to School Admin</span>
                    </Link>
                </div>
            )}

            {/* Footer profile */}
            <ProfilePopover user={user} isCollapsed={isCollapsed} />
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
                        <button className="p-2 bg-[var(--bg-card)] border border-[var(--border-card)] rounded-lg shadow-sm active:scale-95 transition-transform flex items-center justify-center cursor-pointer">
                            <Menu className="w-5 h-5 text-[var(--text-primary)]" />
                        </button>
                    </SheetTrigger>
                    <SheetContent
                        side="left"
                        className="p-0 w-[280px] bg-[var(--bg-primary)] border-r border-[var(--border-primary)]"
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
                className="fixed top-0 left-0 bottom-0 hidden lg:flex flex-col bg-[var(--bg-primary)] border-r border-[var(--border-primary)] z-40 overflow-hidden"
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