ALTER TABLE "user" ADD COLUMN IF NOT EXISTS "role" varchar(50) DEFAULT 'standard';
--> statement-breakpoint
ALTER TABLE "user" ADD COLUMN IF NOT EXISTS "stripe_customer_id" varchar(255);
--> statement-breakpoint
ALTER TABLE "user" ADD COLUMN IF NOT EXISTS "stripe_subscription_id" varchar(255);
--> statement-breakpoint
ALTER TABLE "user" ADD COLUMN IF NOT EXISTS "stripe_subscription_status" varchar(50);
--> statement-breakpoint
ALTER TABLE "user" ADD COLUMN IF NOT EXISTS "premium_until" timestamp with time zone;
--> statement-breakpoint
ALTER TABLE "user" ADD COLUMN IF NOT EXISTS "stripe_synced_at" timestamp with time zone;
--> statement-breakpoint
DO $billing$
BEGIN
 IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conrelid = 'public."user"'::regclass AND conname = 'user_stripe_customer_id_key') THEN
  ALTER TABLE "user" ADD CONSTRAINT "user_stripe_customer_id_key" UNIQUE("stripe_customer_id");
 END IF;
END $billing$;
