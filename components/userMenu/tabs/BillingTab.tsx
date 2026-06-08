
import { auth } from "@clerk/nextjs/server";
import { getUserFromDb } from "@/features/users/queries";
import {
  getSchoolSubscription,
  getSubscriptionInvoices,
  getParentProSubscription,
} from "@/db/queries/Subscription";
import { BillingTab } from "@/features/billing/BillingPageClient";

export async function BillingTabServer() {
  const { userId: clerkId } = await auth();
  if (!clerkId) return null;

  const dbUser = await getUserFromDb(clerkId);
  if (!dbUser) return <BillingTab subscription={null} invoices={[]} role="parent" />;

  if (dbUser.role === "school_admin") {
    const [subscription, invoices] = await Promise.all([
      getSchoolSubscription(),
      getSubscriptionInvoices(),
    ]);
    return <BillingTab subscription={subscription} invoices={invoices} role="school_admin" />;
  }

  // parent / canteen_staff
  const subscription = await getParentProSubscription(dbUser.id);
  return (
    <BillingTab
      subscription={subscription ?? null}
      invoices={[]}
      role="parent"             // 👈
    />
  );
}