// import { db } from "@/drizzle/db";
// import {
//   studentsTable,
//   usersTable,
//   classesTable,
//   canteensTable,
//   canteenStaffAssignmentsTable,
//   menuItemsTable,
//   dailyMenusTable,
//   ordersTable,
//   orderItemsTable,
//   inventoryItemsTable,
//   parentChildLinksTable,
//   transactionsTable,
//   schoolProfileTable,
// } from "@/drizzle/schema";
// import { eq, desc, count, sum, gte, lte, and, sql } from "drizzle-orm";
// import { unstable_cache } from "next/cache";
// import { getAdminTag, getGlobalTag, getCanteenTag } from "@/lib/cache";

// // ─── School Profile ────────────────────────────────────────────
// export function getSchoolProfile() {
//   return unstable_cache(
//     () => db.query.schoolProfileTable.findFirst(),
//     [getGlobalTag("school-profile")],
//     { tags: [getGlobalTag("school-profile")] },
//   )();
// }

// // ─── Overview Stats ────────────────────────────────────────────
// export function getAdminOverviewStats() {
//   return unstable_cache(
//     async () => {
//       const [studentCount] = await db
//         .select({ count: count() })
//         .from(studentsTable);

//       const [staffCount] = await db
//         .select({ count: count() })
//         .from(canteenStaffAssignmentsTable);

//       const [pendingLinks] = await db
//         .select({ count: count() })
//         .from(parentChildLinksTable)
//         .where(eq(parentChildLinksTable.status, "pending"));

//       const [canteenCount] = await db
//         .select({ count: count() })
//         .from(canteensTable);

//       const today = new Date().toISOString().split("T")[0];
//       const [todayOrderCount] = await db
//         .select({ count: count() })
//         .from(ordersTable)
//         .where(eq(ordersTable.orderDate, today));

//       const startOfMonth = new Date();
//       startOfMonth.setDate(1);
//       const [monthRevenue] = await db
//         .select({ total: sum(transactionsTable.amount) })
//         .from(transactionsTable)
//         .where(
//           and(
//             eq(transactionsTable.status, "success"),
//             gte(transactionsTable.createdAt, startOfMonth),
//           ),
//         );

//       return {
//         studentCount: studentCount.count,
//         staffCount: staffCount.count,
//         pendingLinks: pendingLinks.count,
//         canteenCount: canteenCount.count,
//         todayOrderCount: todayOrderCount.count,
//         monthRevenue: parseFloat(monthRevenue.total ?? "0"),
//       };
//     },
//     [getAdminTag("orders")],
//     {
//       tags: [getGlobalTag("orders"), getGlobalTag("students")],
//       revalidate: 60,
//     },
//   )();
// }

// // ─── Recent Orders (admin view) ────────────────────────────────
// export function getRecentOrdersAdmin(limit = 10) {
//   return unstable_cache(
//     () =>
//       db.query.ordersTable.findMany({
//         orderBy: [desc(ordersTable.placedAt)],
//         limit,
//         with: {
//           student: { columns: { name: true, studentCode: true } },
//           orderItems: {
//             with: { menuItem: { columns: { name: true } } },
//             columns: { quantity: true },
//           },
//         },
//       }),
//     [getAdminTag("orders")],
//     { tags: [getGlobalTag("orders")], revalidate: 30 },
//   )();
// }

// // ─── Students ──────────────────────────────────────────────────
// export function getAllStudents() {
//   return unstable_cache(
//     () =>
//       db.query.studentsTable.findMany({
//         orderBy: [desc(studentsTable.createdAt)],
//         with: {
//           class: { columns: { grade: true, section: true } },
//           allergens: true,
//           childProfile: {
//             columns: { dailySpendingLimit: true, orderingEnabled: true },
//           },
//           parentLinks: {
//             where: eq(parentChildLinksTable.status, "approved"),
//             with: { parent: { columns: { name: true, email: true } } },
//           },
//         },
//       }),
//     [getGlobalTag("students")],
//     { tags: [getGlobalTag("students")] },
//   )();
// }

