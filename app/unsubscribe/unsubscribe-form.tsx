"use client";

import { useActionState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { unsubscribe, type UnsubscribeState } from "./actions";

const initialState: UnsubscribeState = { status: "idle", message: "" };

export function UnsubscribeForm() {
  const [state, action, pending] = useActionState(unsubscribe, initialState);

  return (
    <form action={action} className="mt-6 space-y-4" aria-busy={pending}>
      {state.status !== "success" && (
        <>
          <div className="space-y-2">
            <label htmlFor="unsubscribe-email" className="text-sm font-medium">
              Email address
            </label>
            <Input
              id="unsubscribe-email"
              name="email"
              type="email"
              autoComplete="email"
              maxLength={254}
              required
              disabled={pending}
              aria-describedby={
                state.message ? "unsubscribe-message" : undefined
              }
            />
          </div>
          <Button type="submit" disabled={pending} className="w-full">
            {pending ? "Unsubscribing…" : "Unsubscribe"}
          </Button>
        </>
      )}
      <p
        id="unsubscribe-message"
        role={state.status === "error" ? "alert" : "status"}
        className={`text-sm ${state.status === "error" ? "text-destructive" : "text-muted-foreground"}`}
      >
        {state.message}
      </p>
    </form>
  );
}
