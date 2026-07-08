// drizzle/db.ts
import { Pool, neonConfig } from "@neondatabase/serverless";
import { drizzle } from "drizzle-orm/neon-serverless";
import ws from "ws";
import { env } from "@/data/env/server";
import * as schema from "@/drizzle/schema";
import type { Pool as PgPool } from "pg";

// Required outside serverless edge runtimes (Node.js) so the driver
// can use real WebSockets instead of relying on browser APIs
neonConfig.webSocketConstructor = ws;
// Route non-transaction queries via HTTP fetch instead of WebSocket.
// This makes single queries immune to WebSocket cold-start ETIMEDOUT when
// Neon's compute auto-suspends — the HTTP endpoint handles wake-up internally.
// Transactions (SELECT FOR UPDATE, db.transaction()) still use WebSocket.
neonConfig.poolQueryViaFetch = true;

type DbInstance = ReturnType<typeof drizzle<typeof schema>>;

const globalForDb = globalThis as unknown as {
  db: DbInstance | undefined;
  pool: Pool | undefined;
};

const pool =
  globalForDb.pool ??
  new Pool({
    connectionString: env.DATABASE_URL,
    max: 5, // headroom for multiple execution environments hitting this pool
  });

pool.on(
  "error",
  (
    err: Parameters<PgPool["on"]>[1] extends (e: infer E) => void ? E : never,
  ) => {
    console.error("[neon pool] error", err);
  },
);

export const db: DbInstance = globalForDb.db ?? drizzle(pool, { schema });

if (process.env.NODE_ENV !== "production") {
  globalForDb.db = db;
  globalForDb.pool = pool;
}
