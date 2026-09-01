// map.tsx

"use client";

import Script from "next/script";
import { useCallback, useEffect, useRef, useState } from "react";
import { MdMyLocation } from "react-icons/md";
import { IoMdAddCircleOutline } from "react-icons/io";
import { BsHouseDoor } from "react-icons/bs";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog"

import Form from "./form";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";

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

type GoogleLatLng = {
  lat: () => number;
  lng: () => number;
};

type GooglePlace = {
  formattedAddress?: string | null;
  location?: GoogleLatLng | null;
  fetchFields: (options: {
    fields: string[];
  }) => Promise<void>;
};

type GooglePlacePrediction = {
  toPlace: () => GooglePlace;
};

type GooglePlaceSelectEvent = Event & {
  placePrediction: GooglePlacePrediction;
};

type GooglePlaceAutocompleteElement = HTMLElement & {
  includedRegionCodes: string[];
  locationBias: {
    center: MapPosition;
    radius: number;
  } | null;
  placeholder: string;
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
            gestureHandling: "greedy";
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
        places: {
          PlaceAutocompleteElement: new () => GooglePlaceAutocompleteElement;
        };
      };
    };
  }
}

const defaultLocation: MapPosition = {
  lat: 38.5816,
  lng: -121.4944,
};

const searchRadiusMiles = 1;

function formatGateCode(gateCode: string | null) {
  if (!gateCode) return "Unknown";

  return gateCode.startsWith("#") ? gateCode : `#${gateCode}`;
}

export default function Map() {
  const mapElement = useRef<HTMLDivElement>(null);
  const map = useRef<GoogleMap | null>(null);
  const markers = useRef<GoogleAdvancedMarker[]>([]);
  const infoWindow = useRef<GoogleInfoWindow | null>(null);
  const autocompleteContainer = useRef<HTMLDivElement>(null);
  const placeAutocomplete =
    useRef<GooglePlaceAutocompleteElement | null>(null);

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
  const [openPrompt, setOpenPrompt] = useState(false);
  const [showSuccess, setShowSuccess] = useState(false);
  const [successMessage, setSuccessMessage] = useState("");

  const createRating = async (codeId: number, works: string, comment?: string) => {
   
    try {
      const response = await fetch("/api/rating", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          codeId,
          works,
          comment,
        }),
      });

      if (!response.ok) {
        throw new Error("Unable to submit rating.");
      }

      const data = await response.json();
      toast.success("Thank you for your feedback!");
      setOpenPrompt(false);
      return data;
    } catch (error) {
      console.error("Error submitting rating:", error);
      throw error;
    }
  };

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
  if (
    !mapLoaded ||
    !mapElement.current ||
    !window.google?.maps
  ) {
    return;
  }

  const center: MapPosition = location
    ? {
        lat: location.latitude,
        lng: location.longitude,
      }
    : defaultLocation;

  const mapInstance =
    map.current ??
    new window.google.maps.Map(mapElement.current, {
      center,
      zoom: location ? 15 : 11,
      gestureHandling: "greedy",
      disableDefaultUI: true,
      zoomControl: true,
      mapId:
        process.env.NEXT_PUBLIC_GOOGLE_MAPS_MAP_ID ??
        "DEMO_MAP_ID",
    });

  map.current = mapInstance;

  mapInstance.panTo(center);
  mapInstance.setZoom(location ? 15 : 11);
}, [mapLoaded, location]);

  useEffect(() => {
    if (!mapLoaded || !autocompleteContainer.current) return;

    const container = autocompleteContainer.current;
    const autocomplete =
      new window.google.maps.places.PlaceAutocompleteElement();

    autocomplete.placeholder = "Search an address";
    autocomplete.includedRegionCodes = ["us"];
    autocomplete.style.width = "100%";
    autocomplete.style.height = "100%";
    autocomplete.style.border = "0";
    autocomplete.style.borderRadius = "9999px";
    autocomplete.style.backgroundColor = "white";
    autocomplete.style.colorScheme = "light";
    autocomplete.style.fontSize = "14px";
    autocomplete.locationBias = {
      center: defaultLocation,
      radius: 50000,
    };

    const handlePlaceSelect = async (event: Event) => {
      const { placePrediction } = event as GooglePlaceSelectEvent;
      const place = placePrediction.toPlace();

      try {
        await place.fetchFields({
          fields: ["formattedAddress", "location"],
        });

        if (!place.location) {
          setStatus("Unable to find that address");
          return;
        }

        const searchedLocation: Location = {
          latitude: place.location.lat(),
          longitude: place.location.lng(),
        };

        setIsAdding(false);
        setLocation(searchedLocation);
        setAddress(place.formattedAddress ?? "");
        setStatus("Showing communities near the searched address");

        map.current?.panTo({
          lat: searchedLocation.latitude,
          lng: searchedLocation.longitude,
        });
        map.current?.setZoom(15);
      } catch (error) {
        console.error("Unable to select address:", error);
        setStatus("Unable to find that address");
      }
    };

    autocomplete.addEventListener("gmp-select", handlePlaceSelect);
    container.replaceChildren(autocomplete);
    placeAutocomplete.current = autocomplete;

    return () => {
      autocomplete.removeEventListener(
        "gmp-select",
        handlePlaceSelect,
      );
      container.replaceChildren();
      placeAutocomplete.current = null;
    };
  }, [mapLoaded]);

  useEffect(() => {
    if (!placeAutocomplete.current) return;

    placeAutocomplete.current.locationBias = {
      center: location
        ? {
            lat: location.latitude,
            lng: location.longitude,
          }
        : defaultLocation,
      radius: 50000,
    };
  }, [location, mapLoaded]);

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