// export function getStudentById(id: string) {
//   return unstable_cache(
//     () =>
//       db.query.studentsTable.findFirst({
//         where: eq(studentsTable.id, id),
//         with: {
//           class: true,
//           allergens: true,
//           childProfile: true,
//           parentLinks: {
//             with: {
//               parent: { columns: { name: true, email: true, phone: true } },
//             },
//           },
//         },
//       }),
//     [getGlobalTag("students"), id],
//     { tags: [getGlobalTag("students")] },
//   )();
// }

// export function getPendingParentLinks() {
//   return unstable_cache(
//     () =>
//       db.query.parentChildLinksTable.findMany({
//         where: eq(parentChildLinksTable.status, "pending"),
//         orderBy: [desc(parentChildLinksTable.linkedAt)],
//         with: {
//           parent: { columns: { name: true, email: true, phone: true } },
//           student: { columns: { name: true, studentCode: true } },
//         },
//       }),
//     [getGlobalTag("parent-child-links")],
//     { tags: [getGlobalTag("parent-child-links")] },
//   )();
// }

// // ─── Classes ───────────────────────────────────────────────────
// export function getAllClasses() {
//   return unstable_cache(
//     async () => {
//       const classes = await db.query.classesTable.findMany({
//         orderBy: [classesTable.grade, classesTable.section],
//       });
//       const counts = await db
//         .select({ classId: studentsTable.classId, count: count() })
//         .from(studentsTable)
//         .groupBy(studentsTable.classId);

//       const countMap = Object.fromEntries(
//         counts.map((c) => [c.classId, c.count]),
//       );
//       return classes.map((cls) => ({
//         ...cls,
//         studentCount: countMap[cls.id] ?? 0,
//       }));
//     },
//     [getGlobalTag("classes")],
//     { tags: [getGlobalTag("classes"), getGlobalTag("students")] },
//   )();
// }

// // ─── Canteens ──────────────────────────────────────────────────
// export function getAllCanteens() {
//   return unstable_cache(
//     () =>
//       db.query.canteensTable.findMany({
//         orderBy: [desc(canteensTable.createdAt)],
//         with: {
//           staffAssignments: {
//             with: { staff: { columns: { name: true, email: true } } },
//           },
//         },
//       }),
//     [getGlobalTag("canteens")],
//     { tags: [getGlobalTag("canteens")] },
//   )();
// }

// // ─── Staff ─────────────────────────────────────────────────────
// export function getAllStaff() {
//   return unstable_cache(
//     () =>
//       db.query.usersTable.findMany({
//         where: eq(usersTable.role, "canteen_staff"),
//         orderBy: [desc(usersTable.createdAt)],
//         with: {
//           canteenStaffAssignment: {
//             with: { canteen: { columns: { name: true } } },
//           },
//         },
//       }),
//     [getGlobalTag("users")],
//     { tags: [getGlobalTag("users")] },
//   )();
// }

// // ─── Menu Items ────────────────────────────────────────────────
// export function getAllMenuItems() {
//   return unstable_cache(
//     () =>
//       db.query.menuItemsTable.findMany({
//         orderBy: [menuItemsTable.category, menuItemsTable.name],
//       }),
//     [getGlobalTag("menu-items")],
//     { tags: [getGlobalTag("menu-items")] },
//   )();
// }

// export function getDailyMenusByWeek(
//   startDate: string,
//   endDate: string,
//   canteenId: string,
// ) {
//   return unstable_cache(
//     () =>
//       db.query.dailyMenusTable.findMany({
//         where: and(
//           eq(dailyMenusTable.canteenId, canteenId),
//           gte(dailyMenusTable.menuDate, startDate),
//           lte(dailyMenusTable.menuDate, endDate),
//         ),
//         with: {
//           menuItem: {
//             // price not basePrice; no isAvailable on dailyMenusTable
//             columns: { name: true, price: true, category: true },
//           },
//         },
//         orderBy: [dailyMenusTable.menuDate, dailyMenusTable.mealSlot],
//       }),
//     [getCanteenTag("daily-menus", canteenId), startDate, endDate],
//     {
//       tags: [
//         getGlobalTag("daily-menus"),
//         getCanteenTag("daily-menus", canteenId),
//       ],
//     },
//   )();
// }

