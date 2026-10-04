import "server-only";
import { and, eq, isNull, lte, or } from "drizzle-orm";
import { auth } from "@/auth";
import { db } from "@/db/client";
import { users } from "@/drizzle/schema";
import { getStripe } from "@/lib/stripe";
import { premiumEntitlement } from "@/lib/billing-policy";
import { PREMIUM_PRICE_ID, PREMIUM_PRODUCT_ID } from "@/lib/billing-plan";

export async function billingUser() {
  const session = await auth();
  if (!session?.user?.id) return null;
  const [user] = await db
    .select()
    .from(users)
    .where(eq(users.googleId, session.user.id))
    .limit(1);
  return user ?? null;
}

export function appOrigin(request: Request) {
  const configured = process.env.APP_URL || process.env.AUTH_URL;
  const url = new URL(configured || request.url);
  if (
    url.protocol !== "https:" &&
    !["localhost", "127.0.0.1"].includes(url.hostname)
  )
    throw new Error("Use HTTPS for billing redirects.");
  return url.origin;
}

export function sameOrigin(request: Request) {
  return request.headers.get("origin") === appOrigin(request);
}

export async function premiumPrice() {
  const price = await getStripe().prices.retrieve(PREMIUM_PRICE_ID);
  if (
    !price.active ||
    price.product !== PREMIUM_PRODUCT_ID ||
    price.type !== "recurring" ||
    price.unit_amount !== 1000 ||
    price.currency !== "usd" ||
    price.recurring?.interval !== "month" ||
    price.recurring.interval_count !== 1
  ) {
    throw new Error(
      "Premium price configuration does not match the displayed plan.",
    );
  }
  return price;
}

export async function customerFor(user: typeof users.$inferSelect) {
  if (user.stripeCustomerId) return user.stripeCustomerId;
  const customer = await getStripe().customers.create(
    {
      email: user.email,
      name: user.name ?? undefined,
      metadata: { userId: String(user.id) },
    },
    { idempotencyKey: `stopnest-customer-${user.id}` },
  );
  await db
    .update(users)
    .set({ stripeCustomerId: customer.id })
    .where(and(eq(users.id, user.id), isNull(users.stripeCustomerId)));
  const [current] = await db
    .select({ customer: users.stripeCustomerId })
    .from(users)
    .where(eq(users.id, user.id));
  if (!current?.customer) throw new Error("Customer could not be linked.");
  return current.customer;
}

export async function syncCustomer(customer: string) {
  const started = new Date();
  const subscriptions = await getStripe()
    .subscriptions.list({
      customer,
      status: "all",
      limit: 100,
      expand: ["data.latest_invoice"],
    })
    .autoPagingToArray({ limit: 1000 });
  const entitlement = premiumEntitlement(subscriptions);
  await db
    .update(users)
    .set({ ...entitlement, stripeSyncedAt: started })
    .where(
      and(
        eq(users.stripeCustomerId, customer),
        or(isNull(users.stripeSyncedAt), lte(users.stripeSyncedAt, started)),
      ),
    );
  return entitlement;
}
