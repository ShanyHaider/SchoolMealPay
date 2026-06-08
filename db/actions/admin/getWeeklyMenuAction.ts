"use server";

import { getWeeklyMenu } from "@/db/queries/Menu";
import { assertRole } from "@/lib/guards/serverGuards";

/**
 * Thin server-action wrapper around getWeeklyMenu so client components
 * can re-fetch the schedule when the canteen selector changes — without
 * importing the query file (which has "use cache" directives) into the
 * client bundle.
 */
export async function getWeeklyMenuAction(
    canteenId: string,
    weekStart: string,
    weekEnd: string,
) {
    await assertRole(["school_admin", "canteen_staff"]);
    return getWeeklyMenu(canteenId, weekStart, weekEnd);
}