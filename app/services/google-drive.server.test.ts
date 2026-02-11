import assert from "node:assert/strict";
import test from "node:test";
import { readFileBytes } from "./google-drive.server.ts";

test("readFileBytes returns raw bytes", async () => {
  const originalFetch = globalThis.fetch;
  const payload = new Uint8Array([0, 255, 16, 32, 128]);

  globalThis.fetch = async (url, options) => {
    assert.equal(url, "https://www.googleapis.com/drive/v3/files/file123?alt=media");
    const headers = options?.headers as Record<string, string> | undefined;
    assert.equal(headers?.Authorization, "Bearer token");
    return new Response(payload, { status: 200 });
  };

  try {
    const result = await readFileBytes("token", "file123");
    assert.deepEqual(Array.from(result), Array.from(payload));
  } finally {
    globalThis.fetch = originalFetch;
  }
});
