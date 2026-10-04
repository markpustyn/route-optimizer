import assert from "node:assert/strict";
import { test } from "node:test";
import { checkRouteAccess } from "./route-access";

const requestFor = (count: number, roundTrip = false) =>
  new Request("http://localhost/api/optimize", {
    method: "POST",
    body: JSON.stringify({
      start: "Starting address",
      roundTrip,
      destinations: Array.from({ length: count }, (_, i) => `Stop ${i}`),
    }),
  });
const user = { email: "test@example.invalid" };

test("signed-out users are blocked before checking premium", async () => {
  const response = await checkRouteAccess(requestFor(16), null, async () => {
    throw new Error("Unexpected lookup");
  });
  assert.equal(response?.status, 401);
});

test("standard users can optimize 15 destinations without a premium lookup", async () => {
  const request = requestFor(15);
  assert.equal(
    await checkRouteAccess(request, user, async () => {
      throw new Error("Unexpected lookup");
    }),
    null,
  );
  assert.equal(
    (await request.json()).destinations.length,
    15,
    "body remains readable by route handler",
  );
});

for (const count of [16, 50]) {
  test(`${count} destinations require the server-stored premium role`, async () => {
    const response = await checkRouteAccess(
      requestFor(count),
      user,
      async (received) => {
        assert.equal(received, user);
        return false;
      },
    );
    assert.equal(response?.status, 403);
    assert.equal((await response!.json()).code, "PREMIUM_REQUIRED");
    assert.equal(
      await checkRouteAccess(requestFor(count), user, async () => true),
      null,
    );
  });
}

test("invalid input is left to existing validation", async () => {
  for (const request of [
    requestFor(51),
    new Request("http://localhost/api/optimize", {
      method: "POST",
      body: "invalid",
    }),
  ]) {
    assert.equal(
      await checkRouteAccess(request, user, async () => {
        throw new Error("Unexpected lookup");
      }),
      null,
    );
  }
});

test("return to start does not consume a free destination", async () => {
  const response = await checkRouteAccess(
    requestFor(15, true),
    user,
    async () => {
      throw new Error("15 destinations plus start and return must stay free");
    },
  );
  assert.equal(response, null);
  const denied = await checkRouteAccess(
    requestFor(16, true),
    user,
    async () => false,
  );
  assert.equal(denied?.status, 403);
});
