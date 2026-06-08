import { Suspense } from "react";
import { auth } from "@clerk/nextjs/server";
import { redirect } from "next/navigation";
import { getUserFromDb } from "@/features/users/queries";

function RouterFallbackSkeleton() {
  return (
    <div style={{ display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", height: "100vh", gap: "16px", fontFamily: "system-ui, sans-serif", backgroundColor: "transparent" }}>
      <div style={{ width: 32, height: 32, border: "3px solid #e5e7eb", borderTop: "3px solid #111", borderRadius: "50%", animation: "spin 0.8s linear infinite" }} />
      <p style={{ fontSize: 14, color: "#6b7280", margin: 0 }}>Verifying secure portal session…</p>
      <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
    </div>
  );
}

async function DashboardRouterWorker({
  searchParams,
}: {
  searchParams: Promise<{ setup_attempt?: string }>;
}) {
  const { userId } = await auth();
  if (!userId) return redirect("/sign-in");

  console.log("[dashboard] clerkId:", userId);

  const dbUser = await getUserFromDb(userId);

  console.log("[dashboard] dbUser:", JSON.stringify(dbUser, null, 2));

  if (!dbUser) {
    const params = await searchParams;
    const attempt = parseInt(params.setup_attempt ?? "0", 10);

    console.log("[dashboard] no dbUser found for clerkId:", userId, "attempt:", attempt);

    if (attempt >= 5) {
      console.log("[dashboard] giving up after 5 attempts, redirecting to /account-error");
      return redirect("/account-error");
    }

    const nextUrl = `/dashboard?setup_attempt=${attempt + 1}`;

    return (
      <>
        <meta httpEquiv="refresh" content={`2;url=${nextUrl}`} />
        <div style={{ display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", height: "100vh", gap: "16px", fontFamily: "system-ui, sans-serif" }}>
          <div style={{ width: 32, height: 32, border: "3px solid #e5e7eb", borderTop: "3px solid #111", borderRadius: "50%", animation: "spin 0.8s linear infinite" }} />
          <p style={{ fontSize: 14, color: "#6b7280", margin: 0 }}>Setting up your school portal account…</p>
          <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
        </div>
      </>
    );
  }

  console.log("[dashboard] found user, role:", dbUser.role, "→ redirecting");

  switch (dbUser.role) {
    case "school_admin": return redirect("/school-admin");
    case "canteen_staff": return redirect("/canteen-staff");
    case "parent": return redirect("/parent");
    default:
      console.log("[dashboard] unknown role:", dbUser.role, "— falling through to /");
      return redirect("/");
  }
}
export default async function DashboardRouterPage({
  searchParams,
}: {
  searchParams: Promise<{ setup_attempt?: string }>;
}) {
  return (
    <Suspense fallback={<RouterFallbackSkeleton />}>
      <DashboardRouterWorker searchParams={searchParams} />
    </Suspense>
  );
}