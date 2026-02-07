// Drive tools for Gemini Function Calling in chat

import {
  readFile,
  searchFiles,
  createFile,
  updateFile,
  getFileMetadata,
} from "./google-drive.server";
import { getFileListFromMeta } from "./sync-meta.server";
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
    description: "Search for files in Google Drive by name or content",
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
        folder: {
          type: "string",
          description: "Virtual folder path to filter results (e.g. 'notes' or 'projects/src'). If omitted, searches all files",
        },
      },
      required: ["query"],
    },
  },
  {
    name: "list_drive_files",
    description: "List files in Google Drive. Files are organized in a virtual folder structure using path separators in file names (e.g. 'notes/todo.md'). Use the folder parameter to list files under a specific path.",
    parameters: {
      type: "object",
      properties: {
        folder: {
          type: "string",
          description: "Virtual folder path to list (e.g. 'notes' or 'projects/src'). If omitted, lists all files and top-level virtual folders",
        },
      },
    },
  },
  {
    name: "create_drive_file",
    description: "Create a new file in Google Drive. Use path separators in the name to place it in a virtual folder (e.g. 'notes/todo.md')",
    parameters: {
      type: "object",
      properties: {
        name: {
          type: "string",
          description: "The file name, optionally including virtual folder path (e.g. 'notes/todo.md')",
        },
        content: {
          type: "string",
          description: "The file content",
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
      const folder = args.folder as string | undefined;
      let files = await searchFiles(accessToken, rootFolderId, query, searchContent);
      // Filter by virtual folder prefix
      if (folder) {
        files = files.filter(
          (f) => f.name === folder || f.name.startsWith(folder + "/")
        );
      }
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
      const folder = args.folder as string | undefined;
      const { files: allFiles } = await getFileListFromMeta(accessToken, rootFolderId);

      // Filter and extract virtual structure
      const prefix = folder ? folder + "/" : "";
      const filteredFiles: Array<{ id: string; name: string; mimeType: string; modifiedTime?: string }> = [];
      const virtualFolders = new Set<string>();

      for (const f of allFiles) {
        if (folder && !f.name.startsWith(prefix)) continue;

        const relativeName = folder ? f.name.slice(prefix.length) : f.name;
        const slashIndex = relativeName.indexOf("/");

        if (slashIndex === -1) {
          // Direct child file
          filteredFiles.push({
            id: f.id,
            name: relativeName,
            mimeType: f.mimeType,
            modifiedTime: f.modifiedTime,
          });
        } else {
          // File in a subfolder — extract immediate subfolder name
          virtualFolders.add(relativeName.slice(0, slashIndex));
        }
      }

      return {
        files: filteredFiles,
        folders: Array.from(virtualFolders)
          .sort()
          .map((name) => ({ name })),
      };
    }

    case "create_drive_file": {
      const name = args.name as string;
      const content = args.content as string;
      const file = await createFile(accessToken, name, content, rootFolderId);
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
