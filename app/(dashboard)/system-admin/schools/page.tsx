// app/(dashboard)/system-admin/schools/page.tsx

import { auth } from "@clerk/nextjs/server";
import { redirect } from "next/navigation";

import { getUserFromDb } from "@/features/users/queries";
import { getSchoolPageData } from "@/db/queries/SystemAdminSchools";
import { getSchoolSubscriptionData } from "@/db/queries/SuperAdmin";
import { SchoolsPageClient } from "./_components/SchoolsPageClient";

export default async function SchoolsPage() {
    const { userId } = await auth();
    if (!userId) redirect("/sign-in");

    const dbUser = await getUserFromDb(userId);
    if (!dbUser || dbUser.role !== "system_admin") redirect("/");

    const [schoolData, subscriptionData] = await Promise.all([
        getSchoolPageData(userId),
        getSchoolSubscriptionData(userId),
    ]);

    return (
        <SchoolsPageClient
            schoolData={schoolData}
            subscriptionData={subscriptionData}
            currentAdminUserId={dbUser.id}
        />
    );
}