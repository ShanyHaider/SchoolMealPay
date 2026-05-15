"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useRef, useState, useLayoutEffect, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { useTheme } from "../ThemeProvider";
import { useUser } from "@clerk/nextjs";
import { UserMenu } from "./UserMenu";
import { MobileMenu } from "./MobileMenu";

const NAV_ITEMS = [
  { label: "Home", href: "/" },
  { label: "Features", href: "/features" },
  { label: "Pricing", href: "/pricing" },
  { label: "About", href: "/about" },
];

interface NavbarProps {
  initialSignedIn?: boolean;
}

/* ── Theme Toggle ──────────────────────────────────────────── */
function ThemeToggle() {
  const { resolvedTheme, setTheme } = useTheme();
  const isDark = resolvedTheme === "dark";
  return (
    <button
      onClick={() => setTheme(isDark ? "light" : "dark")}
      aria-label="Toggle theme"
      className="navbar__theme-toggle"
    >
      <AnimatePresence mode="wait" initial={false}>
        <motion.span
          key={isDark ? "sun" : "moon"}
          initial={{ opacity: 0, rotate: -30, scale: 0.8 }}
          animate={{ opacity: 1, rotate: 0, scale: 1 }}
          exit={{ opacity: 0, rotate: 30, scale: 0.8 }}
          transition={{ duration: 0.18 }}
          style={{ display: "flex" }}
        >
          {isDark ? "☀︎" : "◗"}
        </motion.span>
      </AnimatePresence>
    </button>
  );
}

/* ── Desktop auth section ──────────────────────────────────── */
function DesktopAuth({ initialSignedIn }: { initialSignedIn: boolean }) {
  const { isSignedIn, isLoaded } = useUser();
  // Server value used until Clerk hydrates — no flash, no layout shift
  const resolvedSignedIn = isLoaded ? !!isSignedIn : initialSignedIn;

  if (resolvedSignedIn) {
    return <UserMenu isLoaded={isLoaded} />;
  }

  return (
    <>
      <Link href="/sign-in" className="navbar__sign-in">
        Sign in
      </Link>
      <Link href="/sign-up" className="navbar__cta">
        Get started
      </Link>
    </>
  );
}

/* ── Navbar ────────────────────────────────────────────────── */
export function Navbar({ initialSignedIn = false }: NavbarProps) {
  const pathname = usePathname();
  const activeIdx = NAV_ITEMS.findIndex((item) => item.href === pathname);

  const [hoveredIdx, setHoveredIdx] = useState<number | null>(null);
  const [activeRect, setActiveRect] = useState({ left: 0, width: 0 });
  const [hoverRect, setHoverRect] = useState({ left: 0, width: 0 });
  const [mobileOpen, setMobileOpen] = useState(false);

  const itemRefs = useRef<(HTMLAnchorElement | null)[]>([]);
  const containerRef = useRef<HTMLDivElement>(null);

  const measureItem = (el: HTMLElement | null) => {
    if (!el || !containerRef.current) return { left: 0, width: 0 };
    const cLeft = containerRef.current.getBoundingClientRect().left;
    const r = el.getBoundingClientRect();
    return { left: r.left - cLeft, width: r.width };
  };

  useLayoutEffect(() => {
    if (activeIdx >= 0) setActiveRect(measureItem(itemRefs.current[activeIdx]));
  }, [pathname, activeIdx]);

  useLayoutEffect(() => {
    if (hoveredIdx !== null)
      setHoverRect(measureItem(itemRefs.current[hoveredIdx]));
  }, [hoveredIdx]);

  // Auto-close drawer on navigation
  useEffect(() => {
    setMobileOpen(false);
  }, [pathname]);

  return (
    <>
      <nav className="navbar">
        {/* Logo */}
        <Link href="/" className="navbar__logo">
          SchoolMealPay
        </Link>

        {/* Desktop pill nav — hidden on mobile via CSS */}
        <div className="navbar__pill-wrap">
          <div
            ref={containerRef}
            className="navbar__pill-inner"
            onMouseLeave={() => setHoveredIdx(null)}
          >
            {/* Active bubble */}
            {activeIdx >= 0 && (
              <motion.div
                className="navbar__bubble-active"
                animate={{ left: activeRect.left, width: activeRect.width }}
                transition={{ type: "spring", stiffness: 500, damping: 35 }}
              />
            )}

            {/* Hover bubble */}
            <AnimatePresence>
              {hoveredIdx !== null && hoveredIdx !== activeIdx && (
                <motion.div
                  key="hover"
                  className="navbar__bubble-hover"
                  initial={{
                    opacity: 0,
                    left: hoverRect.left,
                    width: hoverRect.width,
                  }}
                  animate={{
                    opacity: 1,
                    left: hoverRect.left,
                    width: hoverRect.width,
                  }}
                  exit={{ opacity: 0 }}
                  transition={{ duration: 0.15 }}
                />
              )}
            </AnimatePresence>

            {NAV_ITEMS.map((item, i) => (
              <Link
                key={item.href}
                href={item.href}
                ref={(el) => {
                  itemRefs.current[i] = el;
                }}
                onMouseEnter={() => setHoveredIdx(i)}
                className={`navbar__pill-item${i === activeIdx ? " navbar__pill-item--active" : ""}`}
              >
                {item.label}
              </Link>
            ))}
          </div>
        </div>

        {/* Right side */}
        <div className="navbar__right">
          <ThemeToggle />

          {/* Desktop auth — hidden on mobile */}
          <div
            className="navbar__auth navbar__auth--desktop"
            style={{ display: "flex", alignItems: "center", gap: "8px" }}
          >
            <DesktopAuth initialSignedIn={initialSignedIn} />
          </div>

          {/* Hamburger — hidden on desktop */}
          <button
            className="navbar__hamburger"
            onClick={() => setMobileOpen(true)}
            aria-label="Open menu"
            aria-expanded={mobileOpen}
          >
            <span />
            <span />
            <span />
          </button>
        </div>
      </nav>

      <MobileMenu
        open={mobileOpen}
        onClose={() => setMobileOpen(false)}
        activeIdx={activeIdx}
        initialSignedIn={initialSignedIn}
      />
    </>
  );
}
