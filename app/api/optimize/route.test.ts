import { test } from "node:test";
import assert from "node:assert/strict";
import { POST } from "./route";

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
                legs: [],
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
