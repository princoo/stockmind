import { config as loadEnv } from "dotenv";
import { defineConfig } from "prisma/config";
import { resolve } from "node:path";

// Next.js loads `.env.local`; Prisma CLI only used to load `.env` via dotenv/config.
loadEnv({ path: resolve(process.cwd(), ".env") });
loadEnv({ path: resolve(process.cwd(), ".env.local"), override: true });

// process.env (not `env()`) so `prisma generate` works when DATABASE_URL is unset (e.g. CI).
export default defineConfig({
  schema: "prisma/schema.prisma",
  migrations: {
    path: "prisma/migrations",
  },
  datasource: {
    url: process.env.DATABASE_URL ?? "",
  },
});