// // ─── Inventory ─────────────────────────────────────────────────
// export function getInventoryByCanteen(canteenId: string) {
//   return unstable_cache(
//     () =>
//       db.query.inventoryItemsTable.findMany({
//         where: eq(inventoryItemsTable.canteenId, canteenId),
//         orderBy: [inventoryItemsTable.name],
//       }),
//     [getCanteenTag("inventory-items", canteenId)],
//     {
//       tags: [
//         getGlobalTag("inventory-items"),
//         getCanteenTag("inventory-items", canteenId),
//       ],
//     },
//   )();
// }

// // ─── Reports ───────────────────────────────────────────────────
// export function getSalesReport(startDate: string, endDate: string) {
//   return unstable_cache(
//     async () => {
//       const daily = await db
//         .select({
//           date: ordersTable.orderDate,
//           revenue: sum(transactionsTable.amount),
//           orderCount: count(ordersTable.id),
//         })
//         .from(ordersTable)
//         .leftJoin(
//           transactionsTable,
//           eq(transactionsTable.orderId, ordersTable.id),
//         )
//         .where(
//           and(
//             gte(ordersTable.orderDate, startDate),
//             lte(ordersTable.orderDate, endDate),
//             eq(transactionsTable.status, "success"),
//           ),
//         )
//         .groupBy(ordersTable.orderDate)
//         .orderBy(ordersTable.orderDate);

//       const topItems = await db
//         .select({
//           name: menuItemsTable.name,
//           totalSold: sum(orderItemsTable.quantity),
//           revenue: sql<string>`sum(${orderItemsTable.quantity} * ${orderItemsTable.unitPrice})`,
//         })
//         .from(orderItemsTable)
//         .leftJoin(
//           menuItemsTable,
//           eq(menuItemsTable.id, orderItemsTable.menuItemId),
//         )
//         .leftJoin(ordersTable, eq(ordersTable.id, orderItemsTable.orderId))
//         .where(
//           and(
//             gte(ordersTable.orderDate, startDate),
//             lte(ordersTable.orderDate, endDate),
//           ),
//         )
//         .groupBy(menuItemsTable.name)
//         .orderBy(desc(sql`sum(${orderItemsTable.quantity})`))
//         .limit(10);

//       const statusBreakdown = await db
//         .select({ status: ordersTable.status, count: count() })
//         .from(ordersTable)
//         .where(
//           and(
//             gte(ordersTable.orderDate, startDate),
//             lte(ordersTable.orderDate, endDate),
//           ),
//         )
//         .groupBy(ordersTable.status);

//       return { daily, topItems, statusBreakdown };
//     },
//     [getAdminTag("orders"), startDate, endDate],
//     { tags: [getGlobalTag("orders")], revalidate: 300 },
//   )();
// }

import { db } from "@/drizzle/db";
import {
  studentsTable,
  usersTable,
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
  schoolProfileTable,
} from "@/drizzle/schema";
import { eq, desc, count, sum, gte, lte, and, sql } from "drizzle-orm";
import { unstable_cache } from "next/cache";
import { getAdminTag, getGlobalTag, getCanteenTag } from "@/lib/cache";

// ─── School Profile ────────────────────────────────────────────
export function getSchoolProfile() {
  return unstable_cache(
    () => db.query.schoolProfileTable.findFirst(),
    [getGlobalTag("school-profile")],
    { tags: [getGlobalTag("school-profile")] },
  )();
}

// ─── Overview Stats ────────────────────────────────────────────
export function getAdminOverviewStats() {
  return unstable_cache(
    async () => {
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
    },
    [getAdminTag("orders")],
    {
      tags: [getGlobalTag("orders"), getGlobalTag("students")],
      revalidate: 60,
    },
  )();
}

// ─── Recent Orders (admin view) ────────────────────────────────
export function getRecentOrdersAdmin(limit = 10) {
  return unstable_cache(
    () =>
      db.query.ordersTable.findMany({
        orderBy: [desc(ordersTable.placedAt)],
        limit,
        with: {
          student: { columns: { name: true, studentCode: true } },
          orderItems: {
            with: { menuItem: { columns: { name: true } } },
            columns: { quantity: true },
          },
        },
      }),
    [getAdminTag("orders")],
    { tags: [getGlobalTag("orders")], revalidate: 30 },
  )();
}

