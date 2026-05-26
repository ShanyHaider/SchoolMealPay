// app/(marketing)/layout.tsx
import { Navbar } from "@/components/navbar/Navbar";
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
      <Navbar />
      {/* pt-28 provides the perfect breathing room for the floating navbar */}
      <main>{children}</main>
    </>
  );
}
