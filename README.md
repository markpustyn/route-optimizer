# Waypoint

A simple driving-route planner built from the existing Next.js template. Enter a start and 2–24 destinations (one full address per line), choose time or distance, and optimize. Includes an optional return to start, a route map, ordered stops, estimated totals, per-leg Google Maps navigation, and a text download. The sample fills in ten Sacramento destinations.

## Run

```sh
npm install
npm run dev
```

Keep the existing `.env.local` and all Supabase/Postgres settings. Database clients, schema, migrations, and existing `/api/codes` and `/api/rating` endpoints are unchanged. The planner does not require new tables or write routes to the database.

## Google Maps setup

- Existing `NEXT_PUBLIC_GOOGLE_MAPS_API_KEY`: enable Maps JavaScript API and restrict this browser key to your website origins.
- Add `GOOGLE_MAPS_SERVER_API_KEY` to `.env.local`: enable Routes API with billing and restrict this separate server key to Routes API (and server IPs where applicable). Never prefix the server key with `NEXT_PUBLIC_`.
- Optional `NEXT_PUBLIC_GOOGLE_MAPS_MAP_ID`; otherwise the map uses `DEMO_MAP_ID`.
- For compatibility, routing falls back to the existing Maps key if no server key is configured. Browser-referrer restrictions usually prevent server requests; configure the separate server key if routing reports an authorization error.

The server requests a road-distance/time matrix, improves the destination order using multi-start nearest-neighbor and directed 2-opt, then requests the driving route for that order. Time and distance are selectable objectives; distance means distance along Google's returned driving paths, not an exhaustive search over all roads. The algorithm is approximate and never worsens the entered order's selected matrix cost. Estimates exclude live traffic. Percentage savings compare matrix costs, while displayed totals come from the final route.

At the maximum size, each optimization requests 625 matrix elements plus one route; Google API charges and quotas apply. Stops must be connected by car. Before a public launch, configure provider quotas and deployment-level rate limits for the routing endpoint.

References: [Route matrix](https://developers.google.com/maps/documentation/routes/compute_route_matrix), [Compute routes](https://developers.google.com/maps/documentation/routes/reference/rest/v2/TopLevel/computeRoutes).

## Verify

```sh
npm test
npm run lint
npm run build
```

Tests cover ten-stop optimization, 24-stop asymmetric costs, round trips, API validation, and a mocked Google integration. Live Google routing requires enabled APIs and valid credentials.
