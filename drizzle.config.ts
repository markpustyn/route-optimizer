import 'dotenv/config';
import { defineConfig } from 'drizzle-kit';
import { config } from "dotenv";

config({ path: ".env.local" });

export default defineConfig({
  out: './drizzle',
  schema: './drizzle/schema.ts',
  dialect: 'postgresql',
  dbCredentials: {
    url: process.env.NEXT_PUBLIC_DATABASE_URL!,
  },
});
