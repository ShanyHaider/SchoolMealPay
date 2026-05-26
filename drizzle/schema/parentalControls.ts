import { index, pgTable, uuid } from "drizzle-orm/pg-core";
import { id, createdAt } from "../schemaHelpers";
import { usersTable } from "./users";
import { studentsTable } from "./students";
import { menuItemsTable } from "./menu";

// Parents can block specific menu items per child (SRS-153).
// Query pattern: "show me all blocked items for this student"
// used when rendering the menu to disable blocked items.
export const blockedItemsTable = pgTable(
  "blocked_items",
  {
    id,
    parentId: uuid("parent_id")
      .notNull()
      .references(() => usersTable.id, { onDelete: "cascade" }),
    studentId: uuid("student_id")
      .notNull()
      .references(() => studentsTable.id, { onDelete: "cascade" }),
    menuItemId: uuid("menu_item_id")
      .notNull()
      .references(() => menuItemsTable.id, { onDelete: "cascade" }),
    createdAt,
  },
  (t) => [
    index("blocked_items_student_menu_item_idx").on(t.studentId, t.menuItemId),
    index("blocked_items_student_idx").on(t.studentId),
    index("blocked_items_parent_idx").on(t.parentId),
  ],
);
