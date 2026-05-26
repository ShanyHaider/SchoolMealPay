import { db } from "@/drizzle/db";
import { transactionsTable, ordersTable } from "@/drizzle/schema";
import { eq, desc, and, gte, lte, sum, count } from "drizzle-orm";
import { unstable_cache } from "next/cache";
import { getGlobalTag, getUserTag } from "@/lib/cache";

/**
 * All transactions for a parent. Used on the spending/billing history page.
 */
export const getTransactionsByParent = unstable_cache(
  async (parentId: string) => {
    return db.query.transactionsTable.findMany({
      where: eq(transactionsTable.parentId, parentId),
      orderBy: [desc(transactionsTable.createdAt)],
      with: {
        order: {
          columns: { id: true, orderDate: true, totalAmount: true },
          with: {
            student: { columns: { name: true } },
          },
        },
      },
    });
  },
  ["transactions-by-parent"],
  { tags: [getGlobalTag("transactions")] },
);

/**
 * Monthly spending summary for a parent.
 * Returns total spent per month for the last N months.
 */
export const getMonthlySpendingByParent = unstable_cache(
  async (parentId: string, months = 6) => {
    const since = new Date();
    since.setMonth(since.getMonth() - months);

    const rows = await db
      .select({
        amount: transactionsTable.amount,
        createdAt: transactionsTable.createdAt,
      })
      .from(transactionsTable)
      .where(
        and(
          eq(transactionsTable.parentId, parentId),
          eq(transactionsTable.status, "success"),
          gte(transactionsTable.createdAt, since),
        ),
      )
      .orderBy(transactionsTable.createdAt);

    // Group by month in JS (avoids DB-specific date_trunc syntax)
    const byMonth: Record<string, number> = {};
    for (const row of rows) {
      const key = row.createdAt.toISOString().slice(0, 7); // "YYYY-MM"
      byMonth[key] = (byMonth[key] ?? 0) + parseFloat(row.amount);
    }

    return Object.entries(byMonth).map(([month, total]) => ({ month, total }));
  },
  ["monthly-spending-by-parent"],
  { tags: [getGlobalTag("transactions")] },
);

/**
 * Spending summary for a student (total spent this month).
 * Used on child profile cards to show vs. daily/weekly limits.
 */
export const getStudentSpendingThisMonth = unstable_cache(
  async (studentId: string) => {
    const startOfMonth = new Date();
    startOfMonth.setDate(1);
    startOfMonth.setHours(0, 0, 0, 0);

    const [result] = await db
      .select({ total: sum(transactionsTable.amount) })
      .from(transactionsTable)
      .innerJoin(ordersTable, eq(ordersTable.id, transactionsTable.orderId))
      .where(
        and(
          eq(ordersTable.studentId, studentId),
          eq(transactionsTable.status, "success"),
          gte(transactionsTable.createdAt, startOfMonth),
        ),
      );

    return parseFloat(result?.total ?? "0");
  },
  ["student-spending-this-month"],
  { tags: [getGlobalTag("transactions")] },
);
