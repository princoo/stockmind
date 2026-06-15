import { PrismaPg } from "@prisma/adapter-pg";
import { Pool } from "pg";
import { PrismaClient } from "@/generated/prisma/client";
import "server-only";

const globalForPrisma = globalThis as unknown as {
  prisma: PrismaClient | undefined;
  pool: Pool | undefined;
};

function resolvePoolMax(): number {
  const configured = Number(process.env.DATABASE_POOL_MAX);
  if (Number.isFinite(configured) && configured > 0) {
    return Math.floor(configured);
  }
  // Hosted plans (e.g. Aiven hobby) often allow ~10 total connections.
  // Next.js dev hot reload can spawn extra pools, so keep this low.
  return process.env.NODE_ENV === "production" ? 5 : 2;
}

function createPgPool(): Pool {
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
  // Hosted DBs (Neon, RDS, Aiven, etc.) typically need TLS — use sslmode=require in DATABASE_URL.
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

  return new Pool({
    connectionString: parsedUrl.toString(),
    ssl,
    max: resolvePoolMax(),
    idleTimeoutMillis: 20_000,
    connectionTimeoutMillis: 10_000,
  });
}

function getPgPool(): Pool {
  if (globalForPrisma.pool) {
    return globalForPrisma.pool;
  }

  const pool = createPgPool();
  globalForPrisma.pool = pool;
  return pool;
}

function createPrismaClient(): PrismaClient {
  const adapter = new PrismaPg(getPgPool());

  return new PrismaClient({
    adapter,
    log:
      process.env.NODE_ENV === "development"
        ? ["query", "error", "warn"]
        : ["error"],
  });
}

function getPrismaClient(): PrismaClient {
  if (globalForPrisma.prisma) {
    return globalForPrisma.prisma;
  }

  const client = createPrismaClient();
  globalForPrisma.prisma = client;
  return client;
}

/**
 * PrismaClient singleton for Next.js App Router.
 * Reuses one pg Pool + Prisma instance across hot reloads to avoid exhausting
 * hosted DB connection limits (e.g. Aiven).
 * Use only in Server Components, Server Actions, Route Handlers, and other server-only code.
 */
export const prisma: PrismaClient = getPrismaClient();
