"use client";

import { useState } from "react";
import { signIn } from "next-auth/react";
import { FcGoogle } from "react-icons/fc";
import { LoaderCircle } from "lucide-react";

export default function SignIn() {
  const [pending, setPending] = useState(false);
  const [error, setError] = useState("");
  async function continueWithGoogle() {
    if (pending) return;
    setPending(true);
    setError("");
    try {
      await signIn("google", { redirectTo: "/map" });
    } catch {
      setError("Google sign-in could not start. Please try again.");
      setPending(false);
    }
  }
  return (
    <div>
      <button
        type="button"
        onClick={continueWithGoogle}
        disabled={pending}
        aria-busy={pending}
        className="flex min-h-12 w-full items-center justify-center gap-3 rounded-lg border border-input bg-background px-4 py-3 text-sm font-medium text-foreground shadow-sm transition-colors hover:border-blue-300 hover:bg-blue-50/50 focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-primary disabled:cursor-wait disabled:opacity-70"
      >
        {pending ? (
          <LoaderCircle
            aria-hidden="true"
            className="size-5 shrink-0 animate-spin motion-reduce:animate-none"
          />
        ) : (
          <FcGoogle aria-hidden="true" className="size-5 shrink-0" />
        )}
        {pending ? "Connecting to Google…" : "Sign in with Google"}
      </button>
      {error && (
        <p
          role="alert"
          className="mt-3 rounded-lg border border-red-200 bg-red-50 p-3 text-sm text-red-700"
        >
          {error}
        </p>
      )}
    </div>
  );
}
