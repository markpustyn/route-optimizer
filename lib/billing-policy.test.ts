import assert from "node:assert/strict";
import { test } from "node:test";
import type Stripe from "stripe";
import { premiumEntitlement, stripeId } from "./billing-policy";
import { PREMIUM_PRODUCT_ID } from "./billing-plan";
const now = 1800000000000;
function subscription(overrides: Partial<Stripe.Subscription> = {}) {
  return {
    id: "sub_paid",
    created: 100,
    status: "active",
    pause_collection: null,
    latest_invoice: { status: "paid" },
    items: {
      data: [
        {
          price: { product: PREMIUM_PRODUCT_ID },
          current_period_end: now / 1000 + 3600,
        },
      ],
    },
    ...overrides,
  } as Stripe.Subscription;
}
test("paid active subscriptions grant access through their paid period, including scheduled cancellation", () => {
  for (const cancel_at_period_end of [true, false]) {
    const state = premiumEntitlement(
      [subscription({ cancel_at_period_end })],
      now,
    );
    assert.equal(state.role, "premium");
    assert.equal(state.premiumUntil?.getTime(), now + 3600000);
  }
});
test("unpaid, paused, expired and unrelated subscriptions cannot unlock Premium", () => {
  for (const status of [
    "past_due",
    "unpaid",
    "incomplete",
    "incomplete_expired",
    "canceled",
    "paused",
    "trialing",
  ] as const)
    assert.equal(
      premiumEntitlement([subscription({ status })], now).role,
      "standard",
    );
  for (const latest_invoice of [
    null,
    "in_unexpanded",
    { status: "open" },
    { status: "void" },
  ])
    assert.equal(
      premiumEntitlement(
        [
          subscription({
            latest_invoice:
              latest_invoice as Stripe.Subscription["latest_invoice"],
          }),
        ],
        now,
      ).role,
      "standard",
    );
  assert.equal(
    premiumEntitlement(
      [subscription({ pause_collection: { behavior: "void", resumes_at: null } })],
      now,
    ).role,
    "standard",
  );
  const expired = subscription();
  expired.items.data[0].current_period_end = now / 1000;
  assert.equal(premiumEntitlement([expired], now).role, "standard");
  const unrelated = subscription();
  unrelated.items.data[0].price.product = "prod_other";
  assert.equal(premiumEntitlement([unrelated], now).role, "standard");
  assert.equal(premiumEntitlement([], now).role, "standard");
});
test("newer canceled subscription does not override a paid active subscription", () => {
  const result = premiumEntitlement(
    [
      subscription({ id: "sub_canceled", status: "canceled", created: 200 }),
      subscription(),
    ],
    now,
  );
  assert.equal(result.role, "premium");
  assert.equal(result.stripeSubscriptionId, "sub_paid");
});
test("Stripe object identifiers support expanded and unexpanded references", () => {
  assert.equal(stripeId("cus_test"), "cus_test");
  assert.equal(stripeId({ id: "cus_test" }), "cus_test");
  assert.equal(stripeId(null), undefined);
});
