import { NextResponse } from "next/server";
import { billingUser, syncCustomer } from "@/lib/billing";

export async function GET() {
  try {
    const user = await billingUser();
    if (!user)
      return NextResponse.json(
        { error: "Sign in to view billing." },
        { status: 401 },
      );
    const state = user.stripeCustomerId
      ? await syncCustomer(user.stripeCustomerId)
      : user;
    return NextResponse.json(
      {
        premium: state.role === "premium",
        hasBilling: !!user.stripeCustomerId,
      },
      { headers: { "Cache-Control": "no-store" } },
    );
  } catch {
    return NextResponse.json(
      { error: "Unable to refresh billing. Please try again." },
      { status: 503 },
    );
  }
}
