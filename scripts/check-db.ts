import { config } from "dotenv";
import { sql } from "drizzle-orm";

config({ path: ".env.local", quiet: true });
config({ path: ".env", quiet: true });

async function main() {
  const { db } = await import("../db/client");
  const result = await db.execute(sql`
    select 1 as connected,
      to_regclass('public.codes') is not null as codes_exists,
      to_regclass('public.ratings') is not null as ratings_exists,
      to_regclass('public."user"') is not null as users_exists
  `);
  console.log("Neon connection successful:", result.rows[0]);
}

main().catch(() => {
  // Database driver errors can contain connection details; keep secrets out of logs.
  console.error(
    "Neon connection check failed. Check DATABASE_URL, network access, and database availability.",
  );
  process.exitCode = 1;
});
