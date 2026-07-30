// db.ts
import { drizzle } from "drizzle-orm/node-postgres";
import { Pool } from "pg";
import * as schema from "./schema";
export { eq } from "drizzle-orm";

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: process.env.NODE_ENV === "production" 
    ? { rejectUnauthorized: false } 
    : undefined,
});

pool.on("error", (err) => {
  console.error("Unexpected error on idle database client", err);
  process.exit(-1);
});

export const db = drizzle(pool, { schema });

export type Database = typeof db;
export default db;