import { NextResponse } from "next/server";
import {
  appOrigin,
  billingUser,
  customerFor,
  premiumPrice,
  sameOrigin,
  syncCustomer,
} from "@/lib/billing";
import { getStripe } from "@/lib/stripe";
import { PREMIUM_PRICE_ID, PREMIUM_PRODUCT_ID } from "@/lib/billing-plan";

export async function POST(request: Request) {
  try {
    if (!sameOrigin(request))
      return NextResponse.json(
        { error: "Invalid request origin." },
        { status: 403 },
      );
    const user = await billingUser();
    if (!user)
      return NextResponse.json(
        { error: "Sign in before upgrading." },
        { status: 401 },
      );
    if (user.role === "premium" && !user.stripeCustomerId)
      return NextResponse.json(
        { error: "Your account already has Premium." },
        { status: 409 },
      );
    await premiumPrice();
    const customer = await customerFor(user);
    const entitlement = await syncCustomer(customer);
    if (entitlement.role === "premium")
      return NextResponse.json(
        {
          error:
            "Premium is already active. Refresh the map or manage your subscription.",
        },
        { status: 409 },
      );
    // Unpaid/past-due subscriptions must be repaired instead of billed twice.
    if (
      entitlement.stripeSubscriptionStatus &&
      !["canceled", "incomplete_expired"].includes(
        entitlement.stripeSubscriptionStatus,
      )
    ) {
      return NextResponse.json(
        {
          error:
            "An existing subscription needs attention. Use Manage billing in your account menu.",
        },
        { status: 409 },
      );
    }
    const stripe = getStripe();
    const existing = await stripe.checkout.sessions.list({
      customer,
      status: "open",
      limit: 100,
    });
    const reusable = existing.data.find(
      (item) =>
        item.metadata?.productId === PREMIUM_PRODUCT_ID &&
        item.client_reference_id === String(user.id),
    );
    if (reusable?.url) return NextResponse.json({ url: reusable.url });
    const origin = appOrigin(request);
    const window = Math.floor(Date.now() / 1800000);
    const checkout = await stripe.checkout.sessions.create(
      {
        mode: "subscription",
        customer,
        client_reference_id: String(user.id),
        line_items: [{ price: PREMIUM_PRICE_ID, quantity: 1 }],
        metadata: { userId: String(user.id), productId: PREMIUM_PRODUCT_ID },
        subscription_data: {
          metadata: { userId: String(user.id), productId: PREMIUM_PRODUCT_ID },
        },
        success_url: `${origin}/map?checkout=success&session_id={CHECKOUT_SESSION_ID}`,
        cancel_url: `${origin}/map?checkout=canceled`,
        expires_at: (window + 2) * 1800,
      },
      { idempotencyKey: `stopnest-checkout-${user.id}-${window}` },
    );
    if (!checkout.url) throw new Error("Missing checkout URL");
    return NextResponse.json({ url: checkout.url });
  } catch {
    console.error("Stripe checkout could not be started.");
    return NextResponse.json(
      { error: "Checkout is unavailable. Please try again." },
      { status: 503 },
    );
  }
}
