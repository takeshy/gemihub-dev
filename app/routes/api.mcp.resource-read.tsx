import type { Route } from "./+types/api.mcp.resource-read";
import { requireAuth } from "~/services/session.server";
import { getValidTokens } from "~/services/google-auth.server";
import { getSettings, saveSettings } from "~/services/user-settings.server";
import { getOrCreateClient } from "~/services/mcp-tools.server";
import { validateMcpServerUrl } from "~/services/url-validator.server";
import { resolveMcpServerForProxy } from "~/services/mcp-proxy-server-resolver";
import type { McpServerConfig } from "~/types/settings";

/**
 * Server-side proxy for reading MCP resources (used by McpAppRenderer as fallback).
 * Reuses cached MCP clients to avoid re-initializing on every request (prevents 429).
 */
export async function action({ request }: Route.ActionArgs) {
  if (request.method !== "POST") {
    return new Response("Method not allowed", { status: 405 });
  }

  const tokens = await requireAuth(request);
  const { tokens: validTokens, setCookieHeader } = await getValidTokens(request, tokens);
  const responseHeaders = setCookieHeader ? { "Set-Cookie": setCookieHeader } : undefined;

  const body = await request.json();
  const { serverId, serverUrl, serverHeaders, resourceUri } = body as {
    serverId?: string;
    serverUrl: string;
    serverHeaders?: Record<string, string>;
    resourceUri: string;
  };

  if (!serverUrl || !resourceUri) {
    return Response.json(
      { error: "serverUrl and resourceUri are required" },
      { status: 400, headers: responseHeaders }
    );
  }

  try {
    validateMcpServerUrl(serverUrl);
  } catch (error) {
    return Response.json(
      { error: error instanceof Error ? error.message : "Invalid server URL" },
      { status: 400, headers: responseHeaders }
    );
  }

  try {
    const settings = await getSettings(validTokens.accessToken, validTokens.rootFolderId);
    const resolved = resolveMcpServerForProxy({
      servers: settings.mcpServers,
      serverId,
      serverUrl,
      serverHeaders,
    });
    if (resolved.error) {
      return Response.json(
        { error: resolved.error.message },
        { status: resolved.error.status, headers: responseHeaders }
      );
    }
    const matchedServer = resolved.matchedServer;

    const tokenBefore = matchedServer
      ? JSON.stringify(matchedServer.oauthTokens ?? null)
      : null;

    const config: McpServerConfig = matchedServer ? matchedServer : {
      name: "mcp-resource-proxy",
      url: serverUrl,
      headers: serverHeaders,
    };

    const client = await getOrCreateClient(config);
    const resource = await client.readResource(resourceUri);

    if (matchedServer && tokenBefore !== JSON.stringify(matchedServer.oauthTokens ?? null)) {
      await saveSettings(validTokens.accessToken, validTokens.rootFolderId, settings);
    }

    if (!resource) {
      return Response.json({ error: "Resource not found" }, { status: 404, headers: responseHeaders });
    }

    return Response.json(resource, { headers: responseHeaders });
  } catch (error) {
    return Response.json(
      { error: error instanceof Error ? error.message : "Resource read failed" },
      { status: 500, headers: responseHeaders }
    );
  }
}
