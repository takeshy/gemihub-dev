import assert from "node:assert/strict";
import test from "node:test";
import { calculateChecksum } from "./file-search.server.ts";

test("calculateChecksum matches for string and bytes", async () => {
  const text = "Hello, RAG!";
  const bytes = new TextEncoder().encode(text);
  const checksumFromString = await calculateChecksum(text);
  const checksumFromBytes = await calculateChecksum(bytes);
  assert.equal(checksumFromString, checksumFromBytes);
});
