"use client";

import { useState } from "react";
import { useUser } from "@clerk/nextjs";
import { UserAvatar } from "./UserAvatar";
import { UserMenuDropdown } from "./UserMenuDropDown";

export function UserMenu({ isLoaded }: { isLoaded: boolean }) {
  const { user } = useUser();
  const [open, setOpen] = useState(false);

  return (
    <div className="user-menu">
      <button
        className="user-menu__trigger"
        onClick={() => setOpen((v) => !v)}
        aria-expanded={open}
        aria-haspopup="true"
        aria-label="Open account menu"
      >
        <UserAvatar user={user} size="sm" isLoaded={isLoaded} />
      </button>

      <UserMenuDropdown open={open} onClose={() => setOpen(false)} />
    </div>
  );
}
