import assert from "node:assert/strict";
import test from "node:test";
import { resolveMcpServerForProxy } from "./mcp-proxy-server-resolver";
import type { McpServerConfig } from "~/types/settings";

const servers: McpServerConfig[] = [
  {
    id: "alpha",
    name: "Alpha",
    url: "https://alpha.example/mcp",
    headers: {
      Authorization: "Bearer token",
      "X-Env": "prod",
    },
  },
];

test("resolveMcpServerForProxy: resolves by serverId when URL/headers match", () => {
  const result = resolveMcpServerForProxy({
    servers,
    serverId: "alpha",
    serverUrl: "https://alpha.example/mcp",
    serverHeaders: {
      authorization: "Bearer token",
      "x-env": "prod",
    },
  });
  assert.equal(result.error, undefined);
  assert.equal(result.matchedServer?.id, "alpha");
});

test("resolveMcpServerForProxy: returns 404 when serverId is unknown", () => {
  const result = resolveMcpServerForProxy({
    servers,
    serverId: "missing",
    serverUrl: "https://alpha.example/mcp",
    serverHeaders: {
      Authorization: "Bearer token",
      "X-Env": "prod",
    },
  });
  assert.equal(result.matchedServer, undefined);
  assert.equal(result.error?.status, 404);
});

test("resolveMcpServerForProxy: returns 400 when serverId does not match URL", () => {
  const result = resolveMcpServerForProxy({
    servers,
    serverId: "alpha",
    serverUrl: "https://different.example/mcp",
    serverHeaders: {
      Authorization: "Bearer token",
      "X-Env": "prod",
    },
  });
  assert.equal(result.matchedServer, undefined);
  assert.equal(result.error?.status, 400);
  assert.equal(result.error?.message, "serverId does not match serverUrl");
});

test("resolveMcpServerForProxy: returns 400 when serverId does not match headers", () => {
  const result = resolveMcpServerForProxy({
    servers,
    serverId: "alpha",
    serverUrl: "https://alpha.example/mcp",
    serverHeaders: {
      Authorization: "Bearer token",
      "X-Env": "staging",
    },
  });
  assert.equal(result.matchedServer, undefined);
  assert.equal(result.error?.status, 400);
  assert.equal(result.error?.message, "serverId does not match serverHeaders");
});

test("resolveMcpServerForProxy: resolves by URL+headers when serverId is omitted", () => {
  const result = resolveMcpServerForProxy({
    servers,
    serverUrl: "https://alpha.example/mcp",
    serverHeaders: {
      "x-env": "prod",
      authorization: "Bearer token",
    },
  });
  assert.equal(result.error, undefined);
  assert.equal(result.matchedServer?.id, "alpha");
});

test("resolveMcpServerForProxy: no match without serverId returns empty result", () => {
  const result = resolveMcpServerForProxy({
    servers,
    serverUrl: "https://unknown.example/mcp",
    serverHeaders: {
      Authorization: "Bearer token",
    },
  });
  assert.equal(result.error, undefined);
  assert.equal(result.matchedServer, undefined);
});
