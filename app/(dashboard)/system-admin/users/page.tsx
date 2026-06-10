// app/(dashboard)/system-admin/users/page.tsx

import { auth } from "@clerk/nextjs/server";
import { redirect } from "next/navigation";

import { getUserFromDb } from "@/features/users/queries";
import { getGlobalUsersPaginated } from "@/db/queries/SystemAdminUsers";
import { UsersPageClient } from "./_components/UsersPageClient";

interface UsersPageProps {
    searchParams: Promise<{
        search?: string;
        role?: string;
        status?: string;
        page?: string;
    }>;
}

export default async function UsersPage({ searchParams }: UsersPageProps) {
    const { userId } = await auth();
    if (!userId) redirect("/sign-in");

    const dbUser = await getUserFromDb(userId);
    if (!dbUser || dbUser.role !== "system_admin") redirect("/");

    const params = await searchParams;

    const page = Math.max(1, parseInt(params.page ?? "1", 10) || 1);
    const role = (params.role ?? "all") as
        | "system_admin"
        | "school_admin"
        | "canteen_staff"
        | "parent"
        | "all";
    const status = (params.status ?? "all") as "active" | "blocked" | "all";
    const search = params.search ?? "";

    const data = await getGlobalUsersPaginated(userId, {
        search,
        role,
        status,
        page,
        pageSize: 20,
    });

    return (
        <UsersPageClient
            initialData={data}
            initialFilters={{ search, role, status, page }}
            currentAdminUserId={dbUser.id}
        />
    );
}