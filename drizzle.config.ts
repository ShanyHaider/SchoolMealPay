import { defineConfig } from "drizzle-kit";
import { env } from "./data/env/server";

console.log("DATABASE_URL:", env.DATABASE_URL);

export default defineConfig({
  out: "./drizzle/migrations",
  schema: "./drizzle/schema.ts",
  dialect: "postgresql",
  dbCredentials: {
    url: env.DATABASE_URL,
  },
});
