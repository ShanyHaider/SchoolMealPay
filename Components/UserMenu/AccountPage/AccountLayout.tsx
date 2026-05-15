"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import type { ReactNode } from "react";
// import { MenuFooter } from "@/components/UserMenu/MenuFooter";

type Tab = "profile" | "security" | "billing";

const NAV_ITEMS: { id: Tab; label: string; href: string; icon: ReactNode }[] = [
  {
    id: "profile",
    label: "Profile",
    href: "/account",
    icon: (
      <svg
        width="15"
        height="15"
        viewBox="0 0 16 16"
        fill="none"
        aria-hidden="true"
      >
        <circle
          cx="8"
          cy="5.5"
          r="2.5"
          stroke="currentColor"
          strokeWidth="1.4"
        />
        <path
          d="M3 13c0-2.761 2.239-5 5-5s5 2.239 5 5"
          stroke="currentColor"
          strokeWidth="1.4"
          strokeLinecap="round"
        />
      </svg>
    ),
  },
  {
    id: "security",
    label: "Security",
    href: "/account/security",
    icon: (
      <svg
        width="15"
        height="15"
        viewBox="0 0 16 16"
        fill="none"
        aria-hidden="true"
      >
        <path
          d="M8 2L3 4v4c0 3 2 5.5 5 6.5C11 13.5 13 11 13 8V4L8 2z"
          stroke="currentColor"
          strokeWidth="1.4"
          strokeLinejoin="round"
        />
        <path
          d="M5.5 8l1.5 1.5 3-3"
          stroke="currentColor"
          strokeWidth="1.4"
          strokeLinecap="round"
          strokeLinejoin="round"
        />
      </svg>
    ),
  },
  {
    id: "billing",
    label: "Billing",
    href: "/account/billing",
    icon: (
      <svg
        width="15"
        height="15"
        viewBox="0 0 16 16"
        fill="none"
        aria-hidden="true"
      >
        <rect
          x="2"
          y="4"
          width="12"
          height="9"
          rx="1.5"
          stroke="currentColor"
          strokeWidth="1.4"
        />
        <path d="M2 7h12" stroke="currentColor" strokeWidth="1.4" />
        <path
          d="M5 10.5h2"
          stroke="currentColor"
          strokeWidth="1.4"
          strokeLinecap="round"
        />
      </svg>
    ),
  },
];

interface AccountLayoutProps {
  children: ReactNode;
  activeTab: Tab;
}

export function AccountLayout({ children, activeTab }: AccountLayoutProps) {
  const pathname = usePathname();

  return (
    <div className="account-page">
      {/* ── Sidebar ── */}
      <aside className="account-sidebar">
        <div className="account-sidebar__header">
          <h1 className="account-sidebar__title">Account</h1>
          <p className="account-sidebar__subtitle">Manage your account info.</p>
        </div>

        <nav className="account-sidebar__nav" aria-label="Account sections">
          {NAV_ITEMS.map((item) => {
            const isActive =
              item.id === "profile" ?
                pathname === "/account"
              : pathname.startsWith(item.href);

            return (
              <Link
                key={item.id}
                href={item.href}
                className={`account-sidebar__item ${isActive ? "account-sidebar__item--active" : ""}`}
                aria-current={isActive ? "page" : undefined}
              >
                <span className="account-sidebar__item-icon">{item.icon}</span>
                {item.label}
              </Link>
            );
          })}
        </nav>

        <div className="account-sidebar__footer">{/* <MenuFooter /> */}</div>
      </aside>

      {/* ── Content ── */}
      <main className="account-page__content">{children}</main>
    </div>
  );
}
