// db/queries/SuperAdmin.schools.ts

import { db } from "@/drizzle/db";
import {
    schoolProfileTable,
    schoolSubscriptionTable,
    subscriptionInvoicesTable,
    studentsTable,
    classesTable,
} from "@/drizzle/schema";
import { eq, count, desc } from "drizzle-orm";
import { cacheLife, cacheTag } from "next/cache";
import { getGlobalTag } from "@/lib/cache";
import { assertRole } from "@/lib/guards/serverGuards";

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

export type SchoolPageData = {
    profile: {
        id: string;
        name: string;
        email: string | null;
        phone: string | null;
        city: string | null;
        address: string | null;
        logoUrl: string | null;
        bannerUrl: string | null;
        website: string | null;
        schoolType: string | null;
        timezone: string | null;
        primaryColor: string | null;
        createdAt: Date;
    } | null;
    subscription: {
        id: string;
        tier: string;
        status: string;
        studentLimit: number;
        billingCycle: string | null;
        trialEndsAt: Date | null;
        currentPeriodEnd: Date | null;
        createdAt: Date;
    } | null;
    studentStats: {
        total: number;
        byClass: { className: string; count: number }[];
    };
    invoices: {
        id: string;
        amount: number;
        status: string;
        billingCycle: string | null;
        createdAt: Date;
        paidAt: Date | null;
    }[];
};

// ---------------------------------------------------------------------------
// Query
// ---------------------------------------------------------------------------

export async function getSchoolPageData(adminUserId: string): Promise<SchoolPageData> {
    "use cache";
    cacheLife("minutes");
    cacheTag(
        getGlobalTag("school-profile"),
        getGlobalTag("school-subscription"),
        getGlobalTag("students"),
    );

    await assertRole(["system_admin"], adminUserId);

    const [profile, subscription, studentCountResult, classRows, invoices] =
        await Promise.all([
            // Single school profile row
            db.query.schoolProfileTable.findFirst(),

            // Single subscription row
            db.query.schoolSubscriptionTable.findFirst(),

            // Total student count
            db.select({ total: count() }).from(studentsTable),

            // Per-class student counts via join (classesTable has grade+section, not name)
            db
                .select({
                    id: classesTable.id,
                    grade: classesTable.grade,
                    section: classesTable.section,
                    studentCount: count(studentsTable.id),
                })
                .from(classesTable)
                .leftJoin(studentsTable, eq(studentsTable.classId, classesTable.id))
                .groupBy(classesTable.id, classesTable.grade, classesTable.section),

            // Last 20 invoices
            db.query.subscriptionInvoicesTable.findMany({
                orderBy: [desc(subscriptionInvoicesTable.createdAt)],
                limit: 20,
            }),
        ]);

    const byClass = classRows
        .map((c) => ({
            className: `Grade ${c.grade}${c.section ? ` - ${c.section}` : ""}`,
            count: c.studentCount,
        }))
        .filter((c) => c.count > 0)
        .sort((a, b) => b.count - a.count);

    return {
        profile: profile
            ? {
                id: profile.id,
                name: profile.name,
                email: profile.email ?? null,
                phone: profile.phone ?? null,
                city: profile.city ?? null,
                address: profile.address ?? null,
                logoUrl: profile.logoUrl ?? null,
                bannerUrl: profile.bannerUrl ?? null,
                website: profile.website ?? null,
                schoolType: profile.schoolType ?? null,
                timezone: profile.timezone ?? null,
                primaryColor: profile.primaryColor ?? null,
                createdAt: profile.createdAt,
            }
            : null,

        subscription: subscription
            ? {
                id: subscription.id,
                tier: subscription.tier,
                status: subscription.status,
                studentLimit: subscription.studentLimit,
                billingCycle: subscription.billingCycle ?? null,
                trialEndsAt: subscription.trialEndsAt ?? null,
                currentPeriodEnd: subscription.currentPeriodEnd ?? null,
                createdAt: subscription.createdAt,
            }
            : null,

        studentStats: {
            total: studentCountResult[0]?.total ?? 0,
            byClass,
        },

        invoices: invoices.map((inv) => ({
            id: inv.id,
            amount: parseFloat(inv.amount ?? "0"),
            status: inv.status,
            billingCycle: inv.billingCycle ?? null,
            createdAt: inv.createdAt,
            paidAt: inv.paidAt ?? null,
        })),
    };
}