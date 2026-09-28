import { NextResponse } from "next/server";
import { optimizeOrder, routeCost } from "@/lib/optimizer";

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
      "Google could not calculate this route. Check that every address is complete and reachable by car.",
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
    input.destinations.length > 24 ||
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
          "Enter a starting address and 2–24 destinations, each under 300 characters.",
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
  if (new Set(addresses.map((a) => a.toLowerCase())).size !== addresses.length)
    return NextResponse.json(
      {
        error:
          "Remove duplicate addresses. Use Return to start for a round trip.",
      },
      { status: 400 },
    );
  try {
    const waypoints = addresses.map((address) => ({ waypoint: { address } }));
    const elements: Element[] = await googleRequest(
      "distanceMatrix/v2:computeRouteMatrix",
      {
        origins: waypoints,
        destinations: waypoints,
        travelMode: "DRIVE",
        routingPreference: "TRAFFIC_UNAWARE",
      },
      "originIndex,destinationIndex,status,condition,distanceMeters,duration",
      key,
    );
    const matrix = addresses.map(() => addresses.map(() => Infinity));
    for (const e of elements) {
      const i = e.originIndex ?? 0,
        j = e.destinationIndex ?? 0;
      if (e.status?.code || e.condition !== "ROUTE_EXISTS") continue;
      const value =
        input.metric === "time"
          ? parseFloat(e.duration ?? "")
          : e.distanceMeters;
      if (value !== undefined && Number.isFinite(value) && value >= 0)
        matrix[i][j] = value;
    }
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
    const result = await googleRequest(
      "directions/v2:computeRoutes",
      {
        origin: ordered[0],
        destination: ordered[ordered.length - 1],
        intermediates: ordered.slice(1, -1),
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
