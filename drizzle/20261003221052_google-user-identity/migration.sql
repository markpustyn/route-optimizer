ALTER TABLE "user" ADD COLUMN IF NOT EXISTS "google_id" varchar(255);
--> statement-breakpoint
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint
    WHERE conrelid = 'public."user"'::regclass AND conname = 'user_google_id_key'
  ) THEN
    ALTER TABLE "user" ADD CONSTRAINT "user_google_id_key" UNIQUE("google_id");
  END IF;
END $$;
