import { saveGoogleSignIn } from "@/lib/google-user";
import NextAuth, { type NextAuthConfig } from "next-auth";
import Google from "next-auth/providers/google";
import { checkRouteAccess } from "@/lib/route-access";

export const authConfig = {
  providers: [Google],
  session: { strategy: "jwt" },
  pages: { signIn: "/map", error: "/map" },
  callbacks: {
    jwt({ token, account }) {
      if (account?.provider === "google")
        token.googleId = account.providerAccountId;
      return token;
    },
    session({ session, token }) {
      if (session.user)
        session.user.id =
          typeof token.googleId === "string" ? token.googleId : "";
      return session;
    },
    signIn: saveGoogleSignIn,
    async authorized({ auth, request }) {
      const path = request.nextUrl.pathname;
      if (path === "/api/optimize" || path.startsWith("/api/optimize/")) {
        const denied = await checkRouteAccess(
          request,
          auth?.user,
          async (user) => {
            const { isPremiumUser } = await import("@/lib/premium");
            return isPremiumUser(user);
          },
        );
        return denied ?? true;
      }
      return true;
    },
  },
} satisfies NextAuthConfig;

export const { handlers, signIn, signOut, auth } = NextAuth(authConfig);
