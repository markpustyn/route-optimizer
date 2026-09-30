"use client";
import Script from "next/script";
import { useCallback, useState } from "react";
import type { RouteRequest, RouteResult } from "@/app/lib/types";
import SideBar from "../ui/sidebar";
import RouteMap from "../ui/map";


export default function Home() {
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const [mapError, setMapError] = useState("");
  const [ready, setReady] = useState(false);
  const [result, setResult] = useState<RouteResult | null>(null);
  const [routeNeedsUpdate, setRouteNeedsUpdate] = useState(false);
  const key = process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY;

  const invalidate = useCallback(() => {
    setRouteNeedsUpdate(true);
    setError("");
  }, []);

  async function optimize(request: RouteRequest) {
    setBusy(true);
    setError("");
    try {
      const response = await fetch("/api/optimize", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(request),
      });
      if (!response.ok) {
        const failure: { error?: string } = await response.json();
        throw new Error(failure.error || "Unable to optimize this route.");
      }
      const data: RouteResult = await response.json();
      setResult(data);
      setRouteNeedsUpdate(false);
    } catch (error) {
      setError(
        error instanceof Error
          ? error.message
          : "Unable to connect. Please try again.",
      );
    } finally {
      setBusy(false);
    }
  }

  return (
    <main className="bg-background font-sans text-foreground">
      {key && (
        <Script
          src={
            "https://maps.googleapis.com/maps/api/js?key=" +
            key +
            "&v=weekly&libraries=marker,places"
          }
          onReady={() => setReady(true)}
          onError={() =>
            setMapError(
              "The map could not load. Check your connection and Google Maps key.",
            )
          }
        />
      )}
      <div className="relative grid h-dvh grid-cols-1 grid-rows-[minmax(0,1fr)_minmax(0,1fr)] overflow-hidden md:grid-cols-[360px_minmax(0,1fr)] md:grid-rows-[minmax(0,1fr)] lg:grid-cols-[440px_minmax(0,1fr)] 2xl:grid-cols-[480px_minmax(0,1fr)]">
        <div className="order-last min-h-0 min-w-0 overflow-y-auto overscroll-contain bg-muted md:order-first">
          <SideBar
            mapLoaded={ready}
            busy={busy}
            error={error}
            onOptimize={optimize}
            onChange={invalidate}
            result={result}
          />
        </div>
        <RouteMap
          ready={ready}
          mapError={mapError}
          hasApiKey={Boolean(key)}
          result={result}
          routeNeedsUpdate={routeNeedsUpdate}
        />
      </div>
    </main>
  );
}
