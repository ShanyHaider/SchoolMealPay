import { db } from "@/drizzle/db";
import { transactionsTable, ordersTable } from "@/drizzle/schema";
import { eq, desc, and, gte, sum } from "drizzle-orm";
import { cacheLife, cacheTag } from "next/cache";
import { getGlobalTag, getUserTag, getStudentTag } from "@/lib/cache";

/**
 * All transactions for a parent. Used on the spending/billing history page.
 */
export async function getTransactionsByParent(parentId: string) {
  "use cache";
  cacheLife("seconds");
  cacheTag(getGlobalTag("transactions"), getUserTag("transactions", parentId));
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
}

/**
 * Monthly spending summary for a parent.
 * Returns total spent per month for the last N months.
 */
export async function getMonthlySpendingByParent(parentId: string, months = 6) {
  "use cache";
  cacheLife("minutes");
  cacheTag(getGlobalTag("transactions"), getUserTag("transactions", parentId));
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
}

/**
 * Spending summary for a student (total spent this month).
 * Used on child profile cards to show vs. daily/weekly limits.
 */
export async function getStudentSpendingThisMonth(studentId: string) {
  "use cache";
  cacheLife("seconds");
  // Expire when transactions or student orders update
  cacheTag(getGlobalTag("transactions"), getGlobalTag("orders"), getStudentTag("orders", studentId));
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
}
