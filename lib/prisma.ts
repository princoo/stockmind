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
  const sslMode = parsedUrl.searchParams.get("sslmode")?.toLowerCase() ?? null;
  const hostname = parsedUrl.hostname;
  const isLocalHost =
    hostname === "localhost" ||
    hostname === "127.0.0.1" ||
    hostname === "::1";

  parsedUrl.searchParams.delete("sslmode");
  parsedUrl.searchParams.delete("sslrootcert");
  parsedUrl.searchParams.delete("sslcert");
  parsedUrl.searchParams.delete("sslkey");

  // Local Postgres often has SSL off; forcing TLS causes P1011 "server does not support SSL".
  // Hosted DBs (Neon, RDS, etc.) typically need TLS — use sslmode=require in DATABASE_URL or rely on remote default.
  const mustDisableSsl =
    sslMode === "disable" ||
    sslMode === "allow" ||
    (isLocalHost &&
      sslMode !== "require" &&
      sslMode !== "verify-full" &&
      sslMode !== "verify-ca");

  const wantsExplicitSsl =
    sslMode === "require" ||
    sslMode === "verify-full" ||
    sslMode === "verify-ca" ||
    sslMode === "prefer";

  let ssl: false | { rejectUnauthorized: boolean };
  if (mustDisableSsl) {
    ssl = false;
  } else if (!isLocalHost && (wantsExplicitSsl || !sslMode)) {
    ssl = { rejectUnauthorized: false };
  } else {
    ssl = false;
  }

  const pool = new Pool({
    connectionString: parsedUrl.toString(),
    ssl,
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
