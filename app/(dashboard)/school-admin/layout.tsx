import { Suspense } from "react";

import { AdminLayoutContent } from "./_components/AdminLayoutContent";

export default function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <Suspense
      fallback={
        <div className="min-h-screen w-full bg-(--bg-secondary)" />
      }
    >
      <AdminLayoutContent>
        {children}
      </AdminLayoutContent>
    </Suspense>
  );
}