import type { Metadata } from "next";
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
import Image from "next/image";
import { ContactDialog } from "@/components/contact-dialog";
export const metadata: Metadata = {
  title: "StopNest.com — Route Planner",
  description:
    "Plan your stops, optimize your route, and get going. StopNest is completely free. Download your optimized route or open it in Google Maps.",
};

const features = [
  {
    icon: Route,
    title: "A better order for every stop",
    description:
      "Add up to 24 destinations and let StopNest organize your journey. Less planning, more getting things done.",
    label: "PLAN SMARTER",
  },
  {
    icon: Download,
    title: "Your route, ready to download",
    description:
      "Save your optimized list of stops as a text file. Keep it handy, share it, or bring it along for the day.",
    label: "TAKE IT WITH YOU",
  },
  {
    icon: Navigation,
    title: "Go with Google Maps",
    description:
      "Open your optimized stops in Google Maps and navigate with the app you already know.",
    label: "READY TO ROLL",
  },
];

const steps = [
  {
    title: "Drop in your stops",
    description:
      "Choose your starting point and add the places you need to go.",
  },
  {
    title: "Find a smarter route",
    description:
      "Optimize your stops and choose whether to finish back where you started.",
  },
  {
    title: "Take it on the road",
    description:
      "Download your route or open your stops in Google Maps. You're all set.",
  },
];

const buttonClass =
  "inline-flex min-h-12 items-center justify-center gap-2 rounded-full bg-blue-600 px-6 py-3 text-sm font-semibold text-white shadow-lg shadow-blue-600/15 transition hover:bg-blue-700 focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-blue-600";

