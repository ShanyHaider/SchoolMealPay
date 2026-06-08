"use server";

// db/actions/Admin.ts — FIXED (only inviteStaffMember and promoteToStaff changed)
// All other actions are unchanged from your codebase — only the two below are shown
// as replacements. Drop them in over the old versions.

import { db } from "@/drizzle/db";
import {
  parentChildLinksTable,
  schoolProfileTable,
} from "@/drizzle/schema";
import { eq, and } from "drizzle-orm";
import { assertRole } from "@/lib/guards/serverGuards";
import {
  revalidateSchoolProfileCache,
  revalidateParentChildLinkCache,
} from "@/lib/cacheRevalidation";

// ─── School Profile ────────────────────────────────────────────────────────


// ─── Parent Link Approvals ─────────────────────────────────────────────────

export async function resolveParentLink(
  linkId: string,
  decision: "approved" | "rejected",
) {
  await assertRole(["school_admin"]);

  if (!linkId || !["approved", "rejected"].includes(decision)) {
    throw new Error("Invalid link resolution parameters.");
  }

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
