// drizzle/cleanup-seed.ts
// Run with: npx tsx drizzle/cleanup-seed.ts

import "dotenv/config";
import { drizzle } from "drizzle-orm/node-postgres";
import { Pool } from "pg";
import { inArray } from "drizzle-orm";

import { schoolProfileTable } from "@/drizzle/schema";
import { schoolSubscriptionTable, subscriptionInvoicesTable } from "@/drizzle/schema/subscriptions";
import { canteensTable, canteenStaffAssignmentsTable } from "@/drizzle/schema/canteens";
import { usersTable } from "@/drizzle/schema/users";
import { classesTable, studentsTable, childProfilesTable, parentChildLinksTable, studentAllergensTable } from "@/drizzle/schema/students";
import { menuItemsTable, dailyMenusTable, inventoryItemsTable } from "@/drizzle/schema/menu";
import { ordersTable, orderItemsTable } from "@/drizzle/schema/orders";
import { parentWalletsTable, transactionsTable } from "@/drizzle/schema/transactions";
import { nutritionTrendsTable } from "@/drizzle/schema/aiInsights";
import { nutritionTargetsTable } from "@/drizzle/schema/nutritionTargets";
import { aiMealSuggestionsTable } from "@/drizzle/schema/aiInsights";

const pool = new Pool({ connectionString: process.env.DATABASE_URL });
const db = drizzle(pool);

const FAKE_CANTEEN_IDS = [
    "00000000-0000-0000-0000-000000000003",
];

const FAKE_USER_IDS = [
    "00000000-0000-0000-0001-000000000001",
    "00000000-0000-0000-0001-000000000002",
    "00000000-0000-0000-0001-000000000003",
    "00000000-0000-0000-0001-000000000004",
    "00000000-0000-0000-0001-000000000005",
    "00000000-0000-0000-0001-000000000006",
];

const FAKE_STUDENT_IDS = [
    "00000000-0000-0000-0003-000000000001",
    "00000000-0000-0000-0003-000000000002",
    "00000000-0000-0000-0003-000000000003",
    "00000000-0000-0000-0003-000000000004",
];

const FAKE_MENU_ITEM_IDS = [
    "00000000-0000-0000-0004-000000000001",
    "00000000-0000-0000-0004-000000000002",
    "00000000-0000-0000-0004-000000000003",
    "00000000-0000-0000-0004-000000000004",
    "00000000-0000-0000-0004-000000000005",
    "00000000-0000-0000-0004-000000000006",
    "00000000-0000-0000-0004-000000000007",
    "00000000-0000-0000-0004-000000000008",
];

const FAKE_ORDER_IDS = [
    "00000000-0000-0000-0006-000000000001",
    "00000000-0000-0000-0006-000000000002",
    "00000000-0000-0000-0006-000000000003",
    "00000000-0000-0000-0006-000000000004",
];

async function main() {
    console.log("🗑️  Cleaning up fake seed data…");

    // Delete in reverse dependency order to avoid FK violations

    await db.delete(aiMealSuggestionsTable)
        .where(inArray(aiMealSuggestionsTable.studentId, FAKE_STUDENT_IDS));
    console.log("  ✓ AI meal suggestions");

    await db.delete(nutritionTrendsTable)
        .where(inArray(nutritionTrendsTable.studentId, FAKE_STUDENT_IDS));
    console.log("  ✓ Nutrition trends");

    await db.delete(orderItemsTable)
        .where(inArray(orderItemsTable.orderId, FAKE_ORDER_IDS));
    console.log("  ✓ Order items");

    await db.delete(transactionsTable)
        .where(inArray(transactionsTable.orderId, FAKE_ORDER_IDS));
    console.log("  ✓ Transactions");

    await db.delete(ordersTable)
        .where(inArray(ordersTable.id, FAKE_ORDER_IDS));
    console.log("  ✓ Orders");

    await db.delete(dailyMenusTable)
        .where(inArray(dailyMenusTable.canteenId, FAKE_CANTEEN_IDS));
    console.log("  ✓ Daily menus");

    await db.delete(inventoryItemsTable)
        .where(inArray(inventoryItemsTable.canteenId, FAKE_CANTEEN_IDS));
    console.log("  ✓ Inventory items");

    await db.delete(menuItemsTable)
        .where(inArray(menuItemsTable.id, FAKE_MENU_ITEM_IDS));
    console.log("  ✓ Menu items");

    await db.delete(canteenStaffAssignmentsTable)
        .where(inArray(canteenStaffAssignmentsTable.canteenId, FAKE_CANTEEN_IDS));
    console.log("  ✓ Staff assignments");

    await db.delete(canteensTable)
        .where(inArray(canteensTable.id, FAKE_CANTEEN_IDS));
    console.log("  ✓ Canteen");

    await db.delete(parentChildLinksTable)
        .where(inArray(parentChildLinksTable.studentId, FAKE_STUDENT_IDS));
    console.log("  ✓ Parent-child links");

    await db.delete(studentAllergensTable)
        .where(inArray(studentAllergensTable.studentId, FAKE_STUDENT_IDS));
    console.log("  ✓ Student allergens");

    await db.delete(childProfilesTable)
        .where(inArray(childProfilesTable.studentId, FAKE_STUDENT_IDS));
    console.log("  ✓ Child profiles");

    await db.delete(studentsTable)
        .where(inArray(studentsTable.id, FAKE_STUDENT_IDS));
    console.log("  ✓ Students");

    await db.delete(classesTable).where(inArray(classesTable.id, [
        "00000000-0000-0000-0002-000000000001",
        "00000000-0000-0000-0002-000000000002",
        "00000000-0000-0000-0002-000000000003",
    ]));
    console.log("  ✓ Classes");

    await db.delete(parentWalletsTable)
        .where(inArray(parentWalletsTable.parentId, FAKE_USER_IDS));
    console.log("  ✓ Wallets");

    await db.delete(usersTable)
        .where(inArray(usersTable.id, FAKE_USER_IDS));
    console.log("  ✓ Users");

    await db.delete(nutritionTargetsTable).where(inArray(nutritionTargetsTable.id, [
        "00000000-0000-0000-0007-000000000001",
        "00000000-0000-0000-0007-000000000002",
    ]));
    console.log("  ✓ Nutrition targets");

    await db.delete(schoolSubscriptionTable).where(inArray(schoolSubscriptionTable.id, [
        "00000000-0000-0000-0000-000000000002",
    ]));
    console.log("  ✓ School subscription");

    await db.delete(schoolProfileTable).where(inArray(schoolProfileTable.id, [
        "00000000-0000-0000-0000-000000000001",
    ]));
    console.log("  ✓ School profile");

    console.log("\n✅ Cleanup complete! Now update seed.ts with real UUIDs and reseed.");
    await pool.end();
}

main().catch((err) => {
    console.error("❌ Cleanup failed:", err);
    process.exit(1);
});