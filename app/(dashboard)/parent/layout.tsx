import { Suspense } from "react";
import { ParentLayoutContent } from "./_components/ParentLayoutContent";

export default function ParentLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <Suspense
      fallback={
        <div className="min-h-screen w-full bg-(--bg-secondary) animate-pulse" />
      }
    >
      <ParentLayoutContent>{children}</ParentLayoutContent>
    </Suspense>
  );
}