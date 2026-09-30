import { NextResponse } from "next/server";
import { optimizeOrder, routeCost } from "@/lib/optimizer";
import type { RouteResult } from "@/app/lib/types";

export const maxDuration = 60;
type Element = {
  originIndex?: number;
  destinationIndex?: number;
  status?: { code?: number };
  condition?: string;
  distanceMeters?: number;
  duration?: string;
};

async function googleRequest(
  endpoint: string,
  body: unknown,
  fields: string,
  key: string,
) {
  const response = await fetch(`https://routes.googleapis.com/${endpoint}`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "X-Goog-Api-Key": key,
      "X-Goog-FieldMask": fields,
    },
    body: JSON.stringify(body),
    signal: AbortSignal.timeout(25000),
    cache: "no-store",
  });
  if (!response.ok) {
    if (response.status === 403 || response.status === 401)
      throw new Error(
        "Google routing is not enabled. Enable Routes API and configure GOOGLE_MAPS_SERVER_API_KEY on the server.",
      );
    if (response.status === 429)
      throw new Error("Google routing quota reached. Please try again later.");
    throw new Error(
      "Google rejected the routing request or is temporarily unavailable. Please try again. If this continues, check the server's Routes API configuration.",
    );
  }
  return response.json();
}

export async function POST(request: Request) {
  let input;
  try {
    input = await request.json();
  } catch {
    return NextResponse.json({ error: "Invalid request." }, { status: 400 });
  }
  if (
    !input ||
    typeof input.start !== "string" ||
    !input.start.trim() ||
    !Array.isArray(input.destinations) ||
    input.destinations.length < 2 ||
    input.destinations.length > 50 ||
    !input.destinations.every(
      (a: unknown) =>
        typeof a === "string" && a.trim().length > 0 && a.length <= 300,
    ) ||
    input.start.length > 300 ||
    !["time", "distance"].includes(input.metric) ||
    typeof input.roundTrip !== "boolean" ||
    (input.reverseDirection !== undefined &&
      typeof input.reverseDirection !== "boolean")
  ) {
    return NextResponse.json(
      {
        error:
          "Enter a starting address and 2–50 destinations, each under 300 characters.",
      },
      { status: 400 },
    );
  }
  const key =
    process.env.GOOGLE_MAPS_SERVER_API_KEY ||
    process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY;
  if (!key)
    return NextResponse.json(
      { error: "Add GOOGLE_MAPS_SERVER_API_KEY to enable route optimization." },
      { status: 503 },
    );
  const addresses: string[] = [
    input.start.trim(),
    ...input.destinations.map((a: string) => a.trim()),
  ];
  try {
    const waypoints = addresses.map((address) => ({ waypoint: { address } }));
    // 25 x 25 respects both the 625-element and 50-address limits.
    const batches = [];
    for (
      let originOffset = 0;
      originOffset < waypoints.length;
      originOffset += 25
    ) {
      for (
        let destinationOffset = 0;
        destinationOffset < waypoints.length;
        destinationOffset += 25
      ) {
        batches.push({ originOffset, destinationOffset });
      }
    }
    const matrix = addresses.map(() => addresses.map(() => Infinity));
    await Promise.all(
      batches.map(async ({ originOffset, destinationOffset }) => {
        const origins = waypoints.slice(originOffset, originOffset + 25);
        const destinations = waypoints.slice(
          destinationOffset,
          destinationOffset + 25,
        );
        const elements: Element[] = await googleRequest(
          "distanceMatrix/v2:computeRouteMatrix",
          {
            origins,
            destinations,
            travelMode: "DRIVE",
            routingPreference: "TRAFFIC_UNAWARE",
          },
          "originIndex,destinationIndex,status,condition,distanceMeters,duration",
          key,
        );
        for (const e of elements) {
          const i = e.originIndex ?? 0,
            j = e.destinationIndex ?? 0;
          if (
            !Number.isInteger(i) ||
            !Number.isInteger(j) ||
            i < 0 ||
            j < 0 ||
            i >= origins.length ||
            j >= destinations.length
          ) {
            throw new Error(
              "Google returned an invalid route matrix. Please try again.",
            );
          }
          if (e.status?.code || e.condition !== "ROUTE_EXISTS") continue;
          const value =
            input.metric === "time"
              ? parseFloat(e.duration ?? "")
              : e.distanceMeters;
          if (value !== undefined && Number.isFinite(value) && value >= 0)
            matrix[originOffset + i][destinationOffset + j] = value;
        }
      }),
    );
    if (
      matrix.some((row, i) =>
        row.some((cost, j) => i !== j && !Number.isFinite(cost)),
      )
    )
      throw new Error(
        "Some destinations could not be connected by car. Check the addresses and keep stops within a connected driving region.",
      );
    const optimizedOrder = optimizeOrder(matrix, input.roundTrip);
    // Keep the origin fixed and recalculate driving directions for reversed stops.
    const order = input.reverseDirection
      ? [optimizedOrder[0], ...optimizedOrder.slice(1).reverse()]
      : optimizedOrder;
    const routeOrder = input.roundTrip ? [...order, 0] : order;
    const ordered = routeOrder.map((i) => ({ address: addresses[i] }));
    // Each segment has at most 25 intermediates (26 legs). Adjacent
    // segments share an endpoint so no stop or connecting leg is lost.
    const segments = [];
    for (let offset = 0; offset < ordered.length - 1; offset += 26) {
      segments.push(ordered.slice(offset, offset + 27));
    }
    const routes: RouteResult["route"][] = await Promise.all(
      segments.map(async (segment) => {
        const result = await googleRequest(
          "directions/v2:computeRoutes",
          {
            origin: segment[0],
            destination: segment[segment.length - 1],
            intermediates: segment.slice(1, -1),
            travelMode: "DRIVE",
            routingPreference: "TRAFFIC_UNAWARE",
            polylineEncoding: "GEO_JSON_LINESTRING",
          },
          "routes.distanceMeters,routes.duration,routes.polyline,routes.legs.startLocation,routes.legs.endLocation,routes.legs.distanceMeters,routes.legs.duration,routes.warnings",
          key,
        );
        const route = result.routes?.[0];
        if (!route)
          throw new Error("No driving route was found for these destinations.");
        if (route.legs?.length !== segment.length - 1) {
          throw new Error(
            "Google returned an incomplete driving route. Please try again.",
          );
        }
        return route;
      }),
    );
    const coordinates: [number, number][] = [];
    for (const part of routes) {
      const points = part.polyline.geoJsonLinestring.coordinates;
      const last = coordinates[coordinates.length - 1];
      const first = points[0];
      const sharedEndpoint =
        last && first && last[0] === first[0] && last[1] === first[1];
      coordinates.push(...(sharedEndpoint ? points.slice(1) : points));
    }
    const route: RouteResult["route"] = {
      distanceMeters: routes.reduce(
        (sum, part) => sum + part.distanceMeters,
        0,
      ),
      duration: `${routes.reduce((sum, part) => sum + parseFloat(part.duration), 0)}s`,
      legs: routes.flatMap((part) => part.legs),
      polyline: { geoJsonLinestring: { coordinates } },
      warnings: [...new Set(routes.flatMap((part) => part.warnings ?? []))],
    };
    const baseline = routeCost(
      addresses.map((_, i) => i),
      matrix,
      input.roundTrip,
    );
    const cost = routeCost(order, matrix, input.roundTrip);
    return NextResponse.json({
      route,
      addresses: routeOrder.map((i) => addresses[i]),
      savingsPercent:
        baseline > 0 ? Math.round(((baseline - cost) / baseline) * 100) : 0,
      metric: input.metric,
    });
  } catch (error) {
    return NextResponse.json(
      {
        error:
          error instanceof Error && error.name !== "TimeoutError"
            ? error.message
            : "Routing timed out. Please try again.",
      },
      { status: 502 },
    );
  }
}
