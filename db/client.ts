import { neon } from "@neondatabase/serverless";
import { drizzle } from "drizzle-orm/neon-http";

const connectionString = process.env.DATABASE_URL;
if (!connectionString) {
  throw new Error(
    "DATABASE_URL is required. Add your Neon connection string to the server environment.",
  );
}

const client = neon(connectionString);

export const db = drizzle({ client });
import "server-only";
