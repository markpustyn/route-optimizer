"use client";

import { useRef, useState, type FormEvent } from "react";
import {
  ArrowRight,
  Circle,
  CirclePlus,
  CircleX,
  EllipsisVertical,
  MapPin,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";
import { Badge } from "@/components/ui/badge";
import { Alert, AlertDescription } from "@/components/ui/alert";
import type { RouteRequest, RouteResult, SelectedPlace } from "@/app/lib/types";
import AddressInput from "./address-input";
import { usePremium } from "@/components/premium-provider";

type SidebarProps = {
  mapLoaded: boolean;
  busy: boolean;
  error: string;
  onOptimize: (request: RouteRequest) => Promise<void>;
  onChange: () => void;
  onPlaceSelect?: (place: SelectedPlace) => void;
  result: RouteResult | null;
};

type Destination = { id: number; address: string };

const sample = [
  "3601 Lyon St, San Francisco, CA 94123",
  "900 North Point St, San Francisco, CA 94109",
  "1 Telegraph Hill Blvd, San Francisco, CA 94133",
  "1 Ferry Building, San Francisco, CA 94111",
  "600 Montgomery St, San Francisco, CA 94111",
  "710 Steiner St, San Francisco, CA 94117",
  "200 Larkin St, San Francisco, CA 94102",
  "151 3rd St, San Francisco, CA 94103",
];

export default function SideBar({
  mapLoaded,
  busy,
  error,
  result,
  onOptimize,
  onChange,
  onPlaceSelect,
}: SidebarProps) {
  const [start, setStart] = useState("");
  const { premium, showUpgrade } = usePremium();
  const [destinations, setDestinations] = useState<Destination[]>([
    { id: 0, address: "" },
    { id: 1, address: "" },
  ]);
  const [roundTrip, setRoundTrip] = useState(true);
  const [reverseDirection, setReverseDirection] = useState(false);
  const nextId = useRef(2);
  const maxDestinations = premium ? 50 : 8;
  const canOptimize =
    start.trim().length > 0 &&
    destinations.length >= 2 &&
    destinations.every((stop) => stop.address.trim().length > 0);

  function updateDestination(id: number, address: string) {
    setDestinations((current) =>
      current.map((stop) => (stop.id === id ? { ...stop, address } : stop)),
    );
    onChange();
  }

  function addDestination() {
    if (!premium && destinations.length >= 8) {
      showUpgrade();
      return;
    }
    if (destinations.length >= maxDestinations) return;
    const destination = { id: nextId.current++, address: "" };
    setDestinations((current) => [...current, destination]);
    onChange();
  }

  function removeDestination(id: number) {
    if (destinations.length <= 2) return;
    setDestinations((current) => current.filter((stop) => stop.id !== id));
    onChange();
  }

  async function optimize(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (busy || !canOptimize) return;
    if (!premium && destinations.length > 8) {
      showUpgrade();
      return;
    }
    await onOptimize({
      start: start.trim(),
      destinations: destinations.map((stop) => stop.address.trim()),
      metric: "time",
      roundTrip,
      reverseDirection,
    });
  }

  function openInGoogleMaps() {

    if (!result || result.addresses.length < 2) return;

    const addresses = result.addresses;
    const batchSize = 10;

    for (let i = 0; i < addresses.length; i += batchSize) {
      const map = addresses.slice(i, i + batchSize);
      const path = map
        .map((address) =>
          encodeURIComponent(address.trim()).replace(/%20/g, "+"),
        )
        .join("/");
      window.open(
        `https://www.google.com/maps/dir/${path}/`,
        "_blank",
        "noopener,noreferrer",
      );
    }
  }

  return (
    <div className="min-h-full w-full bg-[#FAFCFF] p-4 md:max-w-5xl">
      <section className="rounded-2xl bg-card p-4 lg:px-8 lg:pt-9 2xl:p-11">
        <form onSubmit={optimize}>
          <fieldset disabled={busy} className="space-y-5">
            <div className="space-y-3">
              <Label htmlFor="start">Starting point</Label>
              <AddressInput
                id="start"
                label="Starting point"
                value={start}
                mapLoaded={mapLoaded}
                disabled={busy}
                onChange={(address) => {
                  setStart(address);
                  onChange();
                }}
                onPlaceSelect={onPlaceSelect}
              />
            </div>

            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <h2 className="text-sm font-medium">Your destinations</h2>
                <Badge variant="secondary">
                  {destinations.length} / {maxDestinations} stops
                </Badge>
              </div>
              <p className="text-xs text-muted-foreground">
                Add each destination separately. Search for an address in each
                field. Stops are ordered by geographic proximity; driving time
                and distance are calculated for the resulting route.
              </p>
              <div className="space-y-2">
                {destinations.map((stop, index) => (
                  <div key={stop.id} className="relative flex items-start">
                    <div className="mr-2 flex w-5 shrink-0 justify-center mt-4">
                      {index === destinations.length - 1 ? (
                        <MapPin size={20} color="#1D4ED8" />
                      ) : (
                        <Circle size={16} />
                      )}
                    </div>

                    {index < destinations.length - 1 && (
                      <EllipsisVertical
                        size={20}
                        className="absolute left-0 top-[calc(50%+8px)] -translate-y-1/2 mt-5"
                      />
                    )}
                    <AddressInput
                      id={`destination-${stop.id}`}
                      label="Destination"
                      value={stop.address}
                      mapLoaded={mapLoaded}
                      disabled={busy}
                      onChange={(address) =>
                        updateDestination(stop.id, address)
                      }
                      onPlaceSelect={onPlaceSelect}
                    />

                    <Button
                      type="button"
                      variant="ghost"
                      size="icon"
                      className="mt-2 ml-2"
                      disabled={busy || destinations.length <= 2}
                      aria-label={`Remove destination ${index + 1}`}
                      onClick={() => removeDestination(stop.id)}
                    >
                      <CircleX className="size-6" />
                    </Button>
                  </div>
                ))}
              </div>
              <div className="text-left gap-2 ml-0">
                <Button
                  type="button"
                  disabled={busy || (premium && destinations.length >= 50)}
                  onClick={addDestination}
                  className="w-full h-12 bg-white text-black hover:bg-muted hover:text-foreground"
                >
                  <CirclePlus className="size-4" /> Add destination
                </Button>
              </div>
              <Button
                type="button"
                variant="link"
                className="text-xs"
                disabled={busy}
                onClick={() => {
                  setStart("San Francisco City Hall, San Francisco, CA");
                  setDestinations(
                    sample.map((address) => ({
                      id: nextId.current++,
                      address,
                    })),
                  );
                  onChange();
                }}
              >
                Try 8 stops <ArrowRight className="size-3" />
              </Button>
            </div>

            <Label
              htmlFor="round-trip"
              className="flex cursor-pointer items-center gap-3 text-xs"
            >
              <Checkbox
                id="round-trip"
                checked={roundTrip}
                disabled={busy}
                onCheckedChange={(checked) => {
                  setRoundTrip(checked);
                  onChange();
                }}
              />
              <span>
                Return to starting point
                <small className="mt-1 block text-[10px] font-normal text-muted-foreground">
                  Finish your route where you began
                </small>
              </span>
            </Label>
            <Label
              htmlFor="reverse-direction"
              className="flex cursor-pointer items-center gap-3 text-xs"
            >
              <Checkbox
                id="reverse-direction"
                checked={reverseDirection}
                disabled={busy}
                onCheckedChange={(checked) => {
                  setReverseDirection(checked);
                  onChange();
                }}
              />
              <span>
                Go opposite direction
                <small className="mt-1 block text-[10px] font-normal text-muted-foreground">
                  Visit optimized stops in reverse order from the same starting
                  point. Click Optimize route to apply.
                </small>
              </span>
            </Label>
            <Button
              className="h-12 w-full gap-3 text-sm shadow-sm"
              type="submit"
              disabled={busy || !canOptimize}
            >
              {busy ? "Finding a better route…" : "Optimize route"}
              {!busy && <ArrowRight className="size-4" />}
            </Button>
            {result && (
              <Button
                variant="outline"
                className="h-12 w-full gap-3 text-sm shadow-sm border-blue-500 text-blue-500 hover:bg-blue-50 hover:text-blue-600"
                type="button"
                disabled={busy || result.addresses.length < 2}
                onClick={openInGoogleMaps}
              >
                Open in Google Maps
              </Button>
            )}
          </fieldset>
          <div role="status" aria-live="polite">
            {busy && (
              <p className="mt-3 text-xs text-primary">
                Ordering stops and calculating driving directions…
              </p>
            )}
          </div>
          {error && (
            <Alert
              variant="destructive"
              className="mt-3 border-destructive/20 bg-destructive/5"
            >
              <AlertDescription>{error}</AlertDescription>
            </Alert>
          )}
        </form>
      </section>
    </div>
  );
}
