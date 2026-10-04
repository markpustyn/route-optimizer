CREATE TABLE "user" (
	"id" serial PRIMARY KEY,
	"name" varchar(256),
	"email" varchar(256) NOT NULL,
	"image" text,
	"created_at" text DEFAULT now(),
	"saved_address" text
);
