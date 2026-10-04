"use client";
import { useEffect, useRef } from "react";
import { Download, MapPin, Navigation } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import type { GoogleMap, RouteResult } from "@/app/lib/types";

type MapProps = {
  ready: boolean;
  mapError: string;
  hasApiKey: boolean;
  result: RouteResult | null;
  routeNeedsUpdate: boolean;
};
const miles = (meters: number) => `${(meters / 1609.344).toFixed(1)} mi`;

const duration = (seconds: string) => {
  const minutes = Math.ceil(parseFloat(seconds) / 60);

  return minutes >= 60
    ? `${Math.floor(minutes / 60)} hr ${minutes % 60} min`
    : `${minutes} min`;
};

export default function RouteMap({
  ready,
  mapError,
  hasApiKey,
  result,
  routeNeedsUpdate,
}: MapProps) {
  const mapElement = useRef<HTMLDivElement>(null);
  const map = useRef<GoogleMap | null>(null);
  const key = hasApiKey;
  useEffect(() => {
    const google = window.google?.maps;
    if (!ready || !google || !mapElement.current) return;
    if (!map.current)
      map.current = new google.Map(mapElement.current, {
        center: { lat: 38.575, lng: -121.475 },
        zoom: 12,
        mapId: process.env.NEXT_PUBLIC_GOOGLE_MAPS_MAP_ID || "DEMO_MAP_ID",
        disableDefaultUI: true,
        zoomControl: true,
      });
    if (!result || !result.route.legs.length) return;
    const path = result.route.polyline.geoJsonLinestring.coordinates.map(
      ([lng, lat]) => ({ lat, lng }),
    );
    const line = new google.Polyline({
      map: map.current,
      path,
      strokeColor: "#2563eb",
      strokeWeight: 5,
    });
    const bounds = new google.LatLngBounds();
    path.forEach((p) => bounds.extend(p));
    map.current.fitBounds(bounds, 65);
    const positions = [
      result.route.legs[0].startLocation.latLng,
      ...result.route.legs.map((l) => l.endLocation.latLng),
    ];
    const currentMap = map.current;
    const markers = positions.map((p, i) => {
      const pin = document.createElement("div");
      pin.className =
        "grid size-8 place-items-center rounded-full border-[3px] border-white bg-primary font-bold text-primary-foreground shadow-md";
      pin.textContent =
        i === 0 ||
        (i === positions.length - 1 &&
          result.addresses[i] === result.addresses[0])
          ? "S"
          : String(i);
      return new google.marker.AdvancedMarkerElement({
        map: currentMap,
        position: { lat: p.latitude, lng: p.longitude },
        content: pin,
        title: result.addresses[i],
      });
    });
    return () => {
      line.setMap(null);
      markers.forEach((m) => {
        m.map = null;
      });
    };
  }, [ready, result]);

  function download() {
    if (!result) return;
    const contents = result.addresses
      .map((a, i) => `${i === 0 ? "Start" : i}. ${a}`)
      .join("\n");
    const url = URL.createObjectURL(
      new Blob([contents], { type: "text/plain" }),
    );
    const link = document.createElement("a");
    link.href = url;
    link.download = "optimized-route.txt";
    link.click();
    URL.revokeObjectURL(url);
  }

  return (
    <section
      className="relative min-h-0 min-w-0 overflow-hidden bg-secondary"
      aria-label="Route map and results"
    >
      <div ref={mapElement} className="absolute inset-0 overflow-hidden" />
      {result && routeNeedsUpdate && (
        <p
          role="status"
          className="absolute left-6 right-6 top-6 rounded-lg border border-border bg-card px-4 py-3 text-xs text-foreground shadow-sm"
        >
          Addresses or options changed. Click Optimize to update the displayed
          route.
        </p>
      )}
      {(!key || mapError) && (
        <div className="absolute inset-x-[15%] top-1/4 space-y-3 text-center text-muted-foreground [&_svg]:mx-auto [&_h2]:text-xl [&_h2]:font-medium [&_p]:text-xs">
          <MapPin size={32} />
          <h2>Let’s get you on the map</h2>
          <p>
            {mapError ||
              "Add NEXT_PUBLIC_GOOGLE_MAPS_API_KEY to display the map."}
          </p>
        </div>
      )}
      {result && (
        <Card className="absolute bottom-16 left-6 max-h-[55%] w-[calc(100%-3rem)] max-w-md gap-4 overflow-auto bg-card shadow-xl md:max-h-1/2">
          <CardHeader className="flex flex-row items-center justify-between">
            <div>
              <span className="text-[10px] font-bold tracking-[0.18em] text-muted-foreground">
                READY WHEN YOU ARE
              </span>
              <h2 className="mt-1 text-xl font-semibold">
                Your route, sorted.
              </h2>
            </div>
            <Button
              onClick={download}
              variant="outline"
              size="icon"
              aria-label="Download ordered stops"
            >
              <Download size={18} />
            </Button>
          </CardHeader>

          <CardContent>
            <div className="mb-4 grid grid-cols-3 gap-2 rounded-lg bg-secondary p-3 [&_strong]:block [&_strong]:text-lg [&_span]:text-[10px] [&_span]:text-muted-foreground">
              <div>
                <strong>{duration(result.route.duration)}</strong>
                <span>Driving time</span>
              </div>
              <div>
                <strong>{miles(result.route.distanceMeters)}</strong>
                <span>Total distance</span>
              </div>
              <div>
                <strong>
                  {result.savingsPercent === null
                    ? "Nearby"
                    : `${result.savingsPercent}%`}
                </strong>
                <span>
                  {result.savingsPercent === null
                    ? "Geographic ordering"
                    : `Less ${result.metric}*`}
                </span>
              </div>
            </div>
            <ol className="list-none divide-y divide-border [&_li]:flex [&_li]:items-center [&_li]:gap-2.5 [&_li]:py-3 [&_li]:text-xs [&_li>div]:min-w-0 [&_li>div]:flex-1 [&_small]:mt-1 [&_small]:block [&_small]:text-[10px] [&_small]:text-muted-foreground [&_a]:rounded-md [&_a]:p-2 [&_a]:text-primary [&_a]:outline-none [&_a:focus-visible]:ring-2 [&_a:focus-visible]:ring-ring [&_a:hover]:bg-secondary">
              {result.addresses.map((a, i) => (
                <li key={i}>
                  <span className="grid size-6 shrink-0 place-items-center rounded-full bg-secondary text-primary">
                    {i === 0 ? "S" : i}
                  </span>
                  <div>
                    <p>{a}</p>
                    {i > 0 && (
                      <small>
                        {duration(result.route.legs[i - 1].duration)} ·{" "}
                        {miles(result.route.legs[i - 1].distanceMeters)} from
                        previous stop
                      </small>
                    )}
                  </div>
                  {i > 0 && (
                    <a
                      aria-label={`Navigate to stop ${i}`}
                      target="_blank"
                      rel="noreferrer"
                      href={`https://www.google.com/maps/dir/?api=1&origin=${encodeURIComponent(result.addresses[i - 1])}&destination=${encodeURIComponent(a)}&travelmode=driving`}
                    >
                      <Navigation size={16} />
                    </a>
                  )}
                </li>
              ))}
            </ol>
            {result.route.warnings?.map((w) => (
              <p
                className="mt-3 text-[10px] leading-relaxed text-muted-foreground"
                key={w}
              >
                {w}
              </p>
            ))}
          </CardContent>
        </Card>
      )}
      <div className="absolute bottom-7 left-1/2 -translate-x-1/2 whitespace-nowrap rounded bg-card/90 px-2 py-1 text-[10px] text-muted-foreground">
        Make the most of every mile.
      </div>
    </section>
  );
}
