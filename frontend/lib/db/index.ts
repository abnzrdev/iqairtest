import { drizzle } from "drizzle-orm/postgres-js";
import postgres from "postgres";
import * as schema from "./schema";

let cachedDb: ReturnType<typeof drizzle> | null = null;

export function getDb() {
  if (!process.env.DB_URL) {
    throw new Error("DB_URL environment variable is not set");
  }

  if (!cachedDb) {
    const client = postgres(process.env.DB_URL);
    cachedDb = drizzle(client, { schema });
  }

  return cachedDb;
}
