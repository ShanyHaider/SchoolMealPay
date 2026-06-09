"use client";

// app/(dashboard)/system-admin/_components/SystemAdminTopbar.tsx

import { usePathname } from "next/navigation";
import { ThemeToggleButton } from "@/components/ThemeProvider";
import { ShieldCheck, Activity } from "lucide-react";

const BREADCRUMB_MAP: Record<string, string> = {
    "/system-admin": "Overview",
    "/system-admin/users": "User Ledger",
    "/system-admin/schools": "Schools",
    "/system-admin/audit": "Audit Trail",
    "/system-admin/health": "System Health",
};

export function SystemAdminTopbar({ user }: { user: any }) {
    const pathname = usePathname();

    const pageTitle =
        Object.entries(BREADCRUMB_MAP)
            .filter(([path]) => pathname === path || pathname.startsWith(path + "/"))
            .sort((a, b) => b[0].length - a[0].length)[0]?.[1] ?? "Overview";

    return (
        <header className="sticky top-0 z-30 flex h-16 w-full items-center justify-between border-b border-[var(--border-primary)] bg-[var(--bg-primary)]/80 backdrop-blur-md px-4 sm:px-6 lg:px-8">
            {/* Left: page title */}
            <div className="flex flex-col justify-center pl-12 lg:pl-0">
                <h2 className="text-sm font-semibold text-[var(--text-primary)] md:text-base leading-none mb-1">
                    {pageTitle}
                </h2>
                <p className="text-[11px] text-[var(--text-muted)] hidden sm:block leading-none">
                    System-wide administrative operations
                </p>
            </div>

            {/* Right: badges + theme toggle */}
            <div className="flex items-center gap-2 sm:gap-3">
                {/* Root access badge */}
                <div className="hidden sm:flex items-center gap-1.5 px-2.5 py-1 rounded-lg border border-red-500/20 bg-red-500/8">
                    <ShieldCheck size={12} className="text-red-500" />
                    <span className="text-[10px] font-bold text-red-500 uppercase tracking-wider">
                        Root Access
                    </span>
                </div>

                {/* Live latency indicator */}
                <div className="hidden md:flex items-center gap-1.5 px-2.5 py-1 rounded-lg border border-[var(--border-card)] bg-[var(--bg-secondary)]">
                    <Activity size={12} className="text-green-500" />
                    <span className="text-[10px] font-mono font-bold text-[var(--text-muted)]">
                        DB <span className="text-green-500">live</span>
                    </span>
                </div>

                {/* Theme toggle */}
                <ThemeToggleButton />
            </div>
        </header>
    );
}