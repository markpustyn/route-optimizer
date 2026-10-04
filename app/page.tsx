import type { Metadata } from "next";
import Image from "next/image";
import Link from "next/link";
import {
  ArrowRight,
  Check,
  Download,
  MapPin,
  Navigation,
  Route,
  Sparkles,
} from "lucide-react";
import { ContactDialog } from "@/components/contact-dialog";
import { PREMIUM_PRICE_LABEL } from "@/lib/billing-plan";

export const metadata: Metadata = {
  title: "StopNest — Route planning, one stop at a time",
  description:
    "Plan routes with up to 8 destinations for free. Upgrade to StopNest Premium for up to 50 destinations at $10 USD per month. View driving estimates and navigate with Google Maps.",
};

const actionClass =
  "inline-flex min-h-11 items-center justify-center gap-2 rounded-lg bg-primary px-5 py-3 text-sm font-medium text-primary-foreground transition hover:bg-primary/90 focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-primary";
const sharedFeatures = [
  "Arrange stops by geographic proximity",
  "Estimated driving time and distance",
  "Optional return to your starting point",
  "Open your route in Google Maps",
  "Download your route as a text file",
];
const features = [
  {
    icon: Route,
    title: "Put your stops in order",
    description:
      "Enter a starting point and your destinations. Arrange your stops by geographic proximity, then see the driving route on the map.",
  },
  {
    icon: Navigation,
    title: "Know what’s ahead",
    description:
      "View estimated driving time and distance for your route, then open your stops in Google Maps to navigate.",
  },
  {
    icon: Download,
    title: "Take your plan with you",
    description:
      "Download your ordered stops as a text file to keep handy or share before you head out.",
  },
];

