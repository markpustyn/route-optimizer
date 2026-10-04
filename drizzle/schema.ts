import { pgTable, serial, text, timestamp, varchar } from "drizzle-orm/pg-core";
import { sql } from "drizzle-orm";

export const users = pgTable("user", {
  id: serial("id").primaryKey(),
  googleId: varchar("google_id", { length: 255 }).unique(),
  name: varchar("name", { length: 256 }),
  email: varchar("email", { length: 256 }).notNull(),
  image: text("image"),
  createdAt: text("created_at").default(sql`now()`),
  role: varchar("role", { length: 50 }).default("standard"),
  savedAddress: text("saved_address"),
  stripeCustomerId: varchar("stripe_customer_id", { length: 255 }).unique(),
  stripeSubscriptionId: varchar("stripe_subscription_id", { length: 255 }),
  stripeSubscriptionStatus: varchar("stripe_subscription_status", {
    length: 50,
  }),
  premiumUntil: timestamp("premium_until", { withTimezone: true }),
  stripeSyncedAt: timestamp("stripe_synced_at", { withTimezone: true }),
});
