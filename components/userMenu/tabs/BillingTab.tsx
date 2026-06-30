import { auth } from "@clerk/nextjs/server";
import { getUserFromDb } from "@/features/users/queries";
import {
  getSchoolSubscription,
  getParentProSubscription,
} from "@/db/queries/Subscription";
import { getSchoolStats } from "@/db/queries/SchoolProfile";
import { BillingTabClient } from "@/features/billing/BillingPageClient";
import { subscriptionTiers } from "@/data/subscriptionTiers";

const BILLING_HREF: Record<string, string> = {
  school_admin: "/school-admin/billing",
  parent: "/parent/billing",
  canteen_staff: "/parent/billing",
};

export async function BillingTabServer() {
  const { userId: clerkId } = await auth();
  if (!clerkId) return null;

  const dbUser = await getUserFromDb(clerkId);
  if (!dbUser) return null;

  const billingHref = BILLING_HREF[dbUser.role] ?? "/parent/billing";
  const role = dbUser.role as "school_admin" | "parent" | "canteen_staff";

  if (dbUser.role === "school_admin") {
    const [subscription, stats] = await Promise.all([
      getSchoolSubscription(),
      getSchoolStats(),
    ]);
    const studentLimit = subscription?.tier === "premium_school"
      ? Number.MAX_SAFE_INTEGER
      : subscriptionTiers.SchoolFree.maxStudents;

    return (
      <BillingTabClient
        subscription={subscription}
        role={role}
        billingHref={billingHref}
        studentCount={stats.studentCount}
        studentLimit={studentLimit}
      />
    );
  }

  const subscription = await getParentProSubscription(dbUser.id);
  return (
    <BillingTabClient
      subscription={subscription ?? null}
      role={role}
      billingHref={billingHref}
    />
  );
}