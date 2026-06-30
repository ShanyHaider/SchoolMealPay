import { db } from "@/drizzle/db";
import {
  studentsTable,
  childProfilesTable,
  studentAllergensTable,
  parentChildLinksTable,
} from "@/drizzle/schema";
import { and, eq } from "drizzle-orm";
import { cacheLife, cacheTag } from "next/cache";
import { getGlobalTag, getIdTag, getUserTag, getStudentTag } from "@/lib/cache";

// ─── Students ──────────────────────────────────────────────────

export async function getStudentById(studentId: string) {
  "use cache";
  cacheLife("minutes");
  cacheTag(
    getGlobalTag("students"),
    getIdTag("students", studentId),
    getStudentTag("student-allergens", studentId),
    getStudentTag("child-profiles", studentId),
  );
  return db.query.studentsTable.findFirst({
    where: eq(studentsTable.id, studentId),
    with: {
      childProfile: true,
      allergens: true,
      class: true,
    },
  });
}

export async function getAllStudents() {
  "use cache";
  cacheLife("minutes");
  cacheTag(getGlobalTag("students"));
  return db.query.studentsTable.findMany({
    with: { childProfile: true, allergens: true, class: true },
  });
}

// ─── Child Profile ─────────────────────────────────────────────

export async function getChildProfile(studentId: string) {
  "use cache";
  cacheLife("minutes");
  cacheTag(getGlobalTag("child-profiles"), getIdTag("child-profiles", studentId));
  return db.query.childProfilesTable.findFirst({
    where: eq(childProfilesTable.studentId, studentId),
  });
}

// ─── Allergens ─────────────────────────────────────────────────

export async function getStudentAllergens(studentId: string) {
  "use cache";
  cacheLife("minutes");
  cacheTag(getGlobalTag("student-allergens"), getStudentTag("student-allergens", studentId));
  return db.query.studentAllergensTable.findMany({
    where: eq(studentAllergensTable.studentId, studentId),
  });
}

// ─── Parent-Child Links ────────────────────────────────────────

export async function getChildrenByParent(parentId: string) {
  "use cache";
  cacheLife("minutes");
  cacheTag(getGlobalTag("parent-child-links"), getUserTag("parent-child-links", parentId));
  return db.query.parentChildLinksTable.findMany({
    where: and(
      eq(parentChildLinksTable.parentId, parentId),
      eq(parentChildLinksTable.status, "approved"),
    ),
    with: {
      student: {
        with: { childProfile: true, allergens: true, class: true },
      },
    },
  });
}

export async function getPendingLinkRequests() {
  "use cache";
  cacheLife("seconds");
  cacheTag(getGlobalTag("parent-child-links"));
  return db.query.parentChildLinksTable.findMany({
    where: eq(parentChildLinksTable.status, "pending"),
    with: { student: true },
  });
}
