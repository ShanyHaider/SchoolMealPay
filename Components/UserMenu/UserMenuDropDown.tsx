"use client";

import { useClerk, useUser } from "@clerk/nextjs";
import { motion, AnimatePresence } from "framer-motion";
import { useEffect, useRef } from "react";
import { UserAvatar } from "./UserAvatar";
import { MenuDivider } from "./MenuDivider";
import { MenuItem } from "./MenuItem";
import { MenuHeader } from "./MenuHeader";
// import { MenuFooter } from "./MenuFooter";

interface UserMenuDropdownProps {
  open: boolean;
  onClose: () => void;
}

export function UserMenuDropdown({ open, onClose }: UserMenuDropdownProps) {
  const { user } = useUser();
  const { signOut } = useClerk();
  const dropdownRef = useRef<HTMLDivElement>(null);

  // Close on outside click
  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (
        dropdownRef.current &&
        !dropdownRef.current.contains(e.target as Node)
      )
        onClose();
    };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, [onClose]);

  // Close on Escape
  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    document.addEventListener("keydown", handler);
    return () => document.removeEventListener("keydown", handler);
  }, [onClose]);

  const displayName =
    user?.fullName ??
    user?.username ??
    user?.primaryEmailAddress?.emailAddress ??
    "Account";
  const email = user?.primaryEmailAddress?.emailAddress ?? "";

  return (
    <AnimatePresence>
      {open && (
        <motion.div
          ref={dropdownRef}
          className="user-menu__dropdown"
          role="menu"
          aria-label="Account menu"
          initial={{ opacity: 0, y: -8, scale: 0.96 }}
          animate={{ opacity: 1, y: 0, scale: 1 }}
          exit={{ opacity: 0, y: -8, scale: 0.96 }}
          transition={{ duration: 0.15, ease: [0.16, 1, 0.3, 1] }}
        >
          <MenuHeader
            avatar={<UserAvatar user={user} size="md" />}
            name={displayName}
            email={email}
          />

          <MenuDivider />

          <MenuItem
            href="/account"
            icon="profile"
            label="Profile"
            onClick={onClose}
          />
          <MenuItem
            href="/account/security"
            icon="security"
            label="Security"
            onClick={onClose}
          />
          <MenuItem
            href="/account/billing"
            icon="billing"
            label="Subscription"
            onClick={onClose}
          />

          <MenuDivider />

          <MenuItem
            icon="signout"
            label="Sign out"
            onClick={() => signOut({ redirectUrl: "/" })}
            variant="danger"
          />

          {/* <MenuFooter /> */}
        </motion.div>
      )}
    </AnimatePresence>
  );
}
