import type { Metadata } from "next";
import Link from "next/link";
import { SiteHeader, SiteFooter } from "@/components/site-chrome";
import { UnsubscribeForm } from "./unsubscribe-form";

export const metadata: Metadata = {
  title: "Unsubscribe — StopNest",
  description: "Unsubscribe from StopNest marketing emails.",
  robots: { index: false, follow: false },
};

export default function UnsubscribePage() {
  return (
    <div className="flex min-h-screen flex-col bg-[#FAFCFF] font-sans text-foreground selection:bg-blue-100">
      <SiteHeader />
      <main
        id="main"
        className="flex flex-1 items-center justify-center px-5 py-12"
      >
        <section className="w-full max-w-md rounded-2xl border border-border bg-background p-8 shadow-sm">
          <h1 className="text-2xl font-semibold tracking-tight">
            Unsubscribe from emails
          </h1>
          <p className="mt-3 text-sm leading-6 text-muted-foreground">
            Enter the email address where you receive StopNest marketing emails
            to stop receiving them.
          </p>
          <UnsubscribeForm />
          <Link
            href="/"
            className="mt-6 inline-block text-sm text-primary underline underline-offset-4"
          >
            Back to StopNest
          </Link>
        </section>
      </main>
      <SiteFooter />
    </div>
  );
}
