import { NextResponse } from "next/server";
import { billingUser, sameOrigin, syncCustomer } from "@/lib/billing";
import { getStripe } from "@/lib/stripe";
import { stripeId } from "@/lib/billing-policy";
import { PREMIUM_PRODUCT_ID } from "@/lib/billing-plan";

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
        { error: "Sign in to confirm your upgrade." },
        { status: 401 },
      );
    const { sessionId } = await request.json();
    if (
      typeof sessionId !== "string" ||
      !/^cs_[a-zA-Z0-9_]{1,250}$/.test(sessionId)
    )
      return NextResponse.json(
        { error: "Invalid checkout session." },
        { status: 400 },
      );
    const checkout = await getStripe().checkout.sessions.retrieve(sessionId);
    if (
      !user.stripeCustomerId ||
      stripeId(checkout.customer) !== user.stripeCustomerId ||
      checkout.client_reference_id !== String(user.id) ||
      checkout.metadata?.productId !== PREMIUM_PRODUCT_ID
    ) {
      return NextResponse.json(
        { error: "Checkout does not belong to this account." },
        { status: 403 },
      );
    }
    if (checkout.status !== "complete" || checkout.payment_status !== "paid")
      return NextResponse.json({ premium: false });
    const state = await syncCustomer(user.stripeCustomerId);
    return NextResponse.json({ premium: state.role === "premium" });
  } catch {
    return NextResponse.json(
      { error: "Unable to confirm your payment yet. Please try again." },
      { status: 503 },
    );
  }
}
