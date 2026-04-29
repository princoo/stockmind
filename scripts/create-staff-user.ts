import { config as loadEnv } from "dotenv";
import { resolve } from "node:path";
import { randomUUID } from "node:crypto";
import bcrypt from "bcryptjs";
import { Client } from "pg";

loadEnv({ path: resolve(process.cwd(), ".env") });
loadEnv({ path: resolve(process.cwd(), ".env.local"), override: true });

const args = process.argv.slice(2);
const email = args[0];
const password = args[1];
const name = args[2] ?? "Staff";

if (!email || !password) {
  console.error("Usage: pnpm run user:create-staff -- <email> <password> [name]");
  process.exit(1);
}

const databaseUrl = process.env.DATABASE_URL;
if (!databaseUrl) {
  console.error("DATABASE_URL is not set");
  process.exit(1);
}

function normalizeConnectionString(url: string) {
  const parsed = new URL(url);
  parsed.searchParams.delete("sslmode");
  parsed.searchParams.delete("sslrootcert");
  parsed.searchParams.delete("sslcert");
  parsed.searchParams.delete("sslkey");
  return parsed.toString();
}

const client = new Client({
  connectionString: normalizeConnectionString(databaseUrl),
  ssl: { rejectUnauthorized: false },
});

async function main() {
  await client.connect();
  const hashedPassword = await bcrypt.hash(password, 12);
  const userEmail = email.toLowerCase();
  const userId = `usr_${randomUUID().replaceAll("-", "")}`;
  const result = await client.query(
    `
      INSERT INTO "User" ("id", "name", "email", "password", "role")
      VALUES ($1, $2, $3, $4, 'STAFF'::"Role")
      ON CONFLICT ("email")
      DO UPDATE SET
        "name" = EXCLUDED."name",
        "password" = EXCLUDED."password",
        "role" = EXCLUDED."role"
      RETURNING "email"
    `,
    [userId, name, userEmail, hashedPassword],
  );

  console.log(`STAFF user ready: ${result.rows[0]?.email ?? userEmail}`);
}

main()
  .catch((error) => {
    console.error("Failed to create staff user:", error);
    process.exitCode = 1;
  })
  .finally(async () => {
    await client.end();
  });
