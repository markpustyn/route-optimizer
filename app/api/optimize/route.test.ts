import { test, beforeEach, afterEach } from "node:test";
import assert from "node:assert/strict";
import { POST } from "./route";

let affordableOrder: string[];
for (const reverseDirection of [false, true]) {
  test(`affordable default uses linear lookups for 50 stops, reverse ${reverseDirection}`, async (t) => {
    delete process.env.ROUTE_OPTIMIZATION_MODE;
    const originalKey = process.env.GOOGLE_MAPS_SERVER_API_KEY;
    process.env.GOOGLE_MAPS_SERVER_API_KEY = "test-key";
    t.after(() => {
      if (originalKey === undefined)
        delete process.env.GOOGLE_MAPS_SERVER_API_KEY;
      else process.env.GOOGLE_MAPS_SERVER_API_KEY = originalKey;
    });
    let geocodes = 0,
      directions = 0;
    t.mock.method(
      globalThis,
      "fetch",
      async (url: string, options: RequestInit) => {
        assert.ok(
          !url.includes("computeRouteMatrix"),
          "default must never purchase a matrix",
        );
        if (url.includes("geocode/json")) {
          geocodes++;
          const stop = Number(new URL(url).searchParams.get("address"));
          return Response.json({
            status: "OK",
            results: [{ geometry: { location: { lat: 0, lng: stop / 100 } } }],
          });
        }
        directions++;
        const body = JSON.parse(options.body as string);
        assert.ok(body.intermediates.length <= 10);
        return Response.json({
          routes: [
            {
              distanceMeters: 100,
              duration: "10s",
              legs: Array.from(
                { length: body.intermediates.length + 1 },
                () => ({}),
              ),
              polyline: { geoJsonLinestring: { coordinates: [] } },
            },
          ],
        });
      },
    );
    const response = await POST(
      new Request("http://localhost/api/optimize", {
        method: "POST",
        body: JSON.stringify({
          start: "0",
          destinations: Array.from({ length: 50 }, (_, i) => String(i + 1)),
          metric: "time",
          roundTrip: true,
          reverseDirection,
        }),
      }),
    );
    assert.equal(response.status, 200);
    const result = await response.json();
    const stops = Array.from({ length: 50 }, (_, i) => String(i + 1));
    assert.equal(result.addresses[0], "0");
    assert.equal(result.addresses.at(-1), "0");
    assert.deepEqual(result.addresses.slice(1, -1).sort(), stops.sort());
    if (reverseDirection) {
      assert.deepEqual(
        result.addresses.slice(1, -1),
        affordableOrder.slice(1, -1).reverse(),
      );
    } else {
      affordableOrder = result.addresses;
    }
    assert.equal(result.savingsPercent, null);
    assert.equal(geocodes, 51);
    assert.equal(directions, 5);
    assert.equal(result.route.legs.length, 51);
  });
}

let originalMode: string | undefined;
beforeEach(() => {
  originalMode = process.env.ROUTE_OPTIMIZATION_MODE;
  process.env.ROUTE_OPTIMIZATION_MODE = "road-matrix";
});
afterEach(() => {
  if (originalMode === undefined) delete process.env.ROUTE_OPTIMIZATION_MODE;
  else process.env.ROUTE_OPTIMIZATION_MODE = originalMode;
});

const matrix = [
  [0, 1, 9],
  [9, 0, 1],
  [1, 9, 0],
];
for (const roundTrip of [false, true]) {
  for (const reverseDirection of [undefined, false, true]) {
    test(`direction ${reverseDirection}, round trip ${roundTrip}`, async (t) => {
      const originalKey = process.env.GOOGLE_MAPS_SERVER_API_KEY;
      process.env.GOOGLE_MAPS_SERVER_API_KEY = "test-key";
      t.after(() => {
        if (originalKey === undefined)
          delete process.env.GOOGLE_MAPS_SERVER_API_KEY;
        else process.env.GOOGLE_MAPS_SERVER_API_KEY = originalKey;
      });
      const calls: {
        origin: { address: string };
        destination: { address: string };
        intermediates: { address: string }[];
      }[] = [];
      t.mock.method(
        globalThis,
        "fetch",
        async (url: string, options: RequestInit) => {
          if (url.includes("computeRouteMatrix")) {
            return Response.json(
              matrix.flatMap((row, originIndex) =>
                row.map((cost, destinationIndex) => ({
                  originIndex,
                  destinationIndex,
                  condition: "ROUTE_EXISTS",
                  duration: `${cost}s`,
                  distanceMeters: cost,
                })),
              ),
            );
          }
          calls.push(JSON.parse(options.body as string));
          return Response.json({
            routes: [
              {
                distanceMeters: 123,
                duration: "45s",
                legs: Array.from(
                  { length: calls[calls.length - 1].intermediates.length + 1 },
                  () => ({}),
                ),
                polyline: { geoJsonLinestring: { coordinates: [] } },
              },
            ],
          });
        },
      );
      const response = await POST(
        new Request("http://localhost/api/optimize", {
          method: "POST",
          body: JSON.stringify({
            start: "Start",
            destinations: ["A", "B"],
            metric: "time",
            roundTrip,
            reverseDirection,
          }),
        }),
      );
      assert.equal(response.status, 200);
      const result = await response.json();
      const expected = reverseDirection
        ? ["Start", "B", "A"]
        : ["Start", "A", "B"];
      if (roundTrip) expected.push("Start");
      assert.deepEqual(result.addresses, expected);
      assert.equal(calls.length, 1);
      assert.deepEqual(
        [calls[0].origin, ...calls[0].intermediates, calls[0].destination].map(
          (stop) => stop.address,
        ),
        expected,
      );
      assert.equal(result.savingsPercent, reverseDirection ? -800 : 0);
    });
  }
}

