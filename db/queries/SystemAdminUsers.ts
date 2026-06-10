import { db } from "@/drizzle/db";
import { usersTable } from "@/drizzle/schema";
import { eq, ilike, or, and, desc, count } from "drizzle-orm";
import { cacheLife, cacheTag } from "next/cache";
import { getGlobalTag } from "@/lib/cache";
import { assertRole } from "@/lib/guards/serverGuards";

export type UserFilters = {
    search?: string;
    role?: "system_admin" | "school_admin" | "canteen_staff" | "parent" | "all";
    status?: "active" | "blocked" | "all";
    page?: number;
    pageSize?: number;
};

export type PaginatedUsers = {
    users: {
        id: string;
        name: string;
        email: string;
        role: string;
        isActive: boolean;
        createdAt: Date;
        phone: string | null;
        imageUrl: string | null;
    }[];
    total: number;
    page: number;
    pageSize: number;
    totalPages: number;
};

export async function getGlobalUsersPaginated(
    adminUserId: string,
    filters: UserFilters = {},
): Promise<PaginatedUsers> {
    "use cache";
    cacheLife("minutes");
    cacheTag(getGlobalTag("users"));

    await assertRole(["system_admin"], adminUserId);

    const { search, role, status, page = 1, pageSize = 20 } = filters;

    // Build where conditions
    const conditions = [];

    if (search?.trim()) {
        conditions.push(
            or(
                ilike(usersTable.name, `%${search.trim()}%`),
                ilike(usersTable.email, `%${search.trim()}%`),
            ),
        );
    }

    if (role && role !== "all") {
        conditions.push(eq(usersTable.role, role));
    }

    if (status && status !== "all") {
        conditions.push(eq(usersTable.isActive, status === "active"));
    }

    const where = conditions.length > 0 ? and(...conditions) : undefined;

    const offset = (page - 1) * pageSize;

    const [rows, [{ total }]] = await Promise.all([
        db.query.usersTable.findMany({
            where,
            orderBy: [desc(usersTable.createdAt)],
            limit: pageSize,
            offset,
            columns: {
                id: true,
                name: true,
                email: true,
                role: true,
                isActive: true,
                createdAt: true,
                phone: true,
                imageUrl: true,
            },
        }),
        db.select({ total: count() }).from(usersTable).where(where),
    ]);

    return {
        users: rows,
        total,
        page,
        pageSize,
        totalPages: Math.ceil(total / pageSize),
    };
}