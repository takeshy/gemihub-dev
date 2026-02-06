// RAG / Gemini File Search manager - ported from obsidian-gemini-helper (Drive-based version)

import { GoogleGenAI } from "@google/genai";
import { readFile, listFiles, findFolderByNameRecursive } from "./google-drive.server";
import type { RagSetting, RagFileInfo } from "~/types/settings";

export interface SyncResult {
  uploaded: string[];
  skipped: string[];
  deleted: string[];
  errors: Array<{ path: string; error: string }>;
  newFiles: Record<string, RagFileInfo>;
  lastFullSync: number;
}

/**
 * Calculate SHA-256 checksum of content
 */
async function calculateChecksum(content: string): Promise<string> {
  const encoder = new TextEncoder();
  const data = encoder.encode(content);
  const hashBuffer = await crypto.subtle.digest("SHA-256", data);
  const hashArray = Array.from(new Uint8Array(hashBuffer));
  return hashArray.map((b) => b.toString(16).padStart(2, "0")).join("");
}

/**
 * Get or create a File Search store
 */
export async function getOrCreateStore(apiKey: string, displayName: string): Promise<string> {
  const ai = new GoogleGenAI({ apiKey });

  // Try to find existing
  try {
    const pager = await ai.fileSearchStores.list();
    for await (const store of pager) {
      if (store.displayName === displayName && store.name) {
        return store.name;
      }
    }
  } catch {
    // List failed, create new
  }

  const store = await ai.fileSearchStores.create({
    config: { displayName },
  });

  if (!store.name) {
    throw new Error("Failed to create store: no name returned");
  }

  return store.name;
}

/**
 * Upload a Drive file to File Search store
 */
export async function uploadDriveFile(
  apiKey: string,
  accessToken: string,
  fileId: string,
  fileName: string,
  storeName: string
): Promise<string | null> {
  const ai = new GoogleGenAI({ apiKey });
  const content = await readFile(accessToken, fileId);

  const mimeType = fileName.endsWith(".pdf")
    ? "application/pdf"
    : fileName.endsWith(".md")
      ? "text/markdown"
      : "text/plain";

  const blob = new Blob([content], { type: mimeType });

  const operation = await ai.fileSearchStores.uploadToFileSearchStore({
    file: blob,
    fileSearchStoreName: storeName,
    config: {
      displayName: fileName,
    },
  });

  return operation?.name ?? null;
}

/**
 * Smart sync: sync Drive files to File Search store with checksum-based diff detection
 */
export async function smartSync(
  apiKey: string,
  accessToken: string,
  ragSetting: RagSetting,
  rootFolderId: string,
  onProgress?: (current: number, total: number, fileName: string, action: "upload" | "skip" | "delete") => void
): Promise<SyncResult> {
  if (!ragSetting.storeName) {
    throw new Error("No store name configured");
  }

  const ai = new GoogleGenAI({ apiKey });
  const result: SyncResult = {
    uploaded: [],
    skipped: [],
    deleted: [],
    errors: [],
    newFiles: { ...ragSetting.files },
    lastFullSync: Date.now(),
  };

  // Get files from target folders or root
  const targetFolders = Array.isArray(ragSetting.targetFolders) ? ragSetting.targetFolders : [];
  const allDriveFiles: Array<{ id: string; name: string }> = [];
  const excludePatterns = Array.isArray(ragSetting.excludePatterns) ? ragSetting.excludePatterns : [];

  // Resolve target folder entries: accept both folder names and folder IDs
  const resolvedFolderIds: string[] = [];
  if (targetFolders.length === 0) {
    resolvedFolderIds.push(rootFolderId);
  } else {
    for (const entry of targetFolders) {
      if (!entry) continue;
      // Google Drive IDs are typically 20+ alphanumeric chars with hyphens/underscores
      const looksLikeDriveId = /^[a-zA-Z0-9_-]{20,}$/.test(entry);
      if (looksLikeDriveId) {
        resolvedFolderIds.push(entry);
      } else {
        // Treat as folder name — search by name
        try {
          const folder = await findFolderByNameRecursive(accessToken, entry, rootFolderId);
          if (folder) {
            resolvedFolderIds.push(folder.id);
          } else {
            result.errors.push({ path: entry, error: `Folder not found: "${entry}"` });
          }
        } catch (error) {
          result.errors.push({
            path: entry,
            error: `Failed to resolve folder "${entry}": ${error instanceof Error ? error.message : "Unknown error"}`,
          });
        }
      }
    }
  }

  for (const folderId of resolvedFolderIds) {
    try {
      const files = await listFiles(accessToken, folderId);
      for (const f of files) {
        // Apply exclude patterns
        let excluded = false;
        for (const pattern of excludePatterns) {
          try {
            if (new RegExp(pattern).test(f.name)) {
              excluded = true;
              break;
            }
          } catch {
            // Invalid regex
          }
        }
        if (!excluded) {
          allDriveFiles.push({ id: f.id, name: f.name });
        }
      }
    } catch (error) {
      result.errors.push({
        path: folderId,
        error: `Failed to list folder "${folderId}": ${error instanceof Error ? error.message : "Unknown error"}`,
      });
    }
  }

  const currentFilePaths = new Set(allDriveFiles.map((f) => f.name));
  const totalOperations = allDriveFiles.length;
  let currentOperation = 0;

  // Delete orphaned entries from sync state
  for (const path of Object.keys(result.newFiles)) {
    if (!currentFilePaths.has(path)) {
      delete result.newFiles[path];
      result.deleted.push(path);
    }
  }

  // Process files
  const CONCURRENCY_LIMIT = 5;
  const queue = [...allDriveFiles];

  const processFile = async (file: { id: string; name: string }) => {
    currentOperation++;
    try {
      const content = await readFile(accessToken, file.id);
      const checksum = await calculateChecksum(content);
      const existing = ragSetting.files[file.name];

      if (existing && existing.checksum === checksum) {
        onProgress?.(currentOperation, totalOperations, file.name, "skip");
        result.skipped.push(file.name);
        return;
      }

      onProgress?.(currentOperation, totalOperations, file.name, "upload");

      // Delete existing document if re-uploading
      if (existing?.fileId) {
        try {
          await ai.fileSearchStores.documents.delete({
            name: existing.fileId,
            config: { force: true },
          });
        } catch {
          // Ignore
        }
      }

      const fileSearchId = await uploadDriveFile(
        apiKey,
        accessToken,
        file.id,
        file.name,
        ragSetting.storeName!
      );

      result.uploaded.push(file.name);
      result.newFiles[file.name] = {
        checksum,
        uploadedAt: Date.now(),
        fileId: fileSearchId,
      };
    } catch (error) {
      result.errors.push({
        path: file.name,
        error: error instanceof Error ? error.message : "Upload failed",
      });
    }
  };

  while (queue.length > 0) {
    const batch = queue.splice(0, CONCURRENCY_LIMIT);
    await Promise.all(batch.map(processFile));
  }

  return result;
}

/**
 * Delete a File Search store
 */
export async function deleteStore(apiKey: string, storeName: string): Promise<void> {
  const ai = new GoogleGenAI({ apiKey });
  await ai.fileSearchStores.delete({ name: storeName, config: { force: true } });
}
