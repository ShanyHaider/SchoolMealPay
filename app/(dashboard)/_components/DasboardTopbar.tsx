"use client";

import { Search, Bell } from "lucide-react";
import { UserMenu } from "@/components/userMenu/UserMenu";
import { ThemeToggleButton } from "@/components/ThemeProvider";
import { useUser } from "@clerk/nextjs";
import { usersTable } from "@/drizzle/schema";
import Link from "next/link";

type User = typeof usersTable.$inferSelect;

interface DashboardTopbarProps {
    user: User;
}

export function SchoolAdminTopbar({ user }: DashboardTopbarProps) {
    const { isLoaded } = useUser();
    return (
        <header className="sticky top-0 z-30 flex h-16 w-full items-center justify-between border-b border-(--border-primary) bg-(--bg-primary)/80 backdrop-blur-md px-4 sm:px-6 lg:px-8">
            {/* Left Section: Context Titles */}
            {/* pl-12 shifts the text over on mobile viewports to make clear room for the menu button */}
            <div className="flex flex-col justify-center pl-12 lg:pl-0">
                <h2 className="text-sm font-semibold text-(--text-primary) md:text-base leading-none mb-1">
                    Dashboard
                </h2>

            </div>

            {/* Right Section: Interactive Tool Utilities */}
            <div className="flex items-center gap-2 sm:gap-3">
                {/* Global Search Bar */}


                {/* Animated Theme Switcher */}
                <ThemeToggleButton />

                {/* Activity Alerts Notifications */}
                <Link
                    href="/parent/notifications"
                    className="flex h-9 w-9 items-center justify-center rounded-lg border border-(--border-primary) bg-(--bg-secondary) text-(--text-secondary) hover:bg-(--bg-tertiary) hover:text-(--text-primary) transition-colors relative"
                >
                    <Bell size={16} />
                    <span className="absolute top-2 right-2.5 w-2 h-2 bg-red-500 rounded-full border-2 border-(--bg-primary)" />
                </Link>

                {/* User Status Profile Link */}
                <UserMenu isLoaded={isLoaded} />

            </div>
        </header>
    );
}
