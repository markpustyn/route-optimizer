import assert from "node:assert/strict";
import { test } from "node:test";
import { neonConfig } from "@neondatabase/serverless";

test("premium access depends on this user's stored role and fails closed", async (t) => {
  const originalUrl = process.env.DATABASE_URL;
  const originalFetch = neonConfig.fetchFunction;
  process.env.DATABASE_URL =
    "postgresql://test:test@unit-test.neon.tech/test";
  t.after(() => {
    neonConfig.fetchFunction = originalFetch;
    if (originalUrl === undefined) delete process.env.DATABASE_URL;
    else process.env.DATABASE_URL = originalUrl;
  });
  let rows: (string | null)[][] = [];
  let requests = 0;
  neonConfig.fetchFunction = async (
    _url: RequestInfo | URL,
    options?: RequestInit,
  ) => {
    requests++;
    const body = JSON.parse(options?.body as string);
    assert.match(body.query, /where "user"\."email" = \$1/);
    assert.equal(body.params[0], "test@example.invalid");
    return Response.json({
      fields: [
        { name: "role", dataTypeID: 1043 },
        { name: "stripe_customer_id", dataTypeID: 1043 },
        { name: "premium_until", dataTypeID: 1184 },
      ],
      rows,
      rowCount: rows.length,
      command: "SELECT",
    });
  };
  const { isPremiumUser } = await import("./premium");
  for (const user of [null, undefined, {}, { email: null }, { email: "" }]) {
    assert.equal(await isPremiumUser(user), false);
  }
  assert.equal(requests, 0);
  const user = { email: "test@example.invalid", role: "premium" };
  for (const stored of [[], [["standard"]], [[null]]]) {
    rows = stored;
    assert.equal(await isPremiumUser(user), false);
  }
  rows = [["premium"]];
  assert.equal(await isPremiumUser(user), true);
  rows = [["premium", "cus_test", new Date(Date.now() + 60000).toISOString()]];
  assert.equal(await isPremiumUser(user), true);
  rows = [["premium", "cus_test", new Date(Date.now() - 60000).toISOString()]];
  assert.equal(await isPremiumUser(user), false);
  rows = [["premium", "cus_test", null]];
  assert.equal(await isPremiumUser(user), false);
  neonConfig.fetchFunction = async () => {
    throw new Error("Database unavailable");
  };
  t.mock.method(console, "error", () => {});
  assert.equal(await isPremiumUser(user), false);
});
