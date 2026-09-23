import { test } from "node:test";
import assert from "node:assert/strict";
import { optimizeOrder, routeCost } from "./optimizer";

test("cost includes directional edges and optional return leg", () => {
  const matrix = [
    [0, 2, 8],
    [7, 0, 3],
    [4, 9, 0],
  ];
  assert.equal(routeCost([0, 1, 2], matrix, false), 5);
  assert.equal(routeCost([0, 1, 2], matrix, true), 9);
});
test("reorders a ten-destination route to the shortest line traversal", () => {
  const positions = [0, 10, 1, 9, 2, 8, 3, 7, 4, 6, 5];
  const matrix = positions.map((a) => positions.map((b) => Math.abs(a - b)));
  const order = optimizeOrder(matrix, false);
  assert.equal(order[0], 0);
  assert.equal(new Set(order).size, 11);
  assert.equal(routeCost(order, matrix, false), 10);
  assert.equal(routeCost(optimizeOrder(matrix, true), matrix, true), 20);
});
test("24 destinations retain all stops and never worsen asymmetric input cost", () => {
  const matrix = Array.from({ length: 25 }, (_, i) =>
    Array.from({ length: 25 }, (_, j) =>
      i === j ? 0 : ((i * 31 + j * 17) % 97) + 1,
    ),
  );
  for (const roundTrip of [true, false]) {
    const order = optimizeOrder(matrix, roundTrip);
    assert.equal(order[0], 0);
    assert.deepEqual(
      [...order].sort((a, b) => a - b),
      Array.from({ length: 25 }, (_, i) => i),
    );
    assert.ok(
      routeCost(order, matrix, roundTrip) <=
        routeCost(
          Array.from({ length: 25 }, (_, i) => i),
          matrix,
          roundTrip,
        ),
    );
  }
});
