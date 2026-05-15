"use client";

import Link from "next/link";
import { useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { useUser, useClerk } from "@clerk/nextjs";
import { NavAvatar } from "./NavAvatar";

const NAV_ITEMS = [
  { label: "Home", href: "/" },
  { label: "Features", href: "/features" },
  { label: "Pricing", href: "/pricing" },
  { label: "About", href: "/about" },
];

/* ── Mobile user section — card-style, not a bare avatar ──── */
function MobileUserSection({
  onNavigate,
  isLoaded,
}: {
  onNavigate: () => void;
  isLoaded: boolean;
}) {
  const { user } = useUser();
  const { signOut } = useClerk();

  const displayName =
    user?.fullName ??
    user?.username ??
    user?.primaryEmailAddress?.emailAddress ??
    "Account";
  const email = user?.primaryEmailAddress?.emailAddress ?? "";

  return (
    <>
      {/* User identity card */}
      <div className="mobile-user">
        <NavAvatar user={user} isLoaded={isLoaded} size="lg" />
        <div className="mobile-user__info">
          <span className="mobile-user__name">
            {isLoaded ? displayName : "·····"}
          </span>
          <span className="mobile-user__email">{isLoaded ? email : ""}</span>
        </div>
      </div>

      {/* Action links */}
      <div className="mobile-user__links">
        <Link
          href="/dashboard"
          className="mobile-user__link"
          onClick={onNavigate}
        >
          <span className="user-menu__item-icon">⊞</span> Dashboard
        </Link>
        <Link
          href="/account"
          className="mobile-user__link"
          onClick={onNavigate}
        >
          <span className="user-menu__item-icon">◎</span> Account settings
        </Link>
        <Link
          href="/billing"
          className="mobile-user__link"
          onClick={onNavigate}
        >
          <span className="user-menu__item-icon">◈</span> Billing
        </Link>
        <button
          className="mobile-user__link mobile-user__link--danger"
          onClick={() => signOut({ redirectUrl: "/" })}
        >
          <span className="user-menu__item-icon">⎋</span> Sign out
        </button>
      </div>
    </>
  );
}

/* ── Auth section — signed-out state ──────────────────────── */
function MobileAuthSection({
  onNavigate,
  initialSignedIn,
}: {
  onNavigate: () => void;
  initialSignedIn: boolean;
}) {
  const { isSignedIn, isLoaded } = useUser();
  // Use server value until Clerk hydrates — prevents layout shift
  const resolvedSignedIn = isLoaded ? !!isSignedIn : initialSignedIn;

  if (resolvedSignedIn) {
    return <MobileUserSection onNavigate={onNavigate} isLoaded={isLoaded} />;
  }

  return (
    <>
      <Link href="/sign-in" className="navbar__sign-in" onClick={onNavigate}>
        Sign in
      </Link>
      <Link href="/sign-up" className="navbar__cta" onClick={onNavigate}>
        Get started
      </Link>
    </>
  );
}

/* ── Drawer ────────────────────────────────────────────────── */
export function MobileMenu({
  open,
  onClose,
  activeIdx,
  initialSignedIn,
}: {
  open: boolean;
  onClose: () => void;
  activeIdx: number;
  initialSignedIn: boolean;
}) {
  // Lock body scroll while open
  useEffect(() => {
    document.body.style.overflow = open ? "hidden" : "";
    return () => {
      document.body.style.overflow = "";
    };
  }, [open]);

  return (
    <AnimatePresence>
      {open && (
        <>
          {/* Backdrop */}
          <motion.div
            className="mobile-menu__backdrop"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.22 }}
            onClick={onClose}
          />

          {/* Drawer */}
          <motion.div
            className="mobile-menu__drawer"
            initial={{ x: "100%" }}
            animate={{ x: 0 }}
            exit={{ x: "100%" }}
            transition={{ type: "spring", stiffness: 380, damping: 38 }}
          >
            {/* Top bar */}
            <div className="mobile-menu__top">
              <Link href="/" className="navbar__logo" onClick={onClose}>
                SchoolMealPay
              </Link>
              <button
                className="mobile-menu__close"
                onClick={onClose}
                aria-label="Close menu"
              >
                ✕
              </button>
            </div>

            {/* Nav links */}
            <nav className="mobile-menu__nav">
              {NAV_ITEMS.map((item, i) => (
                <Link
                  key={item.href}
                  href={item.href}
                  className={`mobile-menu__link${i === activeIdx ? " mobile-menu__link--active" : ""}`}
                  onClick={onClose}
                >
                  {item.label}
                </Link>
              ))}
            </nav>

            <div className="mobile-menu__sep" />

            {/* Auth */}
            <div className="mobile-menu__auth">
              <MobileAuthSection
                onNavigate={onClose}
                initialSignedIn={initialSignedIn}
              />
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}
