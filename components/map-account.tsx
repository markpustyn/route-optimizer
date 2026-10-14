"use client";

import { createContext, useContext, Suspense, useState } from "react";
import type { Session } from "next-auth";
import { SessionProvider, signOut, useSession } from "next-auth/react";
import { useSearchParams } from "next/navigation";
import { LogOut, Sparkles, UserRound } from "lucide-react";
import { usePremium } from "@/components/premium-provider";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import {
  Popover,
  PopoverContent,
  PopoverTitle,
  PopoverTrigger,
} from "@/components/ui/popover";
import SignIn from "@/components/google-sign-in";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";

const MapSignInContext = createContext({ requestSignIn: () => {} });
export const useMapSignIn = () => useContext(MapSignInContext);

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
  const { data: session } = useSession();
  const user = session?.user;
  const [signInOpen, setSignInOpen] = useState(false);
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
      <MapSignInContext.Provider
        value={{ requestSignIn: () => setSignInOpen(true) }}
      >
        {children}
      </MapSignInContext.Provider>
      <Dialog open={signInOpen} onOpenChange={setSignInOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Sign in to optimize your route</DialogTitle>
            <DialogDescription>
              Continue with Google to optimize your stops. Your first sign-in
              creates your account.
            </DialogDescription>
          </DialogHeader>
          <SignIn />
          <p className="text-xs text-muted-foreground">
            Your stops will be here when you return. Click Optimize to continue.
          </p>
        </DialogContent>
      </Dialog>
      <div className="fixed top-5 left-5 z-40 max-w-sm rounded-lg bg-background px-4">
        <Suspense>
          <SignInError />
        </Suspense>
      </div>
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
