import type { Metric } from "@/lib/optimizer";
export type { Metric } from "@/lib/optimizer";
export type MapPosition = { lat: number; lng: number };
export type RouteRequest = {
  start: string;
  destinations: string[];
  metric: Metric;
  roundTrip: boolean;
  reverseDirection?: boolean;
};
export type SelectedPlace = { address: string; position: MapPosition };
export const defaultLocation: MapPosition = { lat: 38.5816, lng: -121.4944 };
export type GoogleMap = {
  fitBounds: (bounds: GoogleBounds, padding: number) => void;
  panTo: (position: MapPosition) => void;
  setZoom: (zoom: number) => void;
};

export type GoogleAdvancedMarker = HTMLElement & {
  map: GoogleMap | null;
};

export type GoogleInfoWindow = {
  close: () => void;
  setContent: (content: Node | string) => void;
  open: (options: {
    map: GoogleMap;
    anchor: GoogleAdvancedMarker;
    shouldFocus?: boolean;
  }) => void;
};

export type GoogleLatLng = {
  lat: () => number;
  lng: () => number;
};

export type GooglePlace = {
  formattedAddress?: string | null;
  location?: GoogleLatLng | null;
  fetchFields: (options: { fields: string[] }) => Promise<void>;
};

export type GooglePlacePrediction = {
  text: { toString: () => string };
  toPlace: () => GooglePlace;
};

export type GooglePlaceSelectEvent = Event & {
  placePrediction: GooglePlacePrediction;
};

export type GooglePlaceAutocompleteElement = HTMLElement & {
  noInputIcon: boolean;
  value: string;
  disabled: boolean;
  maxlength: number;
  includedRegionCodes: string[];
  locationBias: {
    center: MapPosition;
    radius: number;
  } | null;
  placeholder: string;
};

export type AddressComponent = {
  long_name: string;
  short_name: string;
  types: string[];
};

export type GeocoderResult = {
  formatted_address: string;
  address_components: AddressComponent[];
};

export type GoogleGeocoder = {
  geocode: (request: { location: MapPosition }) => Promise<{
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
            gestureHandling?: "greedy";
            disableDefaultUI: boolean;
            zoomControl: boolean;
            mapId: string;
          },
        ) => GoogleMap;
        Polyline: new (options: {
          map: GoogleMap;
          path: MapPosition[];
          strokeColor: string;
          strokeWeight: number;
        }) => { setMap: (map: GoogleMap | null) => void };
        LatLngBounds: new () => GoogleBounds;
        Geocoder: new () => GoogleGeocoder;
        InfoWindow: new () => GoogleInfoWindow;
        marker: {
          AdvancedMarkerElement: new (options: {
            map: GoogleMap;
            position: MapPosition;
            title: string;
            gmpClickable?: boolean;
            content?: Node;
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
          AutocompleteSessionToken: new () => object;
          AutocompleteSuggestion: {
            fetchAutocompleteSuggestions: (request: {
              input: string;
              sessionToken: object;
              includedRegionCodes: string[];
              locationBias: { center: MapPosition; radius: number };
            }) => Promise<{
              suggestions: { placePrediction?: GooglePlacePrediction }[];
            }>;
          };
          PlaceAutocompleteElement: new () => GooglePlaceAutocompleteElement;
        };
      };
    };
  }
}

export type GoogleBounds = { extend: (position: MapPosition) => void };
export type RouteLeg = {
  startLocation: { latLng: { latitude: number; longitude: number } };
  endLocation: { latLng: { latitude: number; longitude: number } };
  distanceMeters: number;
  duration: string;
};
export type RouteResult = {
  addresses: string[];
  savingsPercent: number;
  metric: Metric;
  route: {
    distanceMeters: number;
    duration: string;
    polyline: { geoJsonLinestring: { coordinates: [number, number][] } };
    legs: RouteLeg[];
    warnings?: string[];
  };
};
