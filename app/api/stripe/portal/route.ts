import { NextResponse } from "next/server";
import { appOrigin, billingUser, sameOrigin } from "@/lib/billing";
import { getStripe } from "@/lib/stripe";

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
        { error: "Sign in to manage billing." },
        { status: 401 },
      );
    if (!user.stripeCustomerId)
      return NextResponse.json(
        { error: "There is no billing account yet." },
        { status: 404 },
      );
    const portal = await getStripe().billingPortal.sessions.create({
      customer: user.stripeCustomerId,
      configuration: process.env.STRIPE_PORTAL_CONFIGURATION_ID,
      return_url: `${appOrigin(request)}/map?billing=return`,
    });
    return NextResponse.json({ url: portal.url });
  } catch {
    return NextResponse.json(
      { error: "Billing management is unavailable. Please try again." },
      { status: 503 },
    );
  }
}
