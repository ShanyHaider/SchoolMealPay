import { db } from "@/drizzle/db";
import {
  studentsTable,
  classesTable,
  canteensTable,
  canteenStaffAssignmentsTable,
  menuItemsTable,
  dailyMenusTable,
  ordersTable,
  orderItemsTable,
  inventoryItemsTable,
  parentChildLinksTable,
  transactionsTable,
  usersTable,
} from "@/drizzle/schema";
import { eq, desc, count, sum, gte, lte, and, sql } from "drizzle-orm";
import { cacheLife, cacheTag } from "next/cache";
import { getAdminTag, getGlobalTag, getCanteenTag, getIdTag } from "@/lib/cache";

// ─── School Profile ────────────────────────────────────────────
export async function getSchoolProfile() {
  "use cache";
  cacheLife("hours");
  cacheTag(getGlobalTag("school-profile"));
  return db.query.schoolProfileTable.findFirst();
}

// ─── Overview Stats ────────────────────────────────────────────
export async function getAdminOverviewStats() {
  "use cache";
  cacheLife("seconds");
  cacheTag(getGlobalTag("orders"), getGlobalTag("students"), getAdminTag("orders"));

  const [studentCount] = await db
    .select({ count: count() })
    .from(studentsTable);

  const [staffCount] = await db
    .select({ count: count() })
    .from(canteenStaffAssignmentsTable);

  const [pendingLinks] = await db
    .select({ count: count() })
    .from(parentChildLinksTable)
    .where(eq(parentChildLinksTable.status, "pending"));

  const [canteenCount] = await db
    .select({ count: count() })
    .from(canteensTable);

  const today = new Date().toISOString().split("T")[0];
  const [todayOrderCount] = await db
    .select({ count: count() })
    .from(ordersTable)
    .where(eq(ordersTable.orderDate, today));

  const startOfMonth = new Date();
  startOfMonth.setDate(1);
  const [monthRevenue] = await db
    .select({ total: sum(transactionsTable.amount) })
    .from(transactionsTable)
    .where(
      and(
        eq(transactionsTable.status, "success"),
        gte(transactionsTable.createdAt, startOfMonth),
      ),
    );

  return {
    studentCount: studentCount.count,
    staffCount: staffCount.count,
    pendingLinks: pendingLinks.count,
    canteenCount: canteenCount.count,
    todayOrderCount: todayOrderCount.count,
    monthRevenue: parseFloat(monthRevenue.total ?? "0"),
  };
}

// ─── Recent Orders (admin view) ────────────────────────────────
export async function getRecentOrdersAdmin(limit = 10) {
  "use cache";
  cacheLife("seconds");
  cacheTag(getGlobalTag("orders"), getAdminTag("orders"));
  return db.query.ordersTable.findMany({
    orderBy: [desc(ordersTable.placedAt)],
    limit,
    with: {
      student: { columns: { name: true, studentCode: true } },
      orderItems: {
        with: { menuItem: { columns: { name: true } } },
        columns: { quantity: true },
      },
    },
  });
}

// ─── Students ──────────────────────────────────────────────────
export async function getAllStudents() {
  "use cache";
  cacheLife("minutes");
  cacheTag(getGlobalTag("students"));
  return db.query.studentsTable.findMany({
    orderBy: [desc(studentsTable.createdAt)],
    with: {
      class: { columns: { grade: true, section: true } },
      allergens: true,
      childProfile: {
        columns: { dailySpendingLimit: true },
      },
      parentLinks: {
        with: {
          parent: { columns: { name: true, email: true } },
        },
      },
    },
  });
}

export async function getStudentById(id: string) {
  "use cache";
  cacheLife("minutes");
  cacheTag(getGlobalTag("students"), getIdTag("students", id));
  return db.query.studentsTable.findFirst({
    where: eq(studentsTable.id, id),
    with: {
      class: true,
      allergens: true,
      childProfile: true,
      parentLinks: {
        with: {
          parent: { columns: { name: true, email: true, phone: true } },
        },
      },
    },
  });
}

export async function getPendingParentLinks() {
  "use cache";
  cacheLife("seconds");
  cacheTag(getGlobalTag("parent-child-links"));
  return db.query.parentChildLinksTable.findMany({
    where: eq(parentChildLinksTable.status, "pending"),
    orderBy: [desc(parentChildLinksTable.linkedAt)],
    with: {
      parent: { columns: { name: true, email: true, phone: true } },
      student: { columns: { name: true, studentCode: true } },
    },
  });
}

// ─── Classes ───────────────────────────────────────────────────
export async function getAllClasses() {
  "use cache";
  cacheLife("minutes");
  cacheTag(getGlobalTag("classes"), getGlobalTag("students"));

  const classes = await db.query.classesTable.findMany({
    orderBy: [classesTable.grade, classesTable.section],
  });
  const counts = await db
    .select({ classId: studentsTable.classId, count: count() })
    .from(studentsTable)
    .groupBy(studentsTable.classId);

  const countMap = Object.fromEntries(
    counts.map((c) => [c.classId, c.count]),
  );
  return classes.map((cls) => ({
    ...cls,
    studentCount: countMap[cls.id] ?? 0,
  }));
}

