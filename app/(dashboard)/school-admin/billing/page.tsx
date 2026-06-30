import { auth } from "@clerk/nextjs/server";
import { redirect } from "next/navigation";
import { getUserFromDb } from "@/features/users/queries";
import {
    getSchoolSubscription,
    getSubscriptionInvoices,
} from "@/db/queries/Subscription";
import { getSchoolStats } from "@/db/queries/SchoolProfile";
import { BillingPageShell } from "@/features/billing/BillingPageShell";
import { connection } from "next/server";

export default async function SchoolBillingPage() {
    await connection();
    const { userId } = await auth();
    if (!userId) redirect("/sign-in");

    const dbUser = await getUserFromDb(userId);
    if (!dbUser || dbUser.role !== "school_admin") redirect("/");

    const [subscription, invoices, stats] = await Promise.all([
        getSchoolSubscription(),
        getSubscriptionInvoices(),
        getSchoolStats(),
    ]);

    return (
        <BillingPageShell
            subscription={subscription}
            invoices={invoices}
            role="school_admin"
            studentCount={stats.studentCount}
            studentLimit={subscription?.studentLimit ?? 50}
        />
    );
}