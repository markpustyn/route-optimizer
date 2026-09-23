import { pgTable, serial, text, varchar } from "drizzle-orm/pg-core";

export const codes = pgTable("codes", {
  id: serial("id").primaryKey(),
  gateCode: varchar("gate_code", { length: 255 }),
  street: varchar("street", { length: 255 }),
  city: varchar("city", { length: 255 }),
  zipCode: varchar("zip_code", { length: 255 }),
  state: varchar("state", { length: 255 }),
  latitude: varchar("latitude", { length: 255 }),
  longitude: varchar("longitude", { length: 255 }),
  notes: text("notes"),
});

export const ratings = pgTable("ratings", {
  id: serial("id").primaryKey(),
  codeId: serial("code_id").references(() => codes.id),
  works: varchar("works", { length: 255 }),
  comment: text("comment"),
  createdAt: varchar("created_at", { length: 255 }),
});
