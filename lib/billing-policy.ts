import type Stripe from "stripe";
import { PREMIUM_PRODUCT_ID } from "./billing-plan";

export function stripeId(value: string | { id: string } | null | undefined) {
  return typeof value === "string" ? value : value?.id;
}

// Only an active subscription with a paid invoice grants access. A scheduled
// cancellation keeps access through the paid period; past-due access is revoked.
export function premiumEntitlement(
  subscriptions: Stripe.Subscription[],
  now = Date.now(),
) {
  const relevant = subscriptions.filter((subscription) =>
    subscription.items.data.some(
      (item) => stripeId(item.price.product) === PREMIUM_PRODUCT_ID,
    ),
  );
  const paid = relevant.filter((subscription) => {
    const invoice = subscription.latest_invoice;
    return (
      subscription.status === "active" &&
      !subscription.pause_collection &&
      typeof invoice === "object" &&
      invoice?.status === "paid" &&
      subscription.items.data.some(
        (item) =>
          stripeId(item.price.product) === PREMIUM_PRODUCT_ID &&
          item.current_period_end * 1000 > now,
      )
    );
  });
  paid.sort((a, b) => periodEnd(b) - periodEnd(a));
  const selected = paid[0] ?? relevant.sort((a, b) => b.created - a.created)[0];
  return {
    role: paid.length ? "premium" : "standard",
    stripeSubscriptionId: selected?.id ?? null,
    stripeSubscriptionStatus: selected?.status ?? null,
    premiumUntil: paid.length ? new Date(periodEnd(paid[0]) * 1000) : null,
  };
}

function periodEnd(subscription: Stripe.Subscription) {
  return Math.max(
    0,
    ...subscription.items.data
      .filter((item) => stripeId(item.price.product) === PREMIUM_PRODUCT_ID)
      .map((item) => item.current_period_end),
  );
}
