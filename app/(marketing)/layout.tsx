// app/(marketing)/layout.tsx
import { NavbarServer } from "@/components/navbar/NavbarServer";
import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "SchoolMealPay - Marketing",
  description: "Marketing pages",
};

export default function MarketingLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <>
      <NavbarServer />
      {/* pt-28 provides the perfect breathing room for the floating navbar */}
      <main>{children}</main>
    </>
  );
}