// ─── Canteens ──────────────────────────────────────────────────
export async function getAllCanteens() {
  "use cache";
  cacheLife("hours");
  cacheTag(getGlobalTag("canteens"));
  return db.query.canteensTable.findMany({
    orderBy: [desc(canteensTable.createdAt)],
    with: {
      staffAssignments: {
        with: { staff: { columns: { name: true, email: true } } },
      },
    },
  });
}

// ─── Staff ─────────────────────────────────────────────────────
// db/queries/Admin.ts — replace the existing getAllStaff function


export async function getAllStaff() {
  "use cache";
  cacheLife("hours");
  cacheTag(getGlobalTag("users"), getGlobalTag("canteen-staff-assignments"));

  const rows = await db.query.usersTable.findMany({
    where: eq(usersTable.role, "canteen_staff"),
    orderBy: [desc(usersTable.createdAt)],
    with: {
      canteenStaffAssignment: {
        with: {
          canteen: { columns: { id: true, name: true } },
        },
      },
    },
  });

  // Map isActive → status so the UI doesn't need to know the column name
  return rows.map((u) => ({
    ...u,
    status: u.isActive ? ("active" as const) : ("disabled" as const),
  }));
}

// ─── Menu Items ────────────────────────────────────────────────
export async function getAllMenuItems() {
  "use cache";
  cacheLife("minutes");
  cacheTag(getGlobalTag("menu-items"));
  return db.query.menuItemsTable.findMany({
    orderBy: [menuItemsTable.category, menuItemsTable.name],
  });
}

export async function getDailyMenusByWeek(
  startDate: string,
  endDate: string,
  canteenId: string,
) {
  "use cache";
  cacheLife("minutes");
  cacheTag(getGlobalTag("daily-menus"), getCanteenTag("daily-menus", canteenId));
  return db.query.dailyMenusTable.findMany({
    where: and(
      eq(dailyMenusTable.canteenId, canteenId),
      gte(dailyMenusTable.menuDate, startDate),
      lte(dailyMenusTable.menuDate, endDate),
    ),
    with: {
      menuItem: {
        columns: { name: true, price: true, category: true },
      },
    },
    orderBy: [dailyMenusTable.menuDate, dailyMenusTable.mealSlot],
  });
}

// ─── Inventory ─────────────────────────────────────────────────
export async function getInventoryByCanteen(canteenId: string) {
  "use cache";
  cacheLife("minutes");
  cacheTag(getGlobalTag("inventory-items"), getCanteenTag("inventory-items", canteenId));
  return db.query.inventoryItemsTable.findMany({
    where: eq(inventoryItemsTable.canteenId, canteenId),
    orderBy: [inventoryItemsTable.name],
  });
}

// ─── Reports ───────────────────────────────────────────────────
export async function getSalesReport(startDate: string, endDate: string) {
  "use cache";
  cacheLife("minutes");
  cacheTag(getGlobalTag("orders"));

  const daily = await db
    .select({
      date: ordersTable.orderDate,
      revenue: sum(transactionsTable.amount),
      orderCount: count(ordersTable.id),
    })
    .from(ordersTable)
    .leftJoin(
      transactionsTable,
      eq(transactionsTable.orderId, ordersTable.id),
    )
    .where(
      and(
        gte(ordersTable.orderDate, startDate),
        lte(ordersTable.orderDate, endDate),
        eq(transactionsTable.status, "success"),
      ),
    )
    .groupBy(ordersTable.orderDate)
    .orderBy(ordersTable.orderDate);

  const topItems = await db
    .select({
      name: menuItemsTable.name,
      totalSold: sum(orderItemsTable.quantity),
      revenue: sql<string>`sum(${orderItemsTable.quantity} * ${orderItemsTable.unitPrice})`,
    })
    .from(orderItemsTable)
    .leftJoin(
      menuItemsTable,
      eq(menuItemsTable.id, orderItemsTable.menuItemId),
    )
    .leftJoin(ordersTable, eq(ordersTable.id, orderItemsTable.orderId))
    .where(
      and(
        gte(ordersTable.orderDate, startDate),
        lte(ordersTable.orderDate, endDate),
      ),
    )
    .groupBy(menuItemsTable.name)
    .orderBy(desc(sql`sum(${orderItemsTable.quantity})`))
    .limit(10);

  const statusBreakdown = await db
    .select({ status: ordersTable.status, count: count() })
    .from(ordersTable)
    .where(
      and(
        gte(ordersTable.orderDate, startDate),
        lte(ordersTable.orderDate, endDate),
      ),
    )
    .groupBy(ordersTable.status);

  return { daily, topItems, statusBreakdown };
}
