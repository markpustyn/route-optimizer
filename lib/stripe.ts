import "server-only";
import Stripe from "stripe";

let client: Stripe | undefined;
export function getStripe() {
  const key = process.env.STRIPE_SECRET_KEY;
  if (!key) throw new Error("STRIPE_SECRET_KEY is required.");
  return (client ??= new Stripe(key, { maxNetworkRetries: 2, timeout: 15000 }));
}
