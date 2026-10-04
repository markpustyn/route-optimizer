import { db } from "@/db/client";
import { users } from "@/drizzle/schema";
import { eq } from "drizzle-orm";

// Pass the user from a verified server session, never from request input.
export async function isPremiumUser(
  user: { email?: string | null } | null | undefined,
): Promise<boolean> {
  if (!user?.email) return false;

  try {
    const [userRecord] = await db
      .select({
        role: users.role,
        customer: users.stripeCustomerId,
        until: users.premiumUntil,
      })
      .from(users)
      .where(eq(users.email, user.email))
      .limit(1);

    return (
      userRecord?.role === "premium" &&
      (!userRecord.customer ||
        (!!userRecord.until && userRecord.until.getTime() > Date.now()))
    );
  } catch {
    console.error("Unable to check premium status.");
    return false;
  }
}
