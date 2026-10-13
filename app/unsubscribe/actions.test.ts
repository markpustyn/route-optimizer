import assert from "node:assert/strict";
import { test } from "node:test";
import { unsubscribe } from "./actions";

test("unsubscribe validates input and handles Resend responses without exposing contacts", async () => {
  const originalFetch = globalThis.fetch;
  const originalKey = process.env.RESEND_API_KEY;
  const initial = { status: "idle" as const, message: "" };
  const form = new FormData();
  form.set("email", " Person+news@example.com ");
  try {
    process.env.RESEND_API_KEY = "test-key";
    let status = 200;
    let calls = 0;
    globalThis.fetch = async (url, options) => {
      calls++;
      assert.equal(
        url,
        "https://api.resend.com/contacts/Person%2Bnews%40example.com",
      );
      assert.equal(options?.method, "PATCH");
      assert.equal(options?.body, '{"unsubscribed":true}');
      assert.equal(
        new Headers(options?.headers).get("Authorization"),
        "Bearer test-key",
      );
      return new Response(null, { status });
    };
    const success = await unsubscribe(initial, form);
    assert.equal(success.status, "success");
    status = 404;
    assert.deepEqual(await unsubscribe(initial, form), success);
    status = 429;
    assert.equal((await unsubscribe(initial, form)).status, "error");
    delete process.env.RESEND_API_KEY;
    assert.equal((await unsubscribe(initial, form)).status, "error");
    process.env.RESEND_API_KEY = "test-key";
    form.set("email", "invalid");
    assert.equal((await unsubscribe(initial, form)).status, "error");
    assert.equal(calls, 3);
    form.set("email", "person@example.com");
    globalThis.fetch = async () => {
      throw new Error("Network unavailable");
    };
    assert.equal((await unsubscribe(initial, form)).status, "error");
  } finally {
    globalThis.fetch = originalFetch;
    if (originalKey === undefined) delete process.env.RESEND_API_KEY;
    else process.env.RESEND_API_KEY = originalKey;
  }
});
