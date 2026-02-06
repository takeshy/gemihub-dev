// Drive tools for Gemini Function Calling in chat

import {
  readFile,
  listFiles,
  searchFiles,
  createFile,
  updateFile,
  listFolders,
  getFileMetadata,
} from "./google-drive.server";
import type { ToolDefinition, EditHistorySettings } from "~/types/settings";
import { saveEdit } from "./edit-history.server";

/**
 * Set of drive tool names that are search/list related.
 * Used for filtering when driveToolMode === "noSearch".
 */
export const DRIVE_SEARCH_TOOL_NAMES = new Set([
  "search_drive_files",
  "list_drive_files",
]);

/**
 * Drive tool definitions for Gemini Function Calling
 */
export const DRIVE_TOOL_DEFINITIONS: ToolDefinition[] = [
  {
    name: "read_drive_file",
    description: "Read the content of a file from Google Drive by its file ID",
    parameters: {
      type: "object",
      properties: {
        fileId: {
          type: "string",
          description: "The Google Drive file ID",
        },
      },
      required: ["fileId"],
    },
  },
  {
    name: "search_drive_files",
    description: "Search for files in Google Drive by name or content. Use list_drive_files to discover folder IDs, then search within specific folders.",
    parameters: {
      type: "object",
      properties: {
        query: {
          type: "string",
          description: "The search query",
        },
        searchContent: {
          type: "boolean",
          description: "Whether to search file content (true) or just names (false). Default: false",
        },
        folderId: {
          type: "string",
          description: "The folder ID to search in. If omitted, searches in the root app folder",
        },
      },
      required: ["query"],
    },
  },
  {
    name: "list_drive_files",
    description: "List files in a Google Drive folder",
    parameters: {
      type: "object",
      properties: {
        folderId: {
          type: "string",
          description: "The folder ID. If omitted, lists files in the root app folder",
        },
      },
    },
  },
  {
    name: "create_drive_file",
    description: "Create a new file in Google Drive",
    parameters: {
      type: "object",
      properties: {
        name: {
          type: "string",
          description: "The file name",
        },
        content: {
          type: "string",
          description: "The file content",
        },
        folderId: {
          type: "string",
          description: "The parent folder ID. If omitted, creates in root app folder",
        },
      },
      required: ["name", "content"],
    },
  },
  {
    name: "update_drive_file",
    description: "Update the content of an existing file in Google Drive",
    parameters: {
      type: "object",
      properties: {
        fileId: {
          type: "string",
          description: "The Google Drive file ID",
        },
        content: {
          type: "string",
          description: "The new file content",
        },
      },
      required: ["fileId", "content"],
    },
  },
];

/**
 * Execute a Drive tool call
 */
export async function executeDriveTool(
  toolName: string,
  args: Record<string, unknown>,
  accessToken: string,
  rootFolderId: string,
  editHistorySettings?: EditHistorySettings
): Promise<unknown> {
  switch (toolName) {
    case "read_drive_file": {
      const fileId = args.fileId as string;
      const content = await readFile(accessToken, fileId);
      return { content };
    }

    case "search_drive_files": {
      const query = args.query as string;
      const searchContent = (args.searchContent as boolean) ?? false;
      const folderId = (args.folderId as string) ?? rootFolderId;
      const files = await searchFiles(accessToken, folderId, query, searchContent);
      return {
        files: files.map((f) => ({
          id: f.id,
          name: f.name,
          mimeType: f.mimeType,
          modifiedTime: f.modifiedTime,
        })),
      };
    }

    case "list_drive_files": {
      const folderId = (args.folderId as string) ?? rootFolderId;
      const files = await listFiles(accessToken, folderId);
      const folders = await listFolders(accessToken, folderId);
      return {
        files: files.map((f) => ({
          id: f.id,
          name: f.name,
          mimeType: f.mimeType,
          modifiedTime: f.modifiedTime,
        })),
        folders: folders.map((f) => ({
          id: f.id,
          name: f.name,
        })),
      };
    }

    case "create_drive_file": {
      const name = args.name as string;
      const content = args.content as string;
      const folderId = (args.folderId as string) ?? rootFolderId;
      const file = await createFile(accessToken, name, content, folderId);
      return {
        id: file.id,
        name: file.name,
        webViewLink: file.webViewLink,
      };
    }

    case "update_drive_file": {
      const fileId = args.fileId as string;
      const content = args.content as string;
      const file = await updateFile(accessToken, fileId, content);

      // Save edit history
      if (editHistorySettings) {
        try {
          const meta = await getFileMetadata(accessToken, fileId);
          await saveEdit(accessToken, rootFolderId, editHistorySettings, {
            path: meta.name,
            modifiedContent: content,
            source: "propose_edit",
          });
        } catch { /* don't fail tool on history error */ }
      }

      return {
        id: file.id,
        name: file.name,
        webViewLink: file.webViewLink,
      };
    }

    default:
      return { error: `Unknown tool: ${toolName}` };
  }
}
