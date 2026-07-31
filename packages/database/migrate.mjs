import path from "node:path";
import { fileURLToPath } from "node:url";
import { drizzle } from "drizzle-orm/node-postgres";
import { migrate } from "drizzle-orm/node-postgres/migrator";
import pg from "pg";

const { Pool } = pg;

const databaseUrl = process.env.DATABASE_URL;

if (!databaseUrl) {
  throw new Error("DATABASE_URL is required to run database migrations");
}

const isProduction = process.env.NODE_ENV === "production";
const hasSslAgnosticUrl = databaseUrl.includes("sslmode=require");
const migrationsFolder = path.join(path.dirname(fileURLToPath(import.meta.url)), "drizzle");

const pool = new Pool({
  connectionString: databaseUrl,
  ssl: isProduction && hasSslAgnosticUrl ? { rejectUnauthorized: false } : undefined,
});

try {
  console.log("Running database migrations...");
  const db = drizzle(pool);
  await migrate(db, { migrationsFolder });
  console.log("Database migrations completed.");
} finally {
  await pool.end();
}
