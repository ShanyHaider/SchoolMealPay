import { auth } from "@clerk/nextjs/server";
import { redirect } from "next/navigation";
import { db } from "@/drizzle/db";
import { eq } from "drizzle-orm";
import { usersTable, parentChildLinksTable, studentsTable } from "@/drizzle/schema";
import {
    getWalletBalance,
    getWalletTransactions,
    getPerStudentSpending,
    getWalletStats,
} from "@/db/queries/Wallets";
import { WalletClient } from "./_components/WalletClient";

interface PageProps {
    searchParams: Promise<{ status?: string }>;
}

export default async function WalletPage({ searchParams }: PageProps) {
    const { userId: clerkId } = await auth();
    if (!clerkId) redirect("/sign-in");

    const { status } = await searchParams;

    const user = await db.query.usersTable.findFirst({
        where: eq(usersTable.clerkId, clerkId),
    });
    if (!user) redirect("/sign-in");

    // Fetch all wallet data in parallel
    const [balance, transactions, studentSpending, stats] = await Promise.all([
        getWalletBalance(user.id),
        getWalletTransactions(user.id, 50),
        getPerStudentSpending(user.id),
        getWalletStats(user.id),
    ]);

    return (
        <WalletClient
            parentId={user.id}
            balance={balance}
            transactions={transactions}
            studentSpending={studentSpending}
            stats={stats}
            redirectStatus={status ?? null}
        />
    );
}