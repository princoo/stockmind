import { PrismaPg } from "@prisma/adapter-pg";
import { Pool } from "pg";
import { PrismaClient } from "@/generated/prisma/client";
import "server-only";

const globalForPrisma = globalThis as unknown as {
  prisma: PrismaClient | undefined;
};

function createPrismaClient() {
  const url = process.env.DATABASE_URL;
  if (!url) {
    throw new Error("DATABASE_URL is not set");
  }

  const parsedUrl = new URL(url);
  parsedUrl.searchParams.delete("sslmode");
  parsedUrl.searchParams.delete("sslrootcert");
  parsedUrl.searchParams.delete("sslcert");
  parsedUrl.searchParams.delete("sslkey");

  const pool = new Pool({
    connectionString: parsedUrl.toString(),
    ssl: { rejectUnauthorized: false },
  });
  const adapter = new PrismaPg(pool);

  return new PrismaClient({
    adapter,
    log:
      process.env.NODE_ENV === "development"
        ? ["query", "error", "warn"]
        : ["error"],
  });
}

/**
 * PrismaClient singleton for Next.js App Router.
 * Prevents exhausting DB connections in dev (hot reload) and reuses one instance in production.
 * Use only in Server Components, Server Actions, Route Handlers, and other server-only code.
 */
export const prisma: PrismaClient =
  globalForPrisma.prisma ?? createPrismaClient();

if (process.env.NODE_ENV !== "production") {
  globalForPrisma.prisma = prisma;
}
