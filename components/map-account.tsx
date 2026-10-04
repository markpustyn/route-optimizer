"use client";

import { Suspense, useState } from "react";
import type { Session } from "next-auth";
import { SessionProvider, signOut, useSession } from "next-auth/react";
import { useSearchParams } from "next/navigation";
import {
  LoaderCircle,
  LogOut,
  Route,
  Sparkles,
  UserRound,
} from "lucide-react";
import { usePremium } from "@/components/premium-provider";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import {
  Popover,
  PopoverContent,
  PopoverTitle,
  PopoverTrigger,
} from "@/components/ui/popover";
import SignIn from "@/components/google-sign-in";

function SignInError() {
  const params = useSearchParams();
  const error = params.get("error");
  if (!error) return null;
  return (
    <p role="alert" className="mt-3 text-sm text-red-700">
      {error === "UserSaveFailed"
        ? "We couldn't save your account. Please try signing in again."
        : "Sign-in wasn't completed. Please try again."}
    </p>
  );
}

function AccountOverlay({ children }: { children: React.ReactNode }) {
  const { data: session, status } = useSession();
  const user = session?.user;
  const { premium, showUpgrade } = usePremium();
  const [pending, setPending] = useState(false);
  const [error, setError] = useState("");
  const initials = user?.name
    ?.trim()
    .split(/\s+/)
    .slice(0, 2)
    .map((part) => part[0])
    .join("")
    .toUpperCase();

  async function logout() {
    setPending(true);
    setError("");
    try {
      await signOut({ redirectTo: "/map" });
    } catch {
      setPending(false);
      setError("Couldn't sign out. Please try again.");
    }
  }

  return (
    <div className="relative isolate h-dvh overflow-hidden">
      <div inert={!user} aria-hidden={!user ? true : undefined}>
        {children}
      </div>
      {!user && (
        <div className="fixed inset-0 z-30 grid place-items-center overflow-y-auto bg-slate-950/15 px-5 py-20 backdrop-blur-sm">
          <section
            aria-labelledby="map-sign-in-title"
            aria-describedby="map-sign-in-description"
            className="w-full max-w-sm rounded-xl bg-popover p-6 text-popover-foreground shadow-xl shadow-slate-900/10 ring-1 ring-foreground/10"
          >
            <div className="mb-5 flex size-11 items-center justify-center rounded-xl bg-blue-50 text-blue-600">
              <Route aria-hidden="true" className="size-5" />
            </div>
            <h1
              id="map-sign-in-title"
              className="text-xl font-semibold tracking-tight"
            >
              Your next route starts here
            </h1>
            <p
              id="map-sign-in-description"
              className="my-2 text-sm leading-6 text-muted-foreground"
            >
              Sign in with Google to add your stops, plan your route, and get
              going.
            </p>
            {status === "loading" ? (
              <p
                role="status"
                className="flex min-h-12 items-center justify-center gap-2 rounded-lg border border-border text-sm text-muted-foreground"
              >
                <LoaderCircle
                  aria-hidden="true"
                  className="size-4 animate-spin motion-reduce:animate-none"
                />
                Checking sign-in…
              </p>
            ) : (
              <SignIn />
            )}
            <Suspense>
              <SignInError />
            </Suspense>
            <p className="mt-4 text-center text-xs leading-5 text-muted-foreground">
              New here? Your first sign-in creates your account.
              <br />
              No credit card required.
            </p>
          </section>
        </div>
      )}
      <div className="fixed bottom-5 left-5 z-40 ">
        <Popover>
          <div>
            <PopoverTrigger
              aria-label={user ? "Account menu" : "Sign in with Google"}
              className="flex max-w-[calc(100vw-2.5rem)] items-center gap-3 rounded-sm p-0.5 text-left outline-none focus-visible:ring-2 focus-visible:ring-blue-600 focus-visible:ring-offset-2"
            >
              <Avatar className="size-11 cursor-pointer">
                {user?.image && (
                  <AvatarImage
                    src={user.image}
                    alt=""
                    referrerPolicy="no-referrer"
                  />
                )}
                <AvatarFallback className="bg-[#FAFCFF]   text-sm text-slate-700">
                  {initials || (
                    <UserRound aria-hidden="true" className="size-5" />
                  )}
                </AvatarFallback>
              </Avatar>
              {user?.name && (
                <span className="min-w-0 max-w-48 truncate pr-3 text-sm font-medium leading-tight cursor-pointer">
                  {user.name}
                </span>
              )}
            </PopoverTrigger>
            <PopoverContent
              side="top"
              align="start"
              sideOffset={12}
              className="w-64 max-w-[calc(100vw-2.5rem)] p-3"
            >
              <PopoverTitle className="truncate">
                {user?.name || (user ? "Your account" : "Sign in")}
              </PopoverTitle>
              {user ? (
                <>
                  {user.email && (
                    <p className="truncate text-xs text-muted-foreground">
                      {user.email}
                    </p>
                  )}
                  <button
                    type="button"
                    disabled={pending}
                    onClick={logout}
                    className="mt-2 flex min-h-10 w-full items-center px-2 text-sm hover:bg-muted disabled:opacity-60"
                  >
                    <LogOut aria-hidden="true" className="size-4 mr-2" />
                    {pending ? "Signing out…" : "Sign out"}
                  </button>
                  {premium || (
                    <button
                      type="button"
                      disabled={pending}
                      onClick={showUpgrade}
                      className="flex min-h-10 w-full items-center px-2 text-sm hover:bg-muted disabled:opacity-60"
                    >
                      <Sparkles aria-hidden="true" className="size-4 mr-2" />
                      Upgrade
                    </button>
                  )}
                  {error && (
                    <p role="alert" className="text-xs text-red-700">
                      {error}
                    </p>
                  )}
                </>
              ) : (
                <SignIn />
              )}
            </PopoverContent>
          </div>
        </Popover>
      </div>
    </div>
  );
}

export default function MapAccount({
  session,
  children,
}: {
  session: Session | null;
  children: React.ReactNode;
}) {
  return (
    <SessionProvider session={session}>
      <AccountOverlay>{children}</AccountOverlay>
    </SessionProvider>
  );
}
