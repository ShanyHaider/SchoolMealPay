// app/dashboard/page.tsx
import { auth } from "@clerk/nextjs/server";
import { redirect } from "next/navigation";
import { getUserFromDb } from "@/features/users/db";

export const dynamic = "force-dynamic";

export default async function DashboardRouterPage() {
  const { userId } = await auth();
  if (!userId) redirect("/sign-in");

  const dbUser = await getUserFromDb(userId);

  if (!dbUser) {
    // Webhook hasn't fired yet — auto-refresh every 2s until it does.
    // This handles the race between Clerk auth completing and the
    // user.created webhook reaching your DB.
    return (
      <>
        <meta httpEquiv="refresh" content="2" />
        <div
          style={{
            display: "flex",
            flexDirection: "column",
            alignItems: "center",
            justifyContent: "center",
            height: "100vh",
            gap: "16px",
            fontFamily: "system-ui, sans-serif",
          }}
        >
          <div
            style={{
              width: 32,
              height: 32,
              border: "3px solid #e5e7eb",
              borderTop: "3px solid #111",
              borderRadius: "50%",
              animation: "spin 0.8s linear infinite",
            }}
          />
          <p style={{ fontSize: 14, color: "#6b7280", margin: 0 }}>
            Setting up your account…
          </p>
          <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
        </div>
      </>
    );
  }

  switch (dbUser.role) {
    case "school_admin":
      redirect("/school-admin");
    case "canteen_staff":
      redirect("/canteen-staff");
    case "parent":
      redirect("/parent");
    default:
      redirect("/");
  }
}
