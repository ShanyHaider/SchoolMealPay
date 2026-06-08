// drizzle/db.ts
import { drizzle } from "drizzle-orm/node-postgres";
import { env } from "@/data/env/server";
import * as schema from "@/drizzle/schema";

type DbInstance = ReturnType<typeof drizzle<typeof schema>>;

const globalForDb = globalThis as unknown as { db: DbInstance | undefined };

export const db: DbInstance =
    globalForDb.db ??
    drizzle(env.DATABASE_URL, { schema });

if (process.env.NODE_ENV !== "production") globalForDb.db = db;