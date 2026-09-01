CREATE TABLE "ratings" (
	"id" serial PRIMARY KEY,
	"code_id" serial,
	"works" varchar(255),
	"comment" text,
	"created_at" varchar(255)
);
--> statement-breakpoint
ALTER TABLE "ratings" ADD CONSTRAINT "ratings_code_id_codes_id_fkey" FOREIGN KEY ("code_id") REFERENCES "codes"("id");