export default function Page() {
  return (
    <div className="bg-white text-slate-950 selection:bg-blue-100 selection:text-blue-900">
      <a
        href="#main"
        className="sr-only z-50 rounded-md bg-white p-4 focus:not-sr-only focus:fixed focus:left-4 focus:top-4"
      >
        Skip to content
      </a>
      <header className="border-b border-slate-100">
        <nav
          aria-label="Main navigation"
          className="mx-auto flex max-w-7xl items-center justify-between gap-4 px-6 py-5 lg:px-10"
        >
          <Link
            href="/"
            aria-label="StopNest.com home"
            className="flex items-center gap-2.5 text-2xl font-bold tracking-tight"
          >
            <div className="flex size-9 items-center justify-center text-white">
              <MapPin aria-hidden="true" className="size-8" color="#2563eb" />
            </div>
            <span>StopNest.com</span>
          </Link>
          <Link
            href="/map"
            className="inline-flex min-h-11 items-center gap-2 rounded-full bg-slate-950 px-4 text-sm font-semibold text-white transition hover:bg-blue-600 sm:px-5"
          >
            Open Map <ArrowRight aria-hidden="true" className="size-4" />
          </Link>
        </nav>
      </header>

      <main id="main">
        <section className="relative mx-auto w-full max-w-7xl overflow-hidden px-6 pb-16 pt-16 sm:pt-24 lg:px-10 lg:pb-20">
          <div className="relative mx-auto max-w-7xl">
            <div className="max-w-3xl">
              <span className="inline-flex items-center gap-2 rounded-full border border-blue-100 bg-blue-50 px-3.5 py-2 text-xs font-semibold text-blue-600">
                <span className="size-1.5 rounded-full bg-blue-600" />A little
                less planning. A lot more going.
              </span>

              <h1 className="mt-7 text-5xl font-semibold leading-[1.08] tracking-[-0.055em] sm:text-6xl lg:text-7xl">
                Google Maps
                <br />
                Route <span className="text-blue-600">Planner</span>
              </h1>

              <p className="mt-6 max-w-2xl text-lg leading-8 text-slate-600">
                Simplify your route planning in seconds. Add your destinations,
                explore 24 optimized routes, and choose the best way to get
                where you need to go.
              </p>

              <div className="mt-8">
                <Link href="/map" className={buttonClass}>
                  Plan my route
                  <ArrowRight aria-hidden="true" className="size-4" />
                </Link>
              </div>

              <p className="mt-4 flex items-center gap-2 text-xs text-slate-500">
                <Check aria-hidden="true" className="size-4 text-blue-600" />
                Completely free. No subscription. No credit card.
              </p>
            </div>
            <div className="relative mx-auto mt-10 aspect-[1830/980] w-full overflow-hidden rounded-lg border border-slate-200 bg-white shadow-2xl shadow-slate-200/60 sm:mt-14 sm:rounded-xl">
              {/* Frame the screenshot inside the original transparent padding. */}
              <Image
                src="/demo.png"
                alt="StopNest route planner showing optimized stops and a driving route in San Francisco"
                width={1920}
                height={1440}
                sizes="(min-width: 1280px) 1260px, (min-width: 1024px) calc((100vw - 80px) * 1.05), calc((100vw - 48px) * 1.05)"
                className="absolute -left-[2.459%] -top-[23.469%] block h-auto w-[104.918%] max-w-none"
              />
            </div>
            <div className="mt-7 flex flex-wrap justify-center gap-x-10 gap-y-4 text-xs font-medium text-slate-500 sm:text-sm">
              {[
                "Up to 24 destinations",
                "Download your route",
                "Open in Google Maps",
                "Always free to use",
              ].map((item) => (
                <span key={item} className="inline-flex items-center gap-2">
                  <Check aria-hidden="true" className="size-4 text-blue-600" />
                  {item}
                </span>
              ))}
            </div>
          </div>
        </section>

        <section
          id="features"
          className="scroll-mt-8 border-y border-slate-100 bg-slate-50/70 px-6 py-20 lg:px-10 lg:py-24"
        >
          <div className="mx-auto max-w-7xl">
            <p className="text-xs font-semibold tracking-[0.18em] text-blue-600">
              LESS BUSYWORK. MORE OPEN ROAD.
            </p>
            <div className="mt-4 flex flex-col justify-between gap-5 md:flex-row md:items-end">
              <h2 className="max-w-lg text-3xl font-semibold tracking-tight sm:text-4xl">
                Everything you need.
                <br />
                Right along the way.
              </h2>
            </div>
            <div className="mt-10 grid gap-5 md:grid-cols-3">
              {features.map(({ icon: Icon, title, description, label }) => (
                <article
                  key={title}
                  className="rounded-2xl border border-slate-200/80 bg-white p-7 lg:p-8"
                >
                  <span className="flex size-12 items-center justify-center rounded-xl bg-blue-50 text-blue-600">
                    <Icon aria-hidden="true" className="size-6" />
                  </span>
                  <p className="mt-8 text-[10px] font-semibold tracking-[0.16em] text-slate-400">
                    {label}
                  </p>
                  <h3 className="mt-3 text-xl font-semibold tracking-tight">
                    {title}
                  </h3>
                  <p className="mt-3 text-sm leading-7 text-slate-500">
                    {description}
                  </p>
                </article>
              ))}
            </div>
          </div>
        </section>

        <section
          id="how-it-works"
          className="mx-auto max-w-7xl scroll-mt-8 px-6 py-20 lg:px-10 lg:py-24"
        >
          <div className="text-center">
            <p className="text-xs font-semibold tracking-[0.18em] text-blue-600">
              FROM TO-DO TO LET’S GO
            </p>
            <h2 className="mt-4 text-3xl font-semibold tracking-tight sm:text-4xl">
              Three steps. Then you’re off.
            </h2>
          </div>
          <ol className="mt-12 grid gap-10 md:grid-cols-3 md:gap-12">
            {steps.map((step, index) => (
              <li
                key={step.title}
                className="relative border-t border-slate-200 pt-7"
              >
                <span className="font-mono text-sm font-semibold text-blue-600">
                  0{index + 1}{" "}
                  <span aria-hidden="true" className="ml-2 text-blue-200">
                    /
                  </span>
                </span>
                <h3 className="mt-5 text-xl font-semibold tracking-tight">
                  {step.title}
                </h3>
                <p className="mt-3 max-w-sm text-sm leading-7 text-slate-500">
                  {step.description}
                </p>
              </li>
            ))}
          </ol>
        </section>

        <section
          id="free"
          className="mx-auto max-w-7xl scroll-mt-8 px-6 pb-20 lg:px-10"
        >
          <div className="relative overflow-hidden rounded-3xl bg-blue-600 px-7 py-12 text-white sm:p-12 lg:p-16">
            <div
              aria-hidden="true"
              className="absolute -right-24 -top-28 size-96 rounded-full border-[60px] border-white/5"
            />
            <div className="relative grid gap-10 md:grid-cols-[1.5fr_1fr] md:items-center">
              <div>
                <span className="inline-flex items-center gap-2 text-xs font-semibold tracking-widest text-blue-100">
                  <Sparkles aria-hidden="true" className="size-4" /> EVERY
                  FEATURE. ZERO COST.
                </span>
                <h2 className="mt-5 text-4xl font-semibold leading-tight tracking-tight sm:text-5xl">
                  Better routes.
                  <br />
                  No price tag.
                </h2>
                <p className="mt-5 max-w-md text-base leading-7 text-blue-100">
                  Everything on StopNest is free. Optimize your stops, download
                  your route, and open it in Google Maps. No paid plans. No
                  upgrades needed.
                </p>
              </div>
              <div className="md:justify-self-end">
                <p className="text-7xl font-semibold tracking-tighter">
                  $0
                  <span className="ml-2 text-base font-normal tracking-normal text-blue-100">
                    to get going
                  </span>
                </p>
                <Link
                  href="/map"
                  className="mt-7 inline-flex min-h-12 items-center justify-center gap-3 rounded-full bg-white px-7 py-3 text-sm font-semibold text-blue-600 transition hover:bg-blue-50 focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-white"
                >
                  Find my next route{" "}
                  <ArrowRight aria-hidden="true" className="size-4" />
                </Link>
                <p className="mt-4 text-xs text-blue-100">
                  More time for wherever life takes you.
                </p>
              </div>
            </div>
          </div>
        </section>
      </main>
      <footer className="border-t border-slate-100 px-6 py-8 lg:px-10">
        <div className="mx-auto flex max-w-7xl flex-col items-start justify-between gap-5 sm:flex-row sm:items-center">
          <Link
            href="/"
            className="flex items-center gap-2 text-base font-bold tracking-tight"
          >
            <MapPin aria-hidden="true" className="size-5 text-blue-600" />
            StopNest.com
          </Link>
          <ContactDialog />
        </div>
      </footer>
    </div>
  );
}
