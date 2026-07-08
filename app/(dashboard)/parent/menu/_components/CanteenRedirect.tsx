"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";

interface CanteenRedirectProps {
  canteenIds: string[];
  date: string;
}

/**
 * Rendered by the page Server Component only when no `?canteen=` param is
 * present. Reads the parent's last-used canteen from localStorage and
 * silently redirects to it — no visible flash, no browser history entry.
 */
export function CanteenRedirect({ canteenIds, date }: CanteenRedirectProps) {
  const router = useRouter();

  useEffect(() => {
    const preferred = localStorage.getItem("preferred_canteen");
    if (preferred && canteenIds.includes(preferred)) {
      router.replace(`/parent/menu?date=${date}&canteen=${preferred}`);
    }
  }, []);

  return null;
}
