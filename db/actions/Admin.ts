"use server";

import { db } from "@/drizzle/db";
import {
  studentsTable,
  classesTable,
  canteensTable,
  canteenStaffAssignmentsTable,
  menuItemsTable,
  dailyMenusTable,
  inventoryItemsTable,
  parentChildLinksTable,
  schoolProfileTable,
  usersTable,
} from "@/drizzle/schema";
import { eq, and } from "drizzle-orm";
import {
  revalidateSchoolProfileCache,
  revalidateStudentCache,
  revalidateParentChildLinkCache,
  revalidateClassCache,
  revalidateCanteenCache,
  revalidateCanteenStaffCache,
  revalidateMenuItemCache,
  revalidateDailyMenuCache,
  revalidateInventoryCache,
  revalidateUserCache,
} from "@/lib/cacheRevalidation";

// ─── School Profile ────────────────────────────────────────────
// Schema fields: name, address, city, phone, email, logoUrl, primaryColor, timezone
export async function upsertSchoolProfile(data: {
  name: string;
  address?: string;
  city?: string;
  phone?: string;
  email?: string;
  logoUrl?: string;
  primaryColor?: string;
  timezone?: string;
}) {
  const existing = await db.query.schoolProfileTable.findFirst();
  if (existing) {
    await db
      .update(schoolProfileTable)
      .set({ ...data, updatedAt: new Date() })
      .where(eq(schoolProfileTable.id, existing.id));
  } else {
    await db.insert(schoolProfileTable).values(data);
  }
  revalidateSchoolProfileCache();
}

// ─── Students ──────────────────────────────────────────────────
export async function createStudent(data: {
  name: string;
  studentCode: string;
  classId?: string;
  imageUrl?: string;
}) {
  const [created] = await db.insert(studentsTable).values(data).returning();
  revalidateStudentCache(created.id);
}

export async function updateStudent(
  id: string,
  data: Partial<{
    name: string;
    classId: string;
    orderingEnabled: boolean; // lives on studentsTable directly
  }>,
) {
  await db
    .update(studentsTable)
    .set({ ...data, updatedAt: new Date() })
    .where(eq(studentsTable.id, id));
  revalidateStudentCache(id);
}

export async function deleteStudent(id: string) {
  await db.delete(studentsTable).where(eq(studentsTable.id, id));
  revalidateStudentCache(id);
}

// ─── Parent Link Approvals ─────────────────────────────────────
export async function resolveParentLink(
  linkId: string,
  decision: "approved" | "rejected",
) {
  const link = await db.query.parentChildLinksTable.findFirst({
    where: eq(parentChildLinksTable.id, linkId),
  });
  if (!link) return;

  await db
    .update(parentChildLinksTable)
    .set({ status: decision })
    .where(eq(parentChildLinksTable.id, linkId));

  revalidateParentChildLinkCache(link.parentId, link.studentId);
}

// ─── Classes ───────────────────────────────────────────────────
// Schema: grade, section only — no teacherName column
export async function createClass(data: { grade: string; section: string }) {
  const [created] = await db.insert(classesTable).values(data).returning();
  revalidateClassCache(created.id);
}

export async function updateClass(
  id: string,
  data: Partial<{ grade: string; section: string }>,
) {
  await db
    .update(classesTable)
    .set({ ...data, updatedAt: new Date() })
    .where(eq(classesTable.id, id));
  revalidateClassCache(id);
}

export async function deleteClass(id: string) {
  await db.delete(classesTable).where(eq(classesTable.id, id));
  revalidateClassCache(id);
}

// ─── Canteens ──────────────────────────────────────────────────
// Schema: name, location, operatingHours, capacity, isActive
// NOT openTime/closeTime — those don't exist
export async function createCanteen(data: {
  name: string;
  location?: string;
  operatingHours?: string;
  capacity?: number;
}) {
  const [created] = await db.insert(canteensTable).values(data).returning();
  revalidateCanteenCache(created.id);
}

export async function updateCanteen(
  id: string,
  data: Partial<{
    name: string;
    location: string;
    operatingHours: string;
    capacity: number;
    isActive: boolean;
  }>,
) {
  await db
    .update(canteensTable)
    .set({ ...data, updatedAt: new Date() })
    .where(eq(canteensTable.id, id));
  revalidateCanteenCache(id);
}

// ─── Staff Assignment ──────────────────────────────────────────
// Schema requires assignedBy (notNull) — caller must pass adminId
export async function assignStaffToCanteen(
  staffId: string,
  canteenId: string,
  assignedBy: string, // admin's DB user id — required by schema
) {
  const existing = await db.query.canteenStaffAssignmentsTable.findFirst({
    where: eq(canteenStaffAssignmentsTable.staffId, staffId),
  });
  if (existing) {
    await db
      .delete(canteenStaffAssignmentsTable)
      .where(eq(canteenStaffAssignmentsTable.staffId, staffId));
    revalidateCanteenStaffCache(existing.canteenId, staffId);
  }

  await db
    .insert(canteenStaffAssignmentsTable)
    .values({ staffId, canteenId, assignedBy });
  revalidateCanteenStaffCache(canteenId, staffId);
}

