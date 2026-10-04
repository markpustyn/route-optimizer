import assert from "node:assert/strict";
import { test } from "node:test";
import { neonConfig } from "@neondatabase/serverless";
import { saveGoogleSignIn } from "./lib/google-user";

const valid = {
  account: {
    provider: "google",
    providerAccountId: "google-test-id",
    type: "oidc" as const,
  },
  profile: { sub: "google-test-id", email_verified: true },
  user: {
    id: "google-test-id",
    name: "Test User",
    email: "test@example.invalid",
    image: "https://example.invalid/avatar.png",
  },
};

test("rejects missing or unverified Google identity before saving", async () => {
  const callback = saveGoogleSignIn;
  assert.equal(await callback({ ...valid, account: null }), false);
  assert.equal(
    await callback({
      ...valid,
      account: { ...valid.account, provider: "other" },
    }),
    false,
  );
  assert.equal(
    await callback({
      ...valid,
      account: { ...valid.account, providerAccountId: "" },
    }),
    false,
  );
  assert.equal(
    await callback({
      ...valid,
      profile: { ...valid.profile, email_verified: false },
    }),
    false,
  );
  assert.equal(
    await callback({ ...valid, user: { ...valid.user, email: null } }),
    false,
  );
});

test("saves signup and repeat sign-in with an atomic Google-ID upsert", async (t) => {
  const originalUrl = process.env.NEXT_PUBLIC_DATABASE_URL;
  process.env.NEXT_PUBLIC_DATABASE_URL =
    "postgresql://test:test@unit-test.neon.tech/test";
  const originalFetch = neonConfig.fetchFunction;
  t.after(() => {
    neonConfig.fetchFunction = originalFetch;
    if (originalUrl === undefined) delete process.env.NEXT_PUBLIC_DATABASE_URL;
    else process.env.NEXT_PUBLIC_DATABASE_URL = originalUrl;
  });
  const requests: { query: string; params: unknown[] }[] = [];
  neonConfig.fetchFunction = async (
    _url: RequestInfo | URL,
    options?: RequestInit,
  ) => {
    requests.push(JSON.parse(options?.body as string));
    return Response.json({
      fields: [],
      rows: [],
      rowCount: 1,
      command: "INSERT",
    });
  };
  assert.equal(await saveGoogleSignIn(valid), true);
  assert.equal(
    await saveGoogleSignIn({
      ...valid,
      user: { ...valid.user, name: "Updated Name" },
    }),
    true,
  );
  assert.equal(requests.length, 2);
  for (const request of requests) {
    assert.match(request.query, /on conflict \("google_id"\) do update set/i);
    assert.ok(request.params.includes("google-test-id"));
    const update = request.query.split(/do update set/i)[1];
    assert.ok(!update.includes("created_at"));
    assert.ok(!update.includes("saved_address"));
  }
  assert.ok(requests[1].params.includes("Updated Name"));
  neonConfig.fetchFunction = async () => {
    throw new Error("Simulated database outage");
  };
  t.mock.method(console, "error", () => {});
  assert.equal(await saveGoogleSignIn(valid), "/map?error=UserSaveFailed");
});
