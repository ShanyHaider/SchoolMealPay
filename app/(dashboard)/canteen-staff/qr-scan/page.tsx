import { auth } from "@clerk/nextjs/server";
import { redirect } from "next/navigation";
import { getStaffCanteen, getTodayOrders } from "@/db/queries/Staff";
import { QrScannerClient } from "./_components/QrScannerClient";
import { getUserFromDb } from "@/features/users/queries";
import { TODAY } from "../../../../types/canteenMenuTypes";

export default async function QrScanPage() {
  const { userId } = await auth();
  if (!userId) redirect("/sign-in");
  const dbUser = await getUserFromDb(userId);
  if (!dbUser) redirect("/sign-in");

  const canteen = await getStaffCanteen(dbUser.id);
  if (!canteen) redirect("/canteen-staff");

  const orders = await getTodayOrders(canteen.id, TODAY);

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      <div>
        <h1
          className="text-2xl font-bold tracking-tight"
          style={{ color: "var(--text-primary)" }}
        >
          QR Pickup & Feed
        </h1>
        <p className="text-sm mt-1" style={{ color: "var(--text-secondary)" }}>
          Scan a student&apos;s QR code or select from the live feed of ready orders below.
        </p>
      </div>

      <QrScannerClient canteenId={canteen.id} initialOrders={orders} />
    </div>
  );
}
