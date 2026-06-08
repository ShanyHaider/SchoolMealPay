// db/schema/pushSubscriptions.ts
import { index, pgTable, text, uuid, varchar } from "drizzle-orm/pg-core";
import { id, createdAt, updatedAt } from "../schemaHelpers";
import { usersTable } from "./users";

// One row per browser/device per user.
// A user can have multiple subscriptions (phone + desktop + tablet).
// endpoint is the browser-assigned push URL — unique per device.
// p256dh and auth are the encryption keys the browser generates.
// We send to ALL active subscriptions for a userId when notifying.
export const pushSubscriptionsTable = pgTable(
    "push_subscriptions",
    {
        id,
        userId: uuid("user_id")
            .notNull()
            .references(() => usersTable.id, { onDelete: "cascade" }),
        endpoint: text("endpoint").notNull().unique(),
        p256dh: text("p256dh").notNull(),   // browser public key
        auth: text("auth").notNull(),        // browser auth secret
        userAgent: varchar("user_agent"),    // optional — for debugging which device
        createdAt,
        updatedAt,
    },
    (t) => [
        index("push_subscriptions_user_idx").on(t.userId),
    ],
);