import type { Route } from "./+types/api.settings.mcp-test";
import { requireAuth } from "~/services/session.server";
import { McpClient } from "~/services/mcp-client.server";

// ---------------------------------------------------------------------------
// POST -- Test MCP server connection
// ---------------------------------------------------------------------------

export async function action({ request }: Route.ActionArgs) {
  if (request.method !== "POST") {
    return Response.json({ error: "Method not allowed" }, { status: 405 });
  }

  await requireAuth(request);

  const body = await request.json();
  const { url, headers } = body as {
    url: string;
    headers?: Record<string, string>;
  };

  if (!url) {
    return Response.json(
      { error: "URL is required" },
      { status: 400 }
    );
  }

  const client = new McpClient({
    name: "test",
    url,
    headers,
    enabled: true,
  });

  try {
    await client.initialize();
    const tools = await client.listTools();
    const toolNames = tools.map((t) => t.name);

    await client.close();

    return Response.json({
      success: true,
      message: `Connected. Found ${toolNames.length} tool(s).`,
      tools: toolNames,
    });
  } catch (error) {
    try {
      await client.close();
    } catch {
      // Ignore close errors
    }

    return Response.json(
      {
        success: false,
        message:
          error instanceof Error
            ? error.message
            : "Failed to connect to MCP server",
        error:
          error instanceof Error ? error.message : "Connection failed",
      },
      { status: 500 }
    );
  }
}
