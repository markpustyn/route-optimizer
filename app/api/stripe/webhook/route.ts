import { NextResponse } from "next/server";
import type Stripe from "stripe";
import { getStripe } from "@/lib/stripe";
import { stripeId } from "@/lib/billing-policy";
import { syncCustomer } from "@/lib/billing";

export const runtime = "nodejs";
const events = new Set([
  "checkout.session.completed",
  "checkout.session.async_payment_succeeded",
  "checkout.session.async_payment_failed",
  "customer.subscription.created",
  "customer.subscription.updated",
  "customer.subscription.deleted",
  "customer.subscription.paused",
  "customer.subscription.resumed",
  "invoice.paid",
  "invoice.payment_failed",
  "invoice.payment_action_required",
  "invoice.voided",
  "invoice.marked_uncollectible",
]);

export async function POST(request: Request) {
  const secret = process.env.STRIPE_WEBHOOK_SECRET;
  if (!secret)
    return NextResponse.json(
      { error: "Webhook is not configured." },
      { status: 503 },
    );
  const signature = request.headers.get("stripe-signature");
  if (!signature)
    return NextResponse.json(
      { error: "Missing Stripe signature." },
      { status: 400 },
    );
  let event: Stripe.Event;
  try {
    event = getStripe().webhooks.constructEvent(
      await request.text(),
      signature,
      secret,
    );
  } catch {
    return NextResponse.json(
      { error: "Invalid Stripe signature." },
      { status: 400 },
    );
  }
  if (!events.has(event.type)) return NextResponse.json({ received: true });
  try {
    const object = event.data.object as
      | Stripe.Subscription
      | Stripe.Invoice
      | Stripe.Checkout.Session;
    const customer = stripeId(object.customer);
    if (customer) await syncCustomer(customer);
    return NextResponse.json({ received: true });
  } catch {
    console.error("Stripe subscription synchronization failed.");
    return NextResponse.json(
      { error: "Subscription update failed. Retry this event." },
      { status: 500 },
    );
  }
}
