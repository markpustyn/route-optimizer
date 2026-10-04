"use client";

import {
  createContext,
  Suspense,
  useCallback,
  useContext,
  useEffect,
  useState,
} from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { Sparkles } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogClose,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { PREMIUM_PRICE_LABEL } from "@/lib/billing-plan";

const PremiumContext = createContext({
  premium: false,
  showUpgrade: () => {},
  manageBilling: () => {},
});
export const usePremium = () => useContext(PremiumContext);

function BillingReturn({ onStatus }: { onStatus: (message: string) => void }) {
  const params = useSearchParams();
  const router = useRouter();
  const sessionId = params.get("session_id");
  const checkout = params.get("checkout");
  const billing = params.get("billing");
  const [attempt, setAttempt] = useState(0);
  const [retry, setRetry] = useState(false);
  useEffect(() => {
    if (checkout === "canceled") {
      onStatus("Checkout canceled. You haven't been upgraded.");
      router.replace("/map");
      return;
    }
    if (!(checkout === "success" && sessionId) && billing !== "return") return;
    let active = true;
    const controller = new AbortController();
    async function confirm() {
      onStatus("Checking your subscription…");
      try {
        const response = await fetch(
          billing === "return" ? "/api/stripe/status" : "/api/stripe/confirm",
          {
            method: billing === "return" ? "GET" : "POST",
            headers: { "Content-Type": "application/json" },
            ...(billing === "return"
              ? {}
              : { body: JSON.stringify({ sessionId }) }),
            signal: controller.signal,
          },
        );
        const result = await response.json();
        if (!response.ok)
          throw new Error(result.error || "Unable to check payment.");
        if (!active) return;
        if (result.premium || billing === "return") {
          onStatus(
            result.premium
              ? "Premium is active. You can now add up to 50 destinations."
              : "Your billing status has been updated.",
          );
          setRetry(false);
          router.replace("/map");
          router.refresh();
        } else {
          onStatus(
            "Your payment is still processing. Check again in a moment.",
          );
          setRetry(true);
        }
      } catch (error) {
        if (!active) return;
        onStatus(
          error instanceof Error
            ? error.message
            : "Unable to verify payment yet.",
        );
        setRetry(true);
      }
    }
    void confirm();
    return () => {
      active = false;
      controller.abort();
    };
  }, [attempt, billing, checkout, onStatus, router, sessionId]);
  return retry ? (
    <button
      type="button"
      className="mt-2 underline"
      onClick={() => {
        setRetry(false);
        setAttempt((value) => value + 1);
      }}
    >
      Check payment again
    </button>
  ) : null;
}

export default function PremiumProvider({
  premium,
  children,
}: {
  premium: boolean;
  children: React.ReactNode;
}) {
  const [open, setOpen] = useState(false);
  const [pending, setPending] = useState(false);
  const [error, setError] = useState("");
  const [message, setMessage] = useState("");
  const onStatus = useCallback((text: string) => setMessage(text), []);

  async function redirectToBilling(endpoint: "checkout" | "portal") {
    if (pending) return;
    setPending(true);
    setError("");
    try {
      const response = await fetch(`/api/stripe/${endpoint}`, {
        method: "POST",
      });
      const result = await response.json();
      if (!response.ok)
        throw new Error(result.error || "Billing is unavailable.");
      const url = new URL(result.url);
      const allowed =
        endpoint === "checkout" ? "checkout.stripe.com" : "billing.stripe.com";
      if (url.protocol !== "https:" || url.hostname !== allowed)
        throw new Error("Invalid billing destination.");
      window.location.assign(url.href);
    } catch (failure) {
      const text =
        failure instanceof Error ? failure.message : "Unable to open billing.";
      setError(text);
      setMessage(text);
      setPending(false);
    }
  }

  return (
    <PremiumContext.Provider
      value={{
        premium,
        showUpgrade: () => {
          setError("");
          setOpen(true);
        },
        manageBilling: () => {
          void redirectToBilling("portal");
        },
      }}
    >
      {children}
      <div
        className={`fixed right-4 top-4 z-50 max-w-sm rounded-lg bg-white p-4 text-sm shadow-lg ${message ? "" : "hidden"}`}
        role="status"
      >
        {message}
        <Suspense>
          <BillingReturn onStatus={onStatus} />
        </Suspense>
        {message && (
          <button
            type="button"
            onClick={() => setMessage("")}
            className="ml-3 text-xs underline"
          >
            Dismiss
          </button>
        )}
      </div>
      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="max-h-[90dvh] overflow-y-auto p-6">
          <div className="flex size-11 items-center justify-center rounded-xl bg-blue-50 text-blue-600">
            <Sparkles aria-hidden="true" className="size-5" />
          </div>
          <DialogHeader>
            <DialogTitle className="text-xl">
              {premium ? "Your Premium plan" : "Upgrade to Premium"}
            </DialogTitle>
            <DialogDescription>
              Plan routes with up to 50 destinations, view estimated driving
              times and distances, and navigate with Google Maps.
            </DialogDescription>
          </DialogHeader>
          <p className="text-2xl font-semibold">{PREMIUM_PRICE_LABEL}</p>
          <p className="text-xs text-muted-foreground">
            Billed monthly. Cancel anytime through Manage billing.
          </p>
          <Button
            disabled={pending}
            onClick={() =>
              void redirectToBilling(premium ? "portal" : "checkout")
            }
            className="mt-2 w-full"
          >
            {pending
              ? "Loading…"
              : premium
                ? "Manage subscription"
                : "Upgrade to Premium"}
          </Button>
          {error && (
            <p role="alert" className="text-sm text-red-700">
              {error}
            </p>
          )}
          <DialogClose
            render={
              <Button variant="outline" disabled={pending} className="w-full" />
            }
          >
            Not now
          </DialogClose>
        </DialogContent>
      </Dialog>
    </PremiumContext.Provider>
  );
}
