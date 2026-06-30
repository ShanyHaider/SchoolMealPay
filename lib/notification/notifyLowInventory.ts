// lib/notifyLowInventory.ts
// Called from Canteen.ts updateInventoryQuantity after every stock change.
// Kept in its own file to avoid a circular import:
//   Canteen.ts → Notifications.ts → canteenStaffAssignmentsTable (schema only, fine)
// but Notifications.ts already imports from Canteen indirectly via schema, so
// the fan-out logic lives here instead.

"use server";

import { db } from "@/drizzle/db";
import { canteenStaffAssignmentsTable } from "@/drizzle/schema";
import { eq } from "drizzle-orm";
import { notifyMany } from "@/lib/notification/notify";
import { PushEvents } from "@/lib/notification/webpush";

export async function notifyStaffLowInventory(
    canteenId: string,
    itemName: string,
    quantity: string,
    unit: string,
) {
    const assignments = await db.query.canteenStaffAssignmentsTable.findMany({
        where: eq(canteenStaffAssignmentsTable.canteenId, canteenId),
    });

    const staffIds = assignments.map((a) => a.staffId);
    if (staffIds.length === 0) return;

    await notifyMany(staffIds, {
        type: "low_inventory",
        event: PushEvents.staff.lowInventory(itemName, quantity, unit),
    });
}