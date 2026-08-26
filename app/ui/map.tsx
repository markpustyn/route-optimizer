// map.tsx

"use client";

import Script from "next/script";
import { useCallback, useEffect, useRef, useState } from "react";
import { MdMyLocation } from "react-icons/md";
import { IoMdAddCircleOutline } from "react-icons/io";
import { BsHouseDoor } from "react-icons/bs";
import Form from "./form";

type Location = {
  latitude: number;
  longitude: number;
};

type MapPosition = {
  lat: number;
  lng: number;
};

type GateCode = {
  id: number;
  gateCode: string | null;
  street: string | null;
  city: string | null;
  state: string | null;
  zipCode: string | null;
  latitude: string | null;
  longitude: string | null;
  notes: string | null;
  distance: number;
};

type GoogleMap = {
  panTo: (position: MapPosition) => void;
  setZoom: (zoom: number) => void;
};

type GoogleAdvancedMarker = HTMLElement & {
  map: GoogleMap | null;
};

type GoogleInfoWindow = {
  close: () => void;
  setContent: (content: Node | string) => void;
  open: (options: {
    map: GoogleMap;
    anchor: GoogleAdvancedMarker;
    shouldFocus?: boolean;
  }) => void;
};

type AddressComponent = {
  long_name: string;
  short_name: string;
  types: string[];
};

type GeocoderResult = {
  formatted_address: string;
  address_components: AddressComponent[];
};

type GoogleGeocoder = {
  geocode: (request: {
    location: MapPosition;
  }) => Promise<{
    results: GeocoderResult[];
  }>;
};

declare global {
  interface Window {
    google: {
      maps: {
        Map: new (
          element: HTMLElement,
          options: {
            center: MapPosition;
            zoom: number;
            disableDefaultUI: boolean;
            zoomControl: boolean;
            mapId: string;
          },
        ) => GoogleMap;
        Geocoder: new () => GoogleGeocoder;
        InfoWindow: new () => GoogleInfoWindow;
        marker: {
          AdvancedMarkerElement: new (options: {
            map: GoogleMap;
            position: MapPosition;
            title: string;
            gmpClickable?: boolean;
          }) => GoogleAdvancedMarker;
          PinElement: new (options: {
            background?: string;
            borderColor?: string;
            glyphColor?: string;
            glyphText?: string;
            scale?: number;
          }) => HTMLElement;
        };
      };
    };
  }
}

const defaultLocation: MapPosition = {
  lat: 38.5816,
  lng: -121.4944,
};

const searchRadiusMiles = 10;

function formatGateCode(gateCode: string | null) {
  if (!gateCode) return "Unknown";

  return gateCode.startsWith("#") ? gateCode : `#${gateCode}`;
}

