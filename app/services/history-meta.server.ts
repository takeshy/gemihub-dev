// Shared _meta.json helpers for history folders (chats, execution, requests).
// Each history folder stores a `_meta.json` file that contains metadata for all
// items so that listing can be done with a single Drive read instead of N reads.

import {
  findFileByExactName,
  readFile,
  createFile,
  updateFile,
  listFiles,
} from "./google-drive.server";

const META_FILE_NAME = "_meta.json";

export interface HistoryMeta<T> {
  lastUpdatedAt: string;
  items: Record<string, T>; // key = fileId
}

/**
 * Read _meta.json from a history folder. Returns null if it doesn't exist.
 */
export async function readHistoryMeta<T>(
  accessToken: string,
  folderId: string
): Promise<HistoryMeta<T> | null> {
  const metaFile = await findFileByExactName(
    accessToken,
    META_FILE_NAME,
    folderId
  );
  if (!metaFile) return null;

  try {
    const content = await readFile(accessToken, metaFile.id);
    return JSON.parse(content) as HistoryMeta<T>;
  } catch {
    return null;
  }
}

/**
 * Write _meta.json to a history folder (create or update).
 */
export async function writeHistoryMeta<T>(
  accessToken: string,
  folderId: string,
  meta: HistoryMeta<T>
): Promise<void> {
  const metaFile = await findFileByExactName(
    accessToken,
    META_FILE_NAME,
    folderId
  );
  const content = JSON.stringify(meta, null, 2);

  if (metaFile) {
    await updateFile(accessToken, metaFile.id, content, "application/json");
  } else {
    await createFile(
      accessToken,
      META_FILE_NAME,
      content,
      folderId,
      "application/json"
    );
  }
}

/**
 * Add or update a single entry in _meta.json.
 */
export async function upsertHistoryMetaEntry<T>(
  accessToken: string,
  folderId: string,
  fileId: string,
  item: T
): Promise<void> {
  let meta = await readHistoryMeta<T>(accessToken, folderId);
  if (!meta) {
    meta = { lastUpdatedAt: new Date().toISOString(), items: {} };
  }
  meta.items[fileId] = item;
  meta.lastUpdatedAt = new Date().toISOString();
  await writeHistoryMeta(accessToken, folderId, meta);
}

/**
 * Remove a single entry from _meta.json.
 */
export async function removeHistoryMetaEntry<T>(
  accessToken: string,
  folderId: string,
  fileId: string
): Promise<void> {
  const meta = await readHistoryMeta<T>(accessToken, folderId);
  if (!meta) return;
  delete meta.items[fileId];
  meta.lastUpdatedAt = new Date().toISOString();
  await writeHistoryMeta(accessToken, folderId, meta);
}

/**
 * Rebuild _meta.json by reading all individual files in the folder.
 * `extractItem` converts the parsed JSON content + fileId into the metadata entry.
 * Files that fail to parse are skipped.
 */
export async function rebuildHistoryMeta<T>(
  accessToken: string,
  folderId: string,
  extractItem: (fileId: string, content: unknown) => T | null
): Promise<HistoryMeta<T>> {
  const files = await listFiles(accessToken, folderId);
  const jsonFiles = files.filter(
    (f) => f.name.endsWith(".json") && f.name !== META_FILE_NAME
  );

  const meta: HistoryMeta<T> = {
    lastUpdatedAt: new Date().toISOString(),
    items: {},
  };

  const BATCH_SIZE = 10;
  for (let i = 0; i < jsonFiles.length; i += BATCH_SIZE) {
    const batch = jsonFiles.slice(i, i + BATCH_SIZE);
    const results = await Promise.allSettled(
      batch.map(async (file) => {
        const content = await readFile(accessToken, file.id);
        const parsed = JSON.parse(content);
        const item = extractItem(file.id, parsed);
        return { fileId: file.id, item };
      })
    );
    for (const r of results) {
      if (r.status === "fulfilled" && r.value.item !== null) {
        meta.items[r.value.fileId] = r.value.item;
      }
    }
  }

  try {
    await writeHistoryMeta(accessToken, folderId, meta);
  } catch (err) {
    console.error("[history-meta] Failed to write rebuilt _meta.json:", err);
  }

  return meta;
}
