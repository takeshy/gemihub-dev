// MCP tools integration with Gemini Function Calling

import { McpClient } from "./mcp-client.server";
import type {
  McpServerConfig,
  McpToolInfo,
  ToolDefinition,
  ToolPropertyDefinition,
} from "~/types/settings";

// Cache of MCP clients per session
const mcpClients = new Map<string, McpClient>();

function getClientKey(config: McpServerConfig): string {
  return `${config.name}:${config.url}`;
}

function getOrCreateClient(config: McpServerConfig): McpClient {
  const key = getClientKey(config);
  let client = mcpClients.get(key);
  if (!client) {
    client = new McpClient(config);
    mcpClients.set(key, client);
  }
  return client;
}

/**
 * Get tool definitions from all enabled MCP servers, formatted for Gemini Function Calling.
 * Tool names are prefixed with mcp_{serverName}_ to avoid collisions.
 */
export async function getMcpToolDefinitions(
  mcpServers: McpServerConfig[]
): Promise<ToolDefinition[]> {
  const allTools: ToolDefinition[] = [];

  for (const server of mcpServers) {
    if (!server.enabled) continue;

    try {
      const client = getOrCreateClient(server);
      const tools = await client.listTools();

      for (const tool of tools) {
        const toolDef = mcpToolInfoToDefinition(server.name, tool);
        allTools.push(toolDef);
      }
    } catch (error) {
      console.error(`Failed to get tools from MCP server ${server.name}:`, error);
    }
  }

  return allTools;
}

/**
 * Convert MCP tool info to Gemini ToolDefinition
 */
function mcpToolInfoToDefinition(serverName: string, tool: McpToolInfo): ToolDefinition {
  const safeName = serverName.replace(/[^a-zA-Z0-9_]/g, "_");
  const properties: Record<string, ToolPropertyDefinition> = {};
  const required: string[] = [];

  if (tool.inputSchema && typeof tool.inputSchema === "object") {
    const schema = tool.inputSchema as {
      properties?: Record<string, unknown>;
      required?: string[];
    };

    if (schema.properties) {
      for (const [key, value] of Object.entries(schema.properties)) {
        const prop = value as { type?: string; description?: string; enum?: string[] };
        properties[key] = {
          type: prop.type || "string",
          description: prop.description || key,
          enum: prop.enum,
        };
      }
    }

    if (schema.required) {
      required.push(...schema.required);
    }
  }

  return {
    name: `mcp_${safeName}_${tool.name}`,
    description: tool.description || `MCP tool: ${tool.name} from ${serverName}`,
    parameters: {
      type: "object",
      properties,
      required: required.length > 0 ? required : undefined,
    },
  };
}

/**
 * Execute an MCP tool call
 */
export async function executeMcpTool(
  mcpServers: McpServerConfig[],
  toolName: string,
  args: Record<string, unknown>
): Promise<unknown> {
  // Parse tool name: mcp_{serverName}_{toolName}
  const match = toolName.match(/^mcp_([^_]+(?:_[^_]+)*)_(.+)$/);
  if (!match) {
    return { error: `Invalid MCP tool name: ${toolName}` };
  }

  // Find the server by trying progressively longer prefixes
  let server: McpServerConfig | undefined;
  let actualToolName = "";

  for (const s of mcpServers) {
    const safeName = s.name.replace(/[^a-zA-Z0-9_]/g, "_");
    const prefix = `mcp_${safeName}_`;
    if (toolName.startsWith(prefix)) {
      server = s;
      actualToolName = toolName.slice(prefix.length);
      break;
    }
  }

  if (!server) {
    return { error: `MCP server not found for tool: ${toolName}` };
  }

  try {
    const client = getOrCreateClient(server);
    const result = await client.callToolRaw(actualToolName, args);

    // Extract text content
    const textParts = result.content
      ?.filter((c) => c.type === "text" && c.text)
      .map((c) => c.text)
      .join("\n");

    return textParts || JSON.stringify(result.content);
  } catch (error) {
    return {
      error: error instanceof Error ? error.message : "MCP tool call failed",
    };
  }
}

/**
 * Close all MCP clients
 */
export async function closeAllMcpClients(): Promise<void> {
  for (const client of mcpClients.values()) {
    await client.close();
  }
  mcpClients.clear();
}
