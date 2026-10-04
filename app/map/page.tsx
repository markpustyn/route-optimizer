"use client";

import Script from "next/script";
import { useCallback, useEffect, useState } from "react";
import type { RouteRequest, RouteResult } from "@/app/lib/types";
import SideBar from "../ui/sidebar";
import RouteMap from "../ui/map";
import { usePremium } from "@/components/premium-provider";

export default function Home() {
  const { showUpgrade } = usePremium();
  const [key, setKey] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const [mapError, setMapError] = useState("");
  const [ready, setReady] = useState(false);
  const [result, setResult] = useState<RouteResult | null>(null);
  const [routeNeedsUpdate, setRouteNeedsUpdate] = useState(false);

  useEffect(() => {
    let cancelled = false;

    async function loadMapKey() {
      try {
        const response = await fetch("/api/secure");

        if (!response.ok) {
          throw new Error("Unable to load the Google Maps key.");
        }

        const data: { apiKey?: string } = await response.json();

        if (!data.apiKey) {
          throw new Error("Google Maps key is missing.");
        }

        if (!cancelled) {
          setKey(data.apiKey);
        }
      } catch (error) {
        if (!cancelled) {
          setMapError(
            error instanceof Error
              ? error.message
              : "Unable to load the Google Maps key.",
          );
        }
      }
    }

    loadMapKey();

    return () => {
      cancelled = true;
    };
  }, []);

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
        const failure: { error?: string; code?: string } =
          await response.json();

        if (failure.code === "PREMIUM_REQUIRED") showUpgrade();

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
          src={`https://maps.googleapis.com/maps/api/js?key=${encodeURIComponent(
            key,
          )}&v=weekly&libraries=marker,places`}
          onReady={() => setReady(true)}
          onError={() =>
            setMapError(
              "The map could not load. Check your connection and Google Maps key.",
            )
          }
        />
      )}

      <div className="relative grid h-dvh grid-cols-1 grid-rows-[minmax(0,1fr)_minmax(0,1fr)] overflow-hidden md:grid-cols-[360px_minmax(0,1fr)] md:grid-rows-[minmax(0,1fr)] lg:grid-cols-[440px_minmax(0,1fr)] 2xl:grid-cols-[480px_minmax(0,1fr)]">
        <div className="order-last min-h-0 min-w-0 overflow-y-auto overscroll-contain bg-muted pb-20 md:order-first">
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