// ─── Students ──────────────────────────────────────────────────
export function getAllStudents() {
  return unstable_cache(
    () =>
      db.query.studentsTable.findMany({
        orderBy: [desc(studentsTable.createdAt)],
        with: {
          class: { columns: { grade: true, section: true } },
          allergens: true,
          // FIX: orderingEnabled lives on studentsTable, not childProfilesTable
          // Only request columns that actually exist on child_profiles
          childProfile: {
            columns: { dailySpendingLimit: true },
          },
          parentLinks: {
            with: {
              parent: { columns: { name: true, email: true } },
            },
          },
        },
      }),
    [getGlobalTag("students")],
    { tags: [getGlobalTag("students")] },
  )();
}

export function getStudentById(id: string) {
  return unstable_cache(
    () =>
      db.query.studentsTable.findFirst({
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
      }),
    [getGlobalTag("students"), id],
    { tags: [getGlobalTag("students")] },
  )();
}

export function getPendingParentLinks() {
  return unstable_cache(
    () =>
      db.query.parentChildLinksTable.findMany({
        where: eq(parentChildLinksTable.status, "pending"),
        orderBy: [desc(parentChildLinksTable.linkedAt)],
        with: {
          parent: { columns: { name: true, email: true, phone: true } },
          student: { columns: { name: true, studentCode: true } },
        },
      }),
    [getGlobalTag("parent-child-links")],
    { tags: [getGlobalTag("parent-child-links")] },
  )();
}

// ─── Classes ───────────────────────────────────────────────────
export function getAllClasses() {
  return unstable_cache(
    async () => {
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
    },
    [getGlobalTag("classes")],
    { tags: [getGlobalTag("classes"), getGlobalTag("students")] },
  )();
}

// ─── Canteens ──────────────────────────────────────────────────
export function getAllCanteens() {
  return unstable_cache(
    () =>
      db.query.canteensTable.findMany({
        orderBy: [desc(canteensTable.createdAt)],
        with: {
          staffAssignments: {
            with: { staff: { columns: { name: true, email: true } } },
          },
        },
      }),
    [getGlobalTag("canteens")],
    { tags: [getGlobalTag("canteens")] },
  )();
}

// ─── Staff ─────────────────────────────────────────────────────
export function getAllStaff() {
  return unstable_cache(
    () =>
      db.query.usersTable.findMany({
        where: eq(usersTable.role, "canteen_staff"),
        orderBy: [desc(usersTable.createdAt)],
        with: {
          canteenStaffAssignment: {
            with: { canteen: { columns: { name: true } } },
          },
        },
      }),
    [getGlobalTag("users")],
    { tags: [getGlobalTag("users")] },
  )();
}

// ─── Menu Items ────────────────────────────────────────────────
export function getAllMenuItems() {
  return unstable_cache(
    () =>
      db.query.menuItemsTable.findMany({
        orderBy: [menuItemsTable.category, menuItemsTable.name],
      }),
    [getGlobalTag("menu-items")],
    { tags: [getGlobalTag("menu-items")] },
  )();
}

export function getDailyMenusByWeek(
  startDate: string,
  endDate: string,
  canteenId: string,
) {
  return unstable_cache(
    () =>
      db.query.dailyMenusTable.findMany({
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
      }),
    [getCanteenTag("daily-menus", canteenId), startDate, endDate],
    {
      tags: [
        getGlobalTag("daily-menus"),
        getCanteenTag("daily-menus", canteenId),
      ],
    },
  )();
}

// ─── Inventory ─────────────────────────────────────────────────
export function getInventoryByCanteen(canteenId: string) {
  return unstable_cache(
    () =>
      db.query.inventoryItemsTable.findMany({
        where: eq(inventoryItemsTable.canteenId, canteenId),
        orderBy: [inventoryItemsTable.name],
      }),
    [getCanteenTag("inventory-items", canteenId)],
    {
      tags: [
        getGlobalTag("inventory-items"),
        getCanteenTag("inventory-items", canteenId),
      ],
    },
  )();
}

// ─── Reports ───────────────────────────────────────────────────
export function getSalesReport(startDate: string, endDate: string) {
  return unstable_cache(
    async () => {
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
    },
    [getAdminTag("orders"), startDate, endDate],
    { tags: [getGlobalTag("orders")], revalidate: 300 },
  )();
}