const visibleCodes = codes
        .filter((code) => Number(code.distance) <= 2)
        .slice(0, 2);

const active =
  visibleCodes.length > 0 &&
  Number(visibleCodes[0].distance) <= 0.1;

  return (
    <main className="relative h-screen w-screen overflow-hidden">
      <Script
        src={`https://maps.googleapis.com/maps/api/js?key=${process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY}&v=weekly&libraries=marker,places`}
        strategy="afterInteractive"
        onReady={() => setMapLoaded(true)}
      />
            <div ref={mapElement} className="absolute inset-0" />

          <Dialog open={openPrompt} onOpenChange={setOpenPrompt}>
            <DialogContent className="w-[calc(100%-2rem)] max-w-sm rounded-2xl border-0 bg-white p-4 shadow-2xl">
              <DialogHeader className="items-center text-center">
                <div className="mb-3 flex h-14 w-14 items-center justify-center rounded-full bg-[#F3E8FF]">
                  <BsHouseDoor
                    size={28}
                    className="text-[#581C87]"
                  />
                </div>

                <DialogTitle className="text-xl font-bold text-slate-950">
                  Does this gate code work?
                </DialogTitle>
              </DialogHeader>

              <div className="mt-2 flex flex-col gap-1.5">
                <Button
                  onClick={() => createRating(visibleCodes[0].id, "YES")}
                  className="h-11 w-full rounded-xl bg-[#581C87] font-semibold text-white hover:bg-[#4a176f]"
                >
                  Yes, it works
                </Button>

                <Button
                  variant="outline"
                  onClick={() => createRating(visibleCodes[0].id, "NO")}
                  className="h-11 w-full rounded-xl border-slate-200 font-semibold text-slate-700 hover:bg-slate-50"
                >
                  No, it does not
                </Button>
              </div>
            </DialogContent>
          </Dialog>

            <div className="absolute left-1/2 top-4 z-10 h-12 w-[calc(100%-9rem)] max-w-md -translate-x-1/2 rounded-full bg-white shadow-lg">
              <div
                ref={autocompleteContainer}
                className="h-full w-full"
              />
            </div>

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
        <div className="pointer-events-auto h-96 w-full max-w-lg overflow-y-auto bg-white/95 p-4 text-center shadow-2xl backdrop-blur md:rounded-2xl">
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

              <div className="space-y-3 text-left">
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
                {!visibleCodes.length && location && (
                  <p className="text-center text-sm text-slate-500">
                    No gate codes found nearby.
                  </p>
                )}

                    {visibleCodes.map((code) => (
                    <div
                        key={code.id}
                        className={`rounded-xl border border-slate-200 bg-white p-4 shadow-sm ${active ? 'ring-2 ring-blue-500' : ''}`}
                        onClick={() => {setOpenPrompt(true)}}
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
                                {active ? 'Gate Code Found!' : `${Number(code.distance).toFixed(2)} miles away`}
                            </p>
                            </div>
                        </div>

                        <span className="shrink-0 rounded-lg bg-[#F3E8FF] px-3 py-1 text-sm font-bold text-[#581C87]">
                            {formatGateCode(code.gateCode)}
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
