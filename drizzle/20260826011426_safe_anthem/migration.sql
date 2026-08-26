CREATE TABLE "codes" (
	"id" serial PRIMARY KEY NOT NULL,
	"gate_code" varchar(255),
	"street" varchar(255),
	"city" varchar(255),
	"zip_code" varchar(255),
	"state" varchar(255),
	"latitude" varchar(255),
	"longitude" varchar(255),
	"notes" text
);