export default function Page() {
  return (
    <div className="min-h-screen bg-[#FAFCFF] font-sans text-foreground selection:bg-blue-100">
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
            <a
              href="#pricing"
              className="text-sm text-muted-foreground hover:text-foreground"
            >
              Pricing
            </a>
            <Link href="/map" className={actionClass}>
              Open map <ArrowRight aria-hidden="true" className="size-4" />
            </Link>
          </div>
        </nav>
      </header>

      <main id="main">
        <section className="mx-auto max-w-6xl px-5 pb-14 pt-14 sm:px-8 sm:pt-20">
          <div className="max-w-2xl">
            <p className="flex items-center gap-2 text-sm font-medium text-primary">
              <MapPin aria-hidden="true" className="size-4" /> A place for every
              stop
            </p>
            <h1 className="mt-5 text-4xl font-semibold leading-[1.12] tracking-tight sm:text-6xl">
              Your stops.
              <br />
              One simple plan.
            </h1>
            <p className="mt-5 max-w-xl text-base leading-7 text-muted-foreground sm:text-lg">
              From everyday errands to a full day of deliveries, put your
              destinations in order and see your route come together.
            </p>
            <div className="mt-7 flex flex-wrap items-center gap-4">
              <Link href="/map" className={actionClass}>
                Plan a route{" "}
                <ArrowRight aria-hidden="true" className="size-4" />
              </Link>
              <a
                href="#pricing"
                className="inline-flex min-h-11 items-center px-2 text-sm font-medium text-muted-foreground hover:text-foreground"
              >
                Compare plans
              </a>
            </div>
            <p className="mt-4 text-xs leading-5 text-muted-foreground">
              Start free with 8 destinations per route. Sign in with Google.
            </p>
          </div>
          <div className="mt-10 overflow-hidden rounded-2xl border border-border bg-card sm:mt-12">
            <div className="flex flex-wrap items-center justify-between gap-2 border-b border-border px-4 py-3 text-xs sm:px-5">
              <span className="flex items-center gap-2 font-medium">
                <Route aria-hidden="true" className="size-4 text-primary" />{" "}
                Your route, all in one place
              </span>
              <span className="text-muted-foreground">Plan · Arrange · Go</span>
            </div>
            <div className="relative aspect-[1830/980] overflow-hidden">
              <Image
                src="/demo.png"
                alt="StopNest planner with address inputs beside a map of a route through San Francisco"
                width={1920}
                height={1440}
                sizes="(min-width: 1152px) 1088px, (min-width: 640px) calc(100vw - 64px), calc(100vw - 40px)"
                className="absolute -left-[2.459%] -top-[23.469%] h-auto w-[104.918%] max-w-none"
                priority
              />
            </div>
          </div>
        </section>

        <section
          aria-label="Route planning features"
          className="mx-auto grid max-w-6xl gap-4 px-5 pb-16 sm:px-8 md:grid-cols-3"
        >
          {features.map(({ icon: Icon, title, description }) => (
            <article
              key={title}
              className="rounded-2xl border border-border bg-card p-6"
            >
              <Icon aria-hidden="true" className="size-5 text-primary" />
              <h2 className="mt-5 text-base font-semibold">{title}</h2>
              <p className="mt-2 text-sm leading-6 text-muted-foreground">
                {description}
              </p>
            </article>
          ))}
        </section>

        <section
          id="pricing"
          aria-labelledby="pricing-title"
          className="scroll-mt-8 border-y border-border bg-background px-5 py-16 sm:px-8 sm:py-20"
        >
          <div className="mx-auto max-w-4xl">
            <div className="max-w-xl">
              <p className="text-sm font-medium text-primary">Simple pricing</p>
              <h2
                id="pricing-title"
                className="mt-3 text-3xl font-semibold tracking-tight sm:text-4xl"
              >
                A plan for your kind of day.
              </h2>
              <p className="mt-4 text-sm leading-6 text-muted-foreground">
                Start with the essentials. Get more room for destinations when
                your route gets longer.
              </p>
            </div>
            <div className="mt-9 grid gap-5 md:grid-cols-2">
              <article
                aria-labelledby="standard-title"
                className="flex flex-col rounded-2xl border border-border bg-[#FAFCFF] p-6 sm:p-8"
              >
                <h3 id="standard-title" className="text-lg font-semibold">
                  Standard
                </h3>
                <p className="mt-2 text-sm text-muted-foreground">
                  For errands and shorter routes.
                </p>
                <p className="mt-7 text-3xl font-semibold tracking-tight">
                  $0{" "}
                  <span className="text-sm font-normal tracking-normal text-muted-foreground">
                    / month
                  </span>
                </p>
                <p className="mt-6 border-y border-border py-4 text-sm">
                  <strong className="font-semibold">
                    Up to 8 destinations
                  </strong>{" "}
                  per route
                </p>
                <ul className="my-6 flex-1 space-y-3">
                  {sharedFeatures.map((feature) => (
                    <li
                      key={feature}
                      className="flex gap-2.5 text-sm leading-5 text-muted-foreground"
                    >
                      <Check
                        aria-hidden="true"
                        className="mt-0.5 size-4 shrink-0 text-primary"
                      />
                      {feature}
                    </li>
                  ))}
                </ul>
                <Link
                  href="/map"
                  className="inline-flex min-h-11 items-center justify-center rounded-lg border border-border bg-background px-5 py-3 text-sm font-medium transition hover:bg-muted focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-primary"
                >
                  Start free
                </Link>
                <p className="mt-3 text-center text-xs text-muted-foreground">
                  No credit card required.
                </p>
              </article>
              <article
                aria-labelledby="premium-title"
                className="flex flex-col rounded-2xl border border-primary bg-card p-6 sm:p-8"
              >
                <h3
                  id="premium-title"
                  className="flex items-center gap-2 text-lg font-semibold"
                >
                  <Sparkles
                    aria-hidden="true"
                    className="size-5 text-primary"
                  />{" "}
                  Premium
                </h3>
                <p className="mt-2 text-sm text-muted-foreground">
                  For more stops and fuller days.
                </p>
                <p className="mt-7 text-3xl font-semibold tracking-tight">
                  {PREMIUM_PRICE_LABEL}
                </p>
                <p className="mt-6 border-y border-border py-4 text-sm">
                  <strong className="font-semibold text-primary">
                    Up to 50 destinations
                  </strong>{" "}
                  per route
                </p>
                <ul className="my-6 flex-1 space-y-3">
                  {sharedFeatures.map((feature) => (
                    <li
                      key={feature}
                      className="flex gap-2.5 text-sm leading-5 text-muted-foreground"
                    >
                      <Check
                        aria-hidden="true"
                        className="mt-0.5 size-4 shrink-0 text-primary"
                      />
                      {feature}
                    </li>
                  ))}
                </ul>
                <Link href="/map" className={actionClass}>
                  Open map to upgrade{" "}
                  <ArrowRight aria-hidden="true" className="size-4" />
                </Link>
                <p className="mt-3 text-center text-xs text-muted-foreground">
                  USD. Billed monthly. Cancel anytime.
                </p>
              </article>
            </div>
            <p className="mt-5 text-sm leading-6 text-muted-foreground">
              Limits apply to destinations in a single route, excluding your
              starting point. Both plans require Google sign-in. Add a ninth
              destination on Standard to see the Premium upgrade option.
            </p>
          </div>
        </section>

        {/* <section
          aria-labelledby="questions-title"
          className="mx-auto max-w-4xl px-5 py-16 sm:px-8"
        >
          <h2
            id="questions-title"
            className="text-2xl font-semibold tracking-tight"
          >
            Before you head out
          </h2>
          <div className="mt-6 divide-y divide-border">
            {[
              {
                question: "What changes with Premium?",
                answer:
                  "Premium increases your destination limit from 8 to 50 per route. Route ordering, driving estimates, text downloads, and Google Maps navigation are included in both plans.",
              },
              {
                question: "How are my stops ordered?",
                answer:
                  "StopNest arranges destinations by geographic proximity, then calculates driving time and distance for the resulting route. Estimates exclude live traffic.",
              },
              {
                question: "How do I upgrade?",
                answer:
                  "Open the map and sign in with Google. Choose Upgrade to Premium in your account menu, or add more than 8 destinations to open the upgrade prompt.",
              },
            ].map(({ question, answer }) => (
              <details key={question} className="group py-5">
                <summary className="cursor-pointer text-sm font-medium focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-primary">
                  {question}
                </summary>
                <p className="mt-3 max-w-2xl text-sm leading-6 text-muted-foreground">
                  {answer}
                </p>
              </details>
            ))}
          </div>
        </section> */}
      </main>
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
              <a
                href="#pricing"
                className="text-sm text-muted-foreground hover:text-foreground"
              >
                Pricing
              </a>
              <ContactDialog />
            </nav>
          </div>
          <p className="mt-7 border-t border-border pt-5 text-xs text-muted-foreground">
            © {new Date().getFullYear()} StopNest. All rights reserved.
          </p>
        </div>
      </footer>
    </div>
  );
}