test("rejects an invalid direction before contacting Google", async (t) => {
  const fetchMock = t.mock.method(globalThis, "fetch", async () => {
    throw new Error("Unexpected request");
  });
  const response = await POST(
    new Request("http://localhost/api/optimize", {
      method: "POST",
      body: JSON.stringify({
        start: "Start",
        destinations: ["A", "B"],
        metric: "time",
        roundTrip: true,
        reverseDirection: "yes",
      }),
    }),
  );
  assert.equal(response.status, 400);
  assert.equal(fetchMock.mock.callCount(), 0);
});

for (const count of [24, 25, 26, 27, 50]) {
  for (const roundTrip of [false, true]) {
    test(`batches ${count} destinations, round trip ${roundTrip}`, async (t) => {
      const originalKey = process.env.GOOGLE_MAPS_SERVER_API_KEY;
      process.env.GOOGLE_MAPS_SERVER_API_KEY = "test-key";
      t.after(() => {
        if (originalKey === undefined)
          delete process.env.GOOGLE_MAPS_SERVER_API_KEY;
        else process.env.GOOGLE_MAPS_SERVER_API_KEY = originalKey;
      });
      const pairs = new Set<string>();
      const routed: number[] = [];
      let matrixCalls = 0;
      let routeCalls = 0;
      t.mock.method(
        globalThis,
        "fetch",
        async (url: string, options: RequestInit) => {
          const body = JSON.parse(options.body as string);
          if (url.includes("computeRouteMatrix")) {
            matrixCalls++;
            const origins: { waypoint: { address: string } }[] = body.origins;
            const destinations: { waypoint: { address: string } }[] =
              body.destinations;
            assert.ok(origins.length + destinations.length <= 50);
            assert.ok(origins.length * destinations.length <= 625);
            return Response.json(
              origins
                .flatMap((origin, originIndex) =>
                  destinations.map((destination, destinationIndex) => {
                    const i = Number(origin.waypoint.address),
                      j = Number(destination.waypoint.address);
                    assert.ok(!pairs.has(i + ":" + j));
                    pairs.add(i + ":" + j);
                    const cost =
                      i === j
                        ? 0
                        : j === i + 1 || (i === count && j === 0)
                          ? 1
                          : 1000;
                    return {
                      originIndex,
                      destinationIndex,
                      condition: "ROUTE_EXISTS",
                      duration: cost + "s",
                      distanceMeters: cost * 10,
                    };
                  }),
                )
                .reverse(),
            );
          }
          routeCalls++;
          assert.ok(body.intermediates.length <= 10);
          const stops = [
            body.origin,
            ...body.intermediates,
            body.destination,
          ].map((stop) => Number(stop.address));
          if (routed.length) assert.equal(routed[routed.length - 1], stops[0]);
          routed.push(...(routed.length ? stops.slice(1) : stops));
          return Response.json({
            routes: [
              {
                distanceMeters: (stops.length - 1) * 10,
                duration: (stops.length - 1) * 1.5 + "s",
                legs: stops.slice(1).map((stop, i) => ({
                  startLocation: {
                    latLng: { latitude: 0, longitude: stops[i] },
                  },
                  endLocation: { latLng: { latitude: 0, longitude: stop } },
                  distanceMeters: 10,
                  duration: "1.5s",
                })),
                polyline: {
                  geoJsonLinestring: {
                    coordinates: stops.map((stop) => [stop, 0]),
                  },
                },
                warnings: ["Shared warning"],
              },
            ],
          });
        },
      );
      const response = await POST(
        new Request("http://localhost/api/optimize", {
          method: "POST",
          body: JSON.stringify({
            start: "0",
            destinations: Array.from({ length: count }, (_, i) =>
              String(i + 1),
            ),
            metric: "distance",
            roundTrip,
          }),
        }),
      );
      assert.equal(response.status, 200);
      const result = await response.json();
      const expected = Array.from({ length: count + 1 }, (_, i) => i);
      if (roundTrip) expected.push(0);
      assert.deepEqual(result.addresses, expected.map(String));
      assert.deepEqual(routed, expected);
      assert.equal(pairs.size, (count + 1) ** 2);
      assert.equal(matrixCalls, Math.ceil((count + 1) / 25) ** 2);
      assert.equal(routeCalls, Math.ceil((expected.length - 1) / 11));
      assert.equal(result.route.legs.length, expected.length - 1);
      assert.equal(result.route.distanceMeters, (expected.length - 1) * 10);
      assert.equal(result.route.duration, (expected.length - 1) * 1.5 + "s");
      assert.deepEqual(
        result.route.polyline.geoJsonLinestring.coordinates,
        expected.map((stop) => [stop, 0]),
      );
      assert.deepEqual(result.route.warnings, ["Shared warning"]);
      assert.equal(result.savingsPercent, 0);
    });
  }
}

test("rejects more than 50 destinations before contacting Google", async (t) => {
  const mock = t.mock.method(globalThis, "fetch", async () => {
    throw new Error("Unexpected request");
  });
  const response = await POST(
    new Request("http://localhost/api/optimize", {
      method: "POST",
      body: JSON.stringify({
        start: "Start",
        destinations: Array.from({ length: 51 }, (_, i) => String(i)),
        metric: "time",
        roundTrip: false,
      }),
    }),
  );
  assert.equal(response.status, 400);
  assert.match((await response.json()).error, /2–50/);
  assert.equal(mock.mock.callCount(), 0);
});
