// app/(dashboard)/system-admin/layout.tsx

import { Suspense } from "react";
import { SystemAdminLayoutContent } from "./_components/SystemAdminLayoutContent";

export default function SystemAdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <Suspense fallback={<div className="min-h-screen w-full bg-(--bg-secondary)" />}>
      <SystemAdminLayoutContent>{children}</SystemAdminLayoutContent>
    </Suspense>
  );
}