// app/(dashboard)/school-admin/profile/page.tsx

import { auth } from "@clerk/nextjs/server";
import { redirect } from "next/navigation";
import { getUserFromDb } from "@/features/users/queries";
import { getSchoolProfile, getSchoolStats } from "@/db/queries/SchoolProfile";
import { getSchoolSubscription } from "@/db/queries/Subscription";
import { SchoolProfileClient } from "./_components/ProfileClient";

export default async function SchoolProfilePage() {
    const { userId } = await auth();
    if (!userId) redirect("/sign-in");

    const dbUser = await getUserFromDb(userId);
    if (!dbUser || dbUser.role !== "school_admin") redirect("/");

    const [school, stats, subscription] = await Promise.all([
        getSchoolProfile(),
        getSchoolStats(),
        getSchoolSubscription(),
    ]);

    return (
        <SchoolProfileClient
            school={school}
            stats={stats}
            studentLimit={subscription?.studentLimit ?? 50}
            tier={subscription?.tier ?? "free"}
        />
    );
}