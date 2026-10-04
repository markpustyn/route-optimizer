import type { NextAuthConfig } from "next-auth";

export const saveGoogleSignIn: NonNullable<
  NonNullable<NextAuthConfig["callbacks"]>["signIn"]
> = async ({ account, profile, user }) => {
  if (
    account?.provider !== "google" ||
    !account.providerAccountId ||
    profile?.email_verified !== true ||
    !user.email
  )
    return false;

  try {
    const { db } = await import("@/db/client");
    const { users } = await import("@/drizzle/schema");
    const details = {
      name: user.name ?? null,
      email: user.email,
      image: user.image ?? null,
    };
    await db
      .insert(users)
      .values({
        googleId: account.providerAccountId,
        ...details,
      })
      .onConflictDoUpdate({
        target: users.googleId,
        set: details,
      });
    return true;
  } catch {
    // Avoid logging Google profiles, tokens, or database connection details.
    console.error("Unable to save the Google sign-in user.");
    return "/map?error=UserSaveFailed";
  }
};