export default function Map() {
  const mapElement = useRef<HTMLDivElement>(null);
  const map = useRef<GoogleMap | null>(null);
  const markers = useRef<GoogleAdvancedMarker[]>([]);
  const infoWindow = useRef<GoogleInfoWindow | null>(null);

  const [location, setLocation] = useState<Location | null>(null);
  const [isAdding, setIsAdding] = useState(false);
  const [mapLoaded, setMapLoaded] = useState(false);
  const [status, setStatus] = useState(
    "Use your location to search nearby",
  );

  const [address, setAddress] = useState("");
  const [streetName, setStreetName] = useState("");
  const [city, setCity] = useState("");
  const [state, setState] = useState("");
  const [zipCode, setZipCode] = useState("");

  const [codes, setCodes] = useState<GateCode[]>([]);
  const [codesLoading, setCodesLoading] = useState(false);
  const [codesError, setCodesError] = useState("");

  const getLocation = useCallback(() => {
    setIsAdding(false);
    if (!navigator.geolocation) {
      setStatus("Location is not supported by your browser");
      return;
    }

    setStatus("Finding your location...");

    navigator.geolocation.getCurrentPosition(
      ({ coords }) => {
        const currentLocation: Location = {
          latitude: coords.latitude,
          longitude: coords.longitude,
        };

        localStorage.setItem(
          "lastLocation",
          JSON.stringify(currentLocation),
        );

        setLocation(currentLocation);
        setStatus("Showing communities near you");
      },
      () => {
        setStatus("Unable to access your location");
      },
      {
        enableHighAccuracy: true,
        timeout: 10000,
        maximumAge: 60000,
      },
    );
  }, []);

  const fetchCodes = useCallback(
    async (currentLocation: Location) => {
      setCodesLoading(true);
      setCodesError("");

      const params = new URLSearchParams({
        latitude: currentLocation.latitude.toString(),
        longitude: currentLocation.longitude.toString(),
        radius: searchRadiusMiles.toString(),
      });

      try {
        const response = await fetch(`/api/codes?${params}`);

        if (!response.ok) {
          throw new Error("Unable to fetch gate codes.");
        }

        const data = (await response.json()) as {
          codes: GateCode[];
        };

        setCodes(data.codes ?? []);
      } catch {
        setCodes([]);
        setCodesError("Unable to load nearby gate codes.");
      } finally {
        setCodesLoading(false);
      }
    },
    [],
  );

  useEffect(() => {


    if (!navigator.permissions) return;

    navigator.permissions
      .query({ name: "geolocation" })
      .then((permission) => {
        if (permission.state === "granted") {
          getLocation();
        }
      })
      .catch(() => {
        setStatus("Use your location to search nearby");
      });
  }, [getLocation]);

  useEffect(() => {
    if (!location) return;

    // eslint-disable-next-line react-hooks/set-state-in-effect
    void fetchCodes(location);
  }, [location, fetchCodes]);

  useEffect(() => {
    if (!mapLoaded || !mapElement.current) return;

    const center: MapPosition = location
      ? {
          lat: location.latitude,
          lng: location.longitude,
        }
      : defaultLocation;

    if (!map.current) {
      map.current = new window.google.maps.Map(
        mapElement.current,
        {
          center,
          zoom: location ? 15 : 11,
          disableDefaultUI: true,
          zoomControl: true,
          mapId:
            process.env.NEXT_PUBLIC_GOOGLE_MAPS_MAP_ID ??
            "DEMO_MAP_ID",
        },
      );

      return;
    }

    map.current.panTo(center);
    map.current.setZoom(location ? 15 : 11);
  }, [mapLoaded, location]);

  useEffect(() => {
    if (!mapLoaded || !map.current) return;

    markers.current.forEach((marker) => {
      marker.map = null;
    });
    markers.current = [];

    const currentMap = map.current;
    const sharedInfoWindow =
      infoWindow.current ?? new window.google.maps.InfoWindow();

    infoWindow.current = sharedInfoWindow;

    codes.forEach((code) => {
      const latitude = Number(code.latitude);
      const longitude = Number(code.longitude);

      if (!Number.isFinite(latitude) || !Number.isFinite(longitude)) {
        return;
      }

      const formattedGateCode = formatGateCode(code.gateCode);

      const pin = new window.google.maps.marker.PinElement({
        background: "#581C87",
        borderColor: "#581C87",
        glyphColor: "#ffffff",
        scale: 1.25,
      });

      const marker =
        new window.google.maps.marker.AdvancedMarkerElement({
          map: currentMap,
          position: {
            lat: latitude,
            lng: longitude,
          },
          title: `${code.street ?? "Community"} gate code ${formattedGateCode}`,
          gmpClickable: true,
        });

      marker.append(pin);

      marker.addEventListener("gmp-click", () => {
        const content = document.createElement("div");
        content.style.padding = "4px";
        content.style.minWidth = "180px";

        const street = document.createElement("p");
        street.style.fontWeight = "700";
        street.style.margin = "0 0 4px";
        street.textContent = code.street ?? "Community";

        const city = document.createElement("p");
        city.style.color = "#64748b";
        city.style.fontSize = "13px";
        city.style.margin = "0 0 8px";
        city.textContent = [
          code.city,
          code.state,
          code.zipCode,
        ]
          .filter(Boolean)
          .join(" ");

        const gate = document.createElement("p");
        gate.style.color = "#1d4ed8";
        gate.style.fontSize = "16px";
        gate.style.fontWeight = "700";
        gate.style.margin = "0";
        gate.textContent = `Gate code: ${formattedGateCode}`;

        content.append(street, city, gate);

        sharedInfoWindow.close();
        sharedInfoWindow.setContent(content);
        sharedInfoWindow.open({
          map: currentMap,
          anchor: marker,
          shouldFocus: false,
        });
      });

      markers.current.push(marker);
    });

    return () => {
      markers.current.forEach((marker) => {
        marker.map = null;
      });
      markers.current = [];
      sharedInfoWindow.close();
    };
  }, [mapLoaded, codes]);

  useEffect(() => {
    if (!mapLoaded || !location) return;

    const geocoder = new window.google.maps.Geocoder();

    geocoder
      .geocode({
        location: {
          lat: location.latitude,
          lng: location.longitude,
        },
      })
      .then(({ results }) => {
        const result = results[0];

        if (!result) {
          setStreetName("");
          setCity("");
          setState("");
          setZipCode("");
          setAddress("Address unavailable");
          return;
        }

        const findComponent = (type: string) =>
          result.address_components.find((component) =>
            component.types.includes(type),
          );

        const street = findComponent("route");
        const currentCity =
          findComponent("locality") ??
          findComponent("postal_town") ??
          findComponent("sublocality_level_1");
        const currentState = findComponent(
          "administrative_area_level_1",
        );
        const currentZipCode = findComponent("postal_code");

        setStreetName(street?.long_name ?? "");
        setCity(currentCity?.long_name ?? "");
        setState(currentState?.short_name ?? "");
        setZipCode(currentZipCode?.long_name ?? "");
        setAddress(result.formatted_address);
      })
      .catch(() => {
        setStreetName("");
        setCity("");
        setState("");
        setZipCode("");
        setAddress("Address unavailable");
      });
  }, [mapLoaded, location]);

  return (
    <main className="relative h-screen w-screen overflow-hidden">
      <Script
        src={`https://maps.googleapis.com/maps/api/js?key=${process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY}&v=weekly&libraries=marker`}
        strategy="afterInteractive"
        onReady={() => setMapLoaded(true)}
      />

      <div ref={mapElement} className="absolute inset-0" />

      <button
        type="button"
        onClick={getLocation}
        aria-label="Use my location"
        title="Use my location"
        className="absolute right-4 top-4 z-10 flex h-12 w-12 items-center justify-center rounded-full bg-white text-2xl text-[#581C87] shadow-lg transition hover:bg-slate-100"
      >
        <MdMyLocation />
      </button>

      <button
        type="button"
         onClick={() => setIsAdding(true)}
        aria-label="Add a gate code"
        title="Add a gate code"
        className="absolute left-4 top-4 z-10 flex h-12 w-12 items-center justify-center rounded-full bg-white text-2xl text-[#581C87] shadow-lg transition hover:bg-slate-100"
      >
        <IoMdAddCircleOutline />
      </button>

      <div className="pointer-events-none absolute inset-0 flex items-end justify-center">
        <div className="pointer-events-auto max-h-[65vh] w-full max-w-lg overflow-y-auto bg-white/95 p-8 text-center shadow-2xl backdrop-blur md:rounded-2xl">
          {isAdding ? (
            <div>
                <h1 className="text-2xl font-semibold text-slate-950"> Add a Gate Code</h1>
            <Form
              street={streetName}
              city={city}
              state={state}
              zipCode={zipCode}
              latitude={location?.latitude}
              longitude={location?.longitude}
            />
            </div>
          ) : (
            <>
              <h1 className="text-2xl font-semibold text-slate-950">
                Nearby Communities
              </h1>

              <p className="mt-2 text-sm text-slate-600">
                {address || status}
              </p>

              <p className="mt-1 text-xs text-slate-500">
                Searching within {searchRadiusMiles} miles
              </p>

              <div className="mt-6 space-y-3 text-left">
                {codesLoading && (
                  <p className="text-center text-sm text-slate-500">
                    Loading nearby gate codes...
                  </p>
                )}

                {codesError && (
                  <p className="text-center text-sm text-red-600">
                    {codesError}
                  </p>
                )}

                {!codesLoading &&
                  !codesError &&
                  location &&
                  codes.length === 0 && (
                    <p className="text-center text-sm text-slate-500">
                      No gate codes found nearby.
                    </p>
                  )}

                {!location && (
                  <p className="text-center text-sm text-slate-500">
                    Select your location to find nearby gate codes.
                  </p>
                )}

                    {codes.map((code) => (
                    <div
                        key={code.id}
                        className="rounded-xl border border-slate-200 bg-white p-4 shadow-sm"
                    >
                        <div className="flex items-center justify-between gap-4">
                        <div className="flex min-w-0 items-center gap-3">
                            <BsHouseDoor
                            className="shrink-0 text-black"
                            size={40}
                            />

                            <div className="min-w-0">
                            <p className="font-semibold text-slate-950">
                                {code.street}
                            </p>

                            <p className="mt-1 text-sm text-slate-500">
                                {code.city}, {code.state} {code.zipCode}
                            </p>

                            <p className="mt-2 text-xs font-medium text-slate-400">
                                {Number(code.distance).toFixed(2)} miles away
                            </p>
                            </div>
                        </div>

                        <span className="shrink-0 rounded-lg bg-[#F3E8FF] px-3 py-1 text-sm font-bold text-[#581C87]">
                            #{code.gateCode}
                        </span>
                        </div>
                    </div>
                    ))}
              </div>
            </>
          )}
        </div>
      </div>
    </main>
  );
}
