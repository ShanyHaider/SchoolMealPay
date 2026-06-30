import { auth } from "@clerk/nextjs/server";
import { redirect } from "next/navigation";
import { getUserFromDb } from "@/features/users/queries";
import { getParentProSubscription } from "@/db/queries/Subscription";
import { BillingPageShell } from "@/features/billing/BillingPageShell";
import { connection } from "next/server";

export default async function ParentBillingPage() {
    await connection();
    const { userId } = await auth();
    if (!userId) redirect("/sign-in");

    const dbUser = await getUserFromDb(userId);
    if (!dbUser || dbUser.role !== "parent") redirect("/");

    const subscription = await getParentProSubscription(dbUser.id);

    return (
        <BillingPageShell
            subscription={subscription ?? null}
            invoices={[]}
            role="parent"
        />
    );
}