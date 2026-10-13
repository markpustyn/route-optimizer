import Image from "next/image";
import Link from "next/link";
import { ArrowRight } from "lucide-react";
import { ContactDialog } from "@/components/contact-dialog";

const actionClass =
  "inline-flex min-h-11 items-center justify-center gap-2 rounded-lg bg-primary px-5 py-3 text-sm font-medium text-primary-foreground transition hover:bg-primary/90 focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-primary";

export function SiteHeader() {
  return (
    <>
      <a
        href="#main"
        className="sr-only z-50 rounded-lg bg-background p-4 focus:not-sr-only focus:fixed focus:left-4 focus:top-4"
      >
        Skip to content
      </a>
      <header className="border-b border-border bg-background">
        <nav
          aria-label="Main navigation"
          className="mx-auto flex max-w-6xl flex-wrap items-center justify-between gap-4 px-5 py-4 sm:px-8"
        >
          <Link
            href="/"
            aria-label="StopNest home"
            className="inline-flex items-center gap-2 rounded-lg text-lg font-semibold tracking-tight focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-primary"
          >
            <Image
              src="/logo.svg"
              alt=""
              width={36}
              height={36}
              className="size-9 shrink-0"
            />
            <span>StopNest</span>
          </Link>
          <div className="flex items-center gap-4 sm:gap-7">
            <Link
              href="/#pricing"
              className="text-sm text-muted-foreground hover:text-foreground"
            >
              Pricing
            </Link>
            <Link href="/map" className={actionClass}>
              Open map <ArrowRight aria-hidden="true" className="size-4" />
            </Link>
          </div>
        </nav>
      </header>
    </>
  );
}

export function SiteFooter() {
  return (
    <footer className="border-t border-border bg-background px-5 py-8 sm:px-8">
      <div className="mx-auto max-w-6xl">
        <div className="flex flex-col justify-between gap-7 sm:flex-row sm:items-center">
          <div>
            <Link
              href="/"
              aria-label="StopNest home"
              className="inline-flex items-center gap-2 rounded-lg text-lg font-semibold tracking-tight focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-primary"
            >
              <Image
                src="/logo.svg"
                alt=""
                width={32}
                height={32}
                className="size-8 shrink-0"
              />
              <span>StopNest</span>
            </Link>
            <p className="mt-3 text-sm text-muted-foreground">
              Your stops. One simple plan.
            </p>
          </div>
          <nav
            aria-label="Footer navigation"
            className="flex flex-wrap items-center gap-6"
          >
            <Link
              href="/map"
              className="text-sm text-muted-foreground hover:text-foreground"
            >
              Route planner
            </Link>
            <Link
              href="/#pricing"
              className="text-sm text-muted-foreground hover:text-foreground"
            >
              Pricing
            </Link>
            <ContactDialog />
            <Link
              href="/unsubscribe"
              className="text-sm text-muted-foreground hover:text-foreground"
            >
              Unsubscribe
            </Link>
          </nav>
        </div>
        <p className="mt-7 border-t border-border pt-5 text-xs text-muted-foreground">
          © {new Date().getFullYear()} StopNest. All rights reserved.
        </p>
      </div>
    </footer>
  );
}
