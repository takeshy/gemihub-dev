import type { McpServerConfig } from "~/types/settings";

export interface McpProxyResolveError {
  status: 400 | 404;
  message: string;
}

export interface McpProxyResolveResult {
  matchedServer?: McpServerConfig;
  error?: McpProxyResolveError;
}

export interface ResolveMcpServerForProxyInput {
  servers: McpServerConfig[];
  serverId?: string;
  serverUrl: string;
  serverHeaders?: Record<string, string>;
}

export function canonicalizeHeaders(headers?: Record<string, string>): string {
  if (!headers) return "";
  return JSON.stringify(
    Object.entries(headers)
      .map(([k, v]) => [k.toLowerCase(), v] as const)
      .sort(([a], [b]) => a.localeCompare(b))
  );
}

export function resolveMcpServerForProxy(
  input: ResolveMcpServerForProxyInput
): McpProxyResolveResult {
  const { servers, serverId, serverUrl, serverHeaders } = input;
  const targetHeaderSig = canonicalizeHeaders(serverHeaders);

  if (serverId) {
    const matchedById = servers.find((s) => s.id === serverId);
    if (!matchedById) {
      return {
        error: {
          status: 404,
          message: `MCP server not found for serverId: ${serverId}`,
        },
      };
    }
    if (matchedById.url !== serverUrl) {
      return {
        error: {
          status: 400,
          message: "serverId does not match serverUrl",
        },
      };
    }
    if (canonicalizeHeaders(matchedById.headers) !== targetHeaderSig) {
      return {
        error: {
          status: 400,
          message: "serverId does not match serverHeaders",
        },
      };
    }
    return { matchedServer: matchedById };
  }

  const matchedByAddress = servers.find(
    (s) => s.url === serverUrl && canonicalizeHeaders(s.headers) === targetHeaderSig
  );
  return matchedByAddress ? { matchedServer: matchedByAddress } : {};
}