export async function removeStaffAssignment(
  staffId: string,
  canteenId: string,
) {
  await db
    .delete(canteenStaffAssignmentsTable)
    .where(eq(canteenStaffAssignmentsTable.staffId, staffId));
  revalidateCanteenStaffCache(canteenId, staffId);
}

export async function promoteToStaff(userId: string) {
  const user = await db.query.usersTable.findFirst({
    where: eq(usersTable.id, userId),
  });
  await db
    .update(usersTable)
    .set({ role: "canteen_staff" })
    .where(eq(usersTable.id, userId));
  if (user) revalidateUserCache(user.clerkId);
}

// ─── Menu Items ────────────────────────────────────────────────
// Schema fields: name, description, price (NOT basePrice), category,
// calories, proteinG, fiberG, carbsG, fatG,
// isVegetarian, isVegan, containsNuts, containsGluten, containsDairy,
// isAvailable, isSpecialOfDay, imageUrl, canteenId
// NO isHalal field — use containsNuts/containsDairy/etc. for dietary flags
export async function createMenuItem(data: {
  canteenId: string;
  name: string;
  description?: string;
  price: string; // was basePrice — schema column is "price"
  category: "breakfast" | "lunch" | "snack" | "beverage";
  calories?: number;
  proteinG?: string;
  carbsG?: string;
  fatG?: string;
  fiberG?: string;
  isVegetarian?: boolean;
  isVegan?: boolean;
  containsNuts?: boolean;
  containsGluten?: boolean;
  containsDairy?: boolean;
  imageUrl?: string;
}) {
  const [created] = await db.insert(menuItemsTable).values(data).returning();
  revalidateMenuItemCache(created.id, created.canteenId);
}

export async function updateMenuItem(
  id: string,
  data: Partial<typeof menuItemsTable.$inferInsert>,
) {
  const existing = await db.query.menuItemsTable.findFirst({
    where: eq(menuItemsTable.id, id),
  });
  await db
    .update(menuItemsTable)
    .set({ ...data, updatedAt: new Date() })
    .where(eq(menuItemsTable.id, id));
  revalidateMenuItemCache(id, existing?.canteenId ?? "");
}

export async function deleteMenuItem(id: string) {
  const existing = await db.query.menuItemsTable.findFirst({
    where: eq(menuItemsTable.id, id),
  });
  await db.delete(menuItemsTable).where(eq(menuItemsTable.id, id));
  revalidateMenuItemCache(id, existing?.canteenId ?? "");
}

// ─── Daily Menu Scheduling ─────────────────────────────────────
// Schema: canteenId, menuItemId, menuDate, mealSlot, availableFrom, availableUntil
// Unique constraint on (canteenId, menuItemId, menuDate, mealSlot)
export async function scheduleDailyMenu(data: {
  canteenId: string;
  menuItemId: string;
  menuDate: string;
  mealSlot: "breakfast" | "lunch" | "snack";
  availableFrom?: string;
  availableUntil?: string;
}) {
  await db.insert(dailyMenusTable).values(data).onConflictDoNothing();
  revalidateDailyMenuCache(data.canteenId);
}

export async function removeDailyMenu(
  canteenId: string,
  menuItemId: string,
  menuDate: string,
  mealSlot: string,
) {
  await db
    .delete(dailyMenusTable)
    .where(
      and(
        eq(dailyMenusTable.canteenId, canteenId),
        eq(dailyMenusTable.menuItemId, menuItemId),
        eq(dailyMenusTable.menuDate, menuDate),
        eq(dailyMenusTable.mealSlot, mealSlot as any),
      ),
    );
  revalidateDailyMenuCache(canteenId);
}

// ─── Inventory ─────────────────────────────────────────────────
// Schema fields: canteenId, name, quantity (NOT currentStock),
//                unit, lowStockThreshold (NOT reorderLevel)
export async function createInventoryItem(data: {
  canteenId: string;
  name: string;
  unit: string;
  quantity?: string;
  lowStockThreshold?: string;
}) {
  const [created] = await db
    .insert(inventoryItemsTable)
    .values(data)
    .returning();
  revalidateInventoryCache(created.id, created.canteenId);
}

export async function updateInventoryQuantity(id: string, quantity: string) {
  const existing = await db.query.inventoryItemsTable.findFirst({
    where: eq(inventoryItemsTable.id, id),
  });
  await db
    .update(inventoryItemsTable)
    .set({ quantity, updatedAt: new Date() })
    .where(eq(inventoryItemsTable.id, id));
  if (existing) revalidateInventoryCache(id, existing.canteenId);
}
