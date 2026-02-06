// Sync meta service - manages remote sync metadata for push/pull synchronization

import {
  listFiles,
  readFile,
  createFile,
  updateFile,
  type DriveFile,
} from "./google-drive.server";

const SYNC_META_FILE = "_sync-meta.json";

export interface FileSyncMeta {
  md5Checksum: string;
  modifiedTime: string;
}

export interface SyncMeta {
  lastUpdatedAt: string;
  files: Record<string, FileSyncMeta>; // key = fileId
}

export interface SyncDiff {
  toPush: string[]; // locally changed file IDs
  toPull: string[]; // remotely changed file IDs
  conflicts: Array<{
    fileId: string;
    fileName: string;
    localChecksum: string;
    remoteChecksum: string;
    localModifiedTime: string;
    remoteModifiedTime: string;
  }>;
  localOnly: string[]; // exists only locally
  remoteOnly: string[]; // exists only remotely
}

/**
 * Read the remote sync meta file from the workflows folder
 */
export async function readRemoteSyncMeta(
  accessToken: string,
  workflowsFolderId: string
): Promise<SyncMeta | null> {
  const files = await listFiles(accessToken, workflowsFolderId);
  const metaFile = files.find((f) => f.name === SYNC_META_FILE);
  if (!metaFile) return null;

  try {
    const content = await readFile(accessToken, metaFile.id);
    return JSON.parse(content) as SyncMeta;
  } catch {
    return null;
  }
}

/**
 * Write the remote sync meta file to the workflows folder
 */
export async function writeRemoteSyncMeta(
  accessToken: string,
  workflowsFolderId: string,
  meta: SyncMeta
): Promise<void> {
  const files = await listFiles(accessToken, workflowsFolderId);
  const metaFile = files.find((f) => f.name === SYNC_META_FILE);
  const content = JSON.stringify(meta, null, 2);

  if (metaFile) {
    await updateFile(accessToken, metaFile.id, content, "application/json");
  } else {
    await createFile(
      accessToken,
      SYNC_META_FILE,
      content,
      workflowsFolderId,
      "application/json"
    );
  }
}

/**
 * Compute sync diff using three-way comparison:
 *   localMeta (last sync snapshot on client) vs remoteMeta (last sync snapshot on server) vs remoteFiles (current Drive state)
 *
 * - localMeta comes from the client's IndexedDB syncMeta store
 * - remoteMeta comes from _sync-meta.json on Drive
 * - remoteFiles is the current list of files on Drive with md5Checksums
 */
export function computeSyncDiff(
  localMeta: SyncMeta | null,
  remoteMeta: SyncMeta | null,
  remoteFiles: DriveFile[]
): SyncDiff {
  const localFiles = localMeta?.files ?? {};
  const remoteMetaFiles = remoteMeta?.files ?? {};

  // Build a map of current remote files by id
  const currentRemoteMap = new Map<string, DriveFile>();
  for (const f of remoteFiles) {
    // Skip the meta file itself
    if (f.name === SYNC_META_FILE) continue;
    currentRemoteMap.set(f.id, f);
  }

  const toPush: string[] = [];
  const toPull: string[] = [];
  const conflicts: SyncDiff["conflicts"] = [];
  const localOnly: string[] = [];
  const remoteOnly: string[] = [];

  // Collect all known file IDs
  const allFileIds = new Set<string>();
  for (const id of Object.keys(localFiles)) allFileIds.add(id);
  for (const id of Object.keys(remoteMetaFiles)) allFileIds.add(id);
  for (const id of currentRemoteMap.keys()) allFileIds.add(id);

  for (const fileId of allFileIds) {
    const local = localFiles[fileId];
    const remoteSynced = remoteMetaFiles[fileId];
    const currentRemote = currentRemoteMap.get(fileId);

    const localChanged =
      local && remoteSynced
        ? local.md5Checksum !== remoteSynced.md5Checksum
        : !!local && !remoteSynced;

    const remoteChanged =
      currentRemote && remoteSynced
        ? currentRemote.md5Checksum !== remoteSynced.md5Checksum
        : !!currentRemote && !remoteSynced;

    if (local && !currentRemote) {
      // File exists locally but not on Drive
      localOnly.push(fileId);
    } else if (!local && currentRemote) {
      // File exists on Drive but not locally
      remoteOnly.push(fileId);
    } else if (localChanged && remoteChanged) {
      // Both sides changed → conflict
      conflicts.push({
        fileId,
        fileName: currentRemote?.name ?? fileId,
        localChecksum: local?.md5Checksum ?? "",
        remoteChecksum: currentRemote?.md5Checksum ?? "",
        localModifiedTime: local?.modifiedTime ?? "",
        remoteModifiedTime: currentRemote?.modifiedTime ?? "",
      });
    } else if (localChanged) {
      toPush.push(fileId);
    } else if (remoteChanged) {
      toPull.push(fileId);
    }
    // else: no change on either side
  }

  return { toPush, toPull, conflicts, localOnly, remoteOnly };
}
