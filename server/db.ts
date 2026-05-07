import { drizzle } from "drizzle-orm/postgres-js";
import type { PostgresJsDatabase } from "drizzle-orm/postgres-js";
import postgres from "postgres";
import * as schema from "@shared/schema";

type DrizzleDB = PostgresJsDatabase<typeof schema>;

let db: DrizzleDB | null = null;
let client: ReturnType<typeof postgres> | null = null;

const databaseUrl = process.env.DATABASE_URL;
const hasDatabaseUrl = typeof databaseUrl === "string" && databaseUrl.length > 0;
const isProduction = process.env.NODE_ENV === "production";
const allowProductionMock = process.env.ALLOW_PRODUCTION_MOCK === "true";

if (isProduction && !hasDatabaseUrl && !allowProductionMock) {
  throw new Error("FATAL: DATABASE_URL must be set in production. Mock mode is disabled in production.");
}

export const isMockMode = !hasDatabaseUrl;

if (hasDatabaseUrl) {
  client = postgres(databaseUrl!, {
    max: 10,
    idle_timeout: 30,
    connect_timeout: 10,
  });
  db = drizzle(client, { schema });
  console.log("[db] Connected to PostgreSQL database");
} else {
  if (isProduction && allowProductionMock) {
    console.warn("[db] ALLOW_PRODUCTION_MOCK=true — running built app in mock mode without DATABASE_URL");
  }
  console.log("[db] No DATABASE_URL — running in mock (in-memory) mode");
}

export { db };

export async function closeDB() {
  if (client) {
    await client.end();
    console.log("[db] Database connection closed");
  }
}
