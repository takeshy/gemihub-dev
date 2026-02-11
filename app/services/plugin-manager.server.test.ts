import assert from "node:assert/strict";
import test from "node:test";
import {
  PluginClientError,
  parsePluginManifest,
} from "./plugin-manager.server.ts";

test("parsePluginManifest parses valid manifest", () => {
  const manifest = parsePluginManifest(
    JSON.stringify({
      id: "my-plugin",
      name: "My Plugin",
      version: "1.2.3",
      minAppVersion: "1.0.0",
      description: "desc",
      author: "author",
    })
  );
  assert.equal(manifest.id, "my-plugin");
  assert.equal(manifest.name, "My Plugin");
});

test("parsePluginManifest throws PluginClientError on malformed JSON", () => {
  assert.throws(
    () => parsePluginManifest("{ invalid json"),
    (err) =>
      err instanceof PluginClientError &&
      /must be valid JSON/.test(err.message)
  );
});

test("parsePluginManifest throws PluginClientError on manifest id mismatch", () => {
  assert.throws(
    () =>
      parsePluginManifest(
        JSON.stringify({
          id: "other-plugin",
          name: "Other Plugin",
          version: "1.2.3",
          minAppVersion: "1.0.0",
          description: "desc",
          author: "author",
        }),
        "expected-plugin"
      ),
    (err) =>
      err instanceof PluginClientError &&
      /manifest ID mismatch/.test(err.message)
  );
});

test("parsePluginManifest throws PluginClientError on invalid id characters", () => {
  assert.throws(
    () =>
      parsePluginManifest(
        JSON.stringify({
          id: "../bad",
          name: "Bad Plugin",
          version: "1.0.0",
          minAppVersion: "1.0.0",
          description: "desc",
          author: "author",
        })
      ),
    (err) =>
      err instanceof PluginClientError &&
      /may contain only letters, numbers, dot, underscore, and hyphen/.test(
        err.message
      )
  );
});
