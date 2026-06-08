"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";
import { ThemeToggleButton } from "../ThemeProvider";
import { useUser } from "@clerk/nextjs";
import { UtensilsCrossed, Menu } from "lucide-react";
import { MobileMenu } from "./MobileMenu";
import { UserMenu } from "../userMenu/UserMenu";

const NAV_ITEMS = [
  { label: "Home", href: "/" },
  { label: "Features", href: "/features" },
  { label: "Pricing", href: "/pricing" },
  { label: "About", href: "/about" },
];

interface NavbarProps {
  initialSignedIn?: boolean;
  billingTab?: React.ReactNode;
  notificationsTab?: React.ReactNode;
}

function DesktopAuth({
  initialSignedIn,
  billingTab,
  notificationsTab,
}: {
  initialSignedIn: boolean;
  billingTab?: React.ReactNode;
  notificationsTab?: React.ReactNode;
}) {
  const { isSignedIn, isLoaded } = useUser();
  const resolvedSignedIn = isLoaded ? !!isSignedIn : initialSignedIn;

  if (resolvedSignedIn) {
    return (
      <UserMenu
        isLoaded={isLoaded}
        billingTab={billingTab}
        notificationsTab={notificationsTab}
      />
    );
  }

  return (
    <div className="flex items-center gap-4">
      <Link
        href="/sign-in"
        className="hidden sm:inline-block rounded-full px-5 py-2.5 text-base font-semibold text-zinc-600 hover:text-zinc-900 dark:text-zinc-400 dark:hover:text-zinc-100 transition-colors"
      >
        Sign in
      </Link>
      <Link
        href="/sign-up"
        className="rounded-full bg-zinc-900 px-6 py-2.5 text-base font-bold text-white hover:bg-zinc-800 dark:bg-zinc-50 dark:text-zinc-950 dark:hover:bg-zinc-200 transition-colors shadow-md active:scale-95 duration-150"
      >
        Get started
      </Link>
    </div>
  );
}

export function Navbar({ initialSignedIn = false, billingTab, notificationsTab }: NavbarProps) {
  const pathname = usePathname();
  const activeIdx = NAV_ITEMS.findIndex((item) => item.href === pathname);
  const [hoveredIdx, setHoveredIdx] = useState<number | null>(null);
  const [mobileOpen, setMobileOpen] = useState(false);

  useEffect(() => { setMobileOpen(false); }, [pathname]);

  return (
    <>
      <div className="fixed top-6 left-0 right-0 z-50 flex w-full justify-center px-4">
        <nav className="flex h-16 w-full max-w-5xl items-center justify-between rounded-full border border-zinc-200/20 bg-white/70 px-5 shadow-2xl backdrop-blur-xl dark:border-zinc-800/40 dark:bg-zinc-950/70">
          {/* Brand */}
          <Link href="/" className="flex items-center gap-3 pl-1 group">
            <div className="flex h-11 w-11 items-center justify-center rounded-full bg-zinc-900 dark:bg-zinc-100 text-white dark:text-zinc-950 shadow-md transition-transform duration-200 group-hover:scale-105">
              <UtensilsCrossed size={18} />
            </div>
            <span className="hidden font-extrabold tracking-tight text-zinc-900 dark:text-zinc-50 text-base md:block">
              SchoolMealPay
            </span>
          </Link>

          {/* Nav links */}
          <div className="hidden md:flex items-center gap-3" onMouseLeave={() => setHoveredIdx(null)}>
            {NAV_ITEMS.map((item, i) => {
              const isActive = i === activeIdx;
              return (
                <Link key={item.href} href={item.href} onMouseEnter={() => setHoveredIdx(i)}
                  className={`relative px-5 py-2.5 text-base font-bold tracking-tight transition-all duration-200 rounded-full select-none ${isActive ? "text-zinc-950 dark:text-zinc-50" : "text-zinc-500 hover:text-zinc-900 dark:text-zinc-400 dark:hover:text-zinc-100"
                    }`}
                >
                  <AnimatePresence>
                    {hoveredIdx === i && (
                      <motion.div layoutId="nav-hover-pill"
                        className="absolute inset-0 -z-10 bg-linear-to-b from-zinc-100 to-zinc-200/40 dark:from-zinc-800/50 dark:to-zinc-900/50 rounded-full border border-zinc-200/50 dark:border-zinc-800/40 shadow-sm"
                        initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
                        transition={{ type: "spring", stiffness: 350, damping: 30 }}
                      />
                    )}
                  </AnimatePresence>
                  {isActive && (
                    <motion.div layoutId="nav-active-pill"
                      className="absolute inset-0 -z-20 bg-linear-to-b from-white to-zinc-100 dark:from-zinc-100 dark:to-zinc-200 border border-zinc-300/80 dark:border-zinc-950 rounded-full shadow-[0_3px_10px_rgba(0,0,0,0.1),inset_0_1px_0_rgba(255,255,255,0.6)] dark:shadow-[0_5px_15px_rgba(0,0,0,0.5)]"
                      transition={{ type: "spring", stiffness: 380, damping: 30 }}
                    />
                  )}
                  <span className={`relative z-10 ${isActive ? "text-zinc-950 dark:text-zinc-950" : ""}`}>
                    {item.label}
                  </span>
                </Link>
              );
            })}
          </div>

          {/* Right controls */}
          <div className="flex items-center gap-3.5 border-l border-zinc-200/30 dark:border-zinc-800/60 pl-5 pr-1">
            <ThemeToggleButton />
            <div className="hidden md:block">
              <DesktopAuth
                initialSignedIn={initialSignedIn}
                billingTab={billingTab}
                notificationsTab={notificationsTab}
              />
            </div>
            <button
              className="flex h-11 w-11 items-center justify-center rounded-full text-zinc-500 hover:bg-zinc-100 dark:text-zinc-400 dark:hover:bg-zinc-800/60 transition-colors md:hidden cursor-pointer"
              onClick={() => setMobileOpen(true)}
              aria-label="Open global mobile context navigation panel"
              aria-expanded={mobileOpen}
            >
              <Menu size={22} />
            </button>
          </div>
        </nav>
      </div>

      <MobileMenu
        open={mobileOpen}
        onClose={() => setMobileOpen(false)}
        activeIdx={activeIdx}
        initialSignedIn={initialSignedIn}
      // billingTab={billingTab}        // ✅ must be here
      // notificationsTab={notificationsTab}  // ✅ must be here
      />
    </>
  );
}