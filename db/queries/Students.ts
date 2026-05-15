import { db } from "@/drizzle/db";
import {
  studentsTable,
  childProfilesTable,
  studentAllergensTable,
  parentChildLinksTable,
} from "@/drizzle/schema";
import { eq } from "drizzle-orm";
import { unstable_cache } from "next/cache";
import { getGlobalTag, getIdTag, getUserTag, getStudentTag } from "@/lib/cache";

// ─── Students ──────────────────────────────────────────────────

export function getStudentById(studentId: string) {
  return unstable_cache(
    () =>
      db.query.studentsTable.findFirst({
        where: eq(studentsTable.id, studentId),
        with: {
          childProfile: true,
          allergens: true,
          class: true,
        },
      }),
    [getIdTag("students", studentId)],
    {
      tags: [
        getGlobalTag("students"),
        getIdTag("students", studentId),
        getStudentTag("student-allergens", studentId),
        getStudentTag("child-profiles", studentId),
      ],
    },
  )();
}

export function getAllStudents() {
  return unstable_cache(
    () =>
      db.query.studentsTable.findMany({
        with: { childProfile: true, allergens: true, class: true },
      }),
    [getGlobalTag("students")],
    { tags: [getGlobalTag("students")] },
  )();
}

// ─── Child Profile ─────────────────────────────────────────────

export function getChildProfile(studentId: string) {
  return unstable_cache(
    () =>
      db.query.childProfilesTable.findFirst({
        where: eq(childProfilesTable.studentId, studentId),
      }),
    [getIdTag("child-profiles", studentId)],
    {
      tags: [
        getGlobalTag("child-profiles"),
        getIdTag("child-profiles", studentId),
      ],
    },
  )();
}

// ─── Allergens ─────────────────────────────────────────────────

export function getStudentAllergens(studentId: string) {
  return unstable_cache(
    () =>
      db.query.studentAllergensTable.findMany({
        where: eq(studentAllergensTable.studentId, studentId),
      }),
    [getStudentTag("student-allergens", studentId)],
    {
      tags: [
        getGlobalTag("student-allergens"),
        getStudentTag("student-allergens", studentId),
      ],
    },
  )();
}

// ─── Parent-Child Links ────────────────────────────────────────

export function getChildrenByParent(parentId: string) {
  return unstable_cache(
    () =>
      db.query.parentChildLinksTable.findMany({
        where: eq(parentChildLinksTable.parentId, parentId),
        with: {
          student: {
            with: { childProfile: true, allergens: true, class: true },
          },
        },
      }),
    [getUserTag("parent-child-links", parentId)],
    {
      tags: [
        getGlobalTag("parent-child-links"),
        getUserTag("parent-child-links", parentId),
      ],
    },
  )();
}

export function getPendingLinkRequests() {
  return unstable_cache(
    () =>
      db.query.parentChildLinksTable.findMany({
        where: eq(parentChildLinksTable.status, "pending"),
        with: { student: true },
      }),
    [getGlobalTag("parent-child-links")],
    { tags: [getGlobalTag("parent-child-links")] },
  )();
}
