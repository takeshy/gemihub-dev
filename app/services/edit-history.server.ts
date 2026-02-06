// Edit history manager - ported from obsidian-gemini-helper (Drive-based version)

import * as Diff from "diff";
import {
  readFile,
  createFile,
  updateFile,
  deleteFile,
  listFiles,
} from "./google-drive.server";
import type { EditHistorySettings } from "~/types/settings";

const EDIT_HISTORY_FOLDER = "edit-history";

export interface EditHistoryEntry {
  id: string;
  timestamp: string;
  source: "workflow" | "propose_edit" | "manual" | "auto";
  workflowName?: string;
  model?: string;
  diff: string;
  stats: {
    additions: number;
    deletions: number;
  };
}

export interface EditHistoryFile {
  version: number;
  path: string;
  entries: EditHistoryEntry[];
}

export interface EditHistoryStats {
  totalFiles: number;
  totalEntries: number;
}

/**
 * Ensure edit-history subfolder exists
 */
async function ensureEditHistoryFolderId(
  accessToken: string,
  rootFolderId: string
): Promise<string> {
  const DRIVE_API = "https://www.googleapis.com/drive/v3";

  const query = `name='${EDIT_HISTORY_FOLDER}' and '${rootFolderId}' in parents and mimeType='application/vnd.google-apps.folder' and trashed=false`;
  const res = await fetch(
    `${DRIVE_API}/files?q=${encodeURIComponent(query)}&fields=files(id,name)`,
    { headers: { Authorization: `Bearer ${accessToken}` } }
  );
  const data = await res.json();

  if (data.files && data.files.length > 0) {
    return data.files[0].id;
  }

  const createRes = await fetch(`${DRIVE_API}/files`, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${accessToken}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      name: EDIT_HISTORY_FOLDER,
      mimeType: "application/vnd.google-apps.folder",
      parents: [rootFolderId],
    }),
  });
  const folder = await createRes.json();
  return folder.id;
}

function generateId(): string {
  return Math.random().toString(36).substring(2, 8);
}

function pathToHistoryFileName(filePath: string): string {
  return filePath.replace(/\//g, "-") + ".history.json";
}

function pathToSnapshotFileName(filePath: string): string {
  return filePath.replace(/\//g, "-") + ".snapshot.json";
}

/**
 * Find a file by name in the edit-history folder
 */
async function findFileByName(
  accessToken: string,
  folderId: string,
  fileName: string
): Promise<string | null> {
  const files = await listFiles(accessToken, folderId);
  const found = files.find((f) => f.name === fileName);
  return found?.id ?? null;
}

/**
 * Load history file
 */
async function loadHistoryFile(
  accessToken: string,
  historyFolderId: string,
  filePath: string
): Promise<{ history: EditHistoryFile; fileId: string | null }> {
  const fileName = pathToHistoryFileName(filePath);
  const fileId = await findFileByName(accessToken, historyFolderId, fileName);

  if (!fileId) {
    return {
      history: { version: 1, path: filePath, entries: [] },
      fileId: null,
    };
  }

  try {
    const content = await readFile(accessToken, fileId);
    return { history: JSON.parse(content) as EditHistoryFile, fileId };
  } catch {
    return {
      history: { version: 1, path: filePath, entries: [] },
      fileId,
    };
  }
}

/**
 * Save history file
 */
async function saveHistoryFile(
  accessToken: string,
  historyFolderId: string,
  filePath: string,
  history: EditHistoryFile,
  existingFileId: string | null
): Promise<void> {
  const content = JSON.stringify(history, null, 2);
  const fileName = pathToHistoryFileName(filePath);

  if (existingFileId) {
    await updateFile(accessToken, existingFileId, content, "application/json");
  } else {
    await createFile(accessToken, fileName, content, historyFolderId, "application/json");
  }
}

/**
 * Load snapshot
 */
async function loadSnapshot(
  accessToken: string,
  historyFolderId: string,
  filePath: string
): Promise<{ content: string | null; fileId: string | null }> {
  const fileName = pathToSnapshotFileName(filePath);
  const fileId = await findFileByName(accessToken, historyFolderId, fileName);

  if (!fileId) {
    return { content: null, fileId: null };
  }

  try {
    const content = await readFile(accessToken, fileId);
    return { content, fileId };
  } catch {
    return { content: null, fileId };
  }
}

/**
 * Save snapshot
 */
async function saveSnapshot(
  accessToken: string,
  historyFolderId: string,
  filePath: string,
  content: string,
  existingFileId: string | null
): Promise<void> {
  const fileName = pathToSnapshotFileName(filePath);

  if (existingFileId) {
    await updateFile(accessToken, existingFileId, content, "text/plain");
  } else {
    await createFile(accessToken, fileName, content, historyFolderId, "text/plain");
  }
}

/**
 * Create a unified diff between two strings
 */
function createDiffStr(
  originalContent: string,
  modifiedContent: string,
  contextLines: number
): { diff: string; stats: { additions: number; deletions: number } } {
  const patch = Diff.structuredPatch(
    "original",
    "modified",
    originalContent,
    modifiedContent,
    undefined,
    undefined,
    { context: contextLines }
  );

  const lines: string[] = [];
  let additions = 0;
  let deletions = 0;

  for (const hunk of patch.hunks) {
    lines.push(`@@ -${hunk.oldStart},${hunk.oldLines} +${hunk.newStart},${hunk.newLines} @@`);
    for (const line of hunk.lines) {
      lines.push(line);
      if (line.startsWith("+") && !line.startsWith("+++")) additions++;
      else if (line.startsWith("-") && !line.startsWith("---")) deletions++;
    }
  }

  return { diff: lines.join("\n"), stats: { additions, deletions } };
}

/**
 * Apply a patch to get previous content
 */
function applyPatch(content: string, diff: string): string {
  const lines = content.split("\n");
  const diffLines = diff.split("\n");

  let i = 0;
  const hunks: Array<{ startIdx: number; searchLines: string[]; replaceLines: string[] }> = [];

  while (i < diffLines.length) {
    const line = diffLines[i];
    const hunkMatch = line.match(/^@@ -(\d+),?\d* \+(\d+),?\d* @@/);

    if (hunkMatch) {
      const startIdx = parseInt(hunkMatch[1], 10) - 1;
      const searchLines: string[] = [];
      const replaceLines: string[] = [];

      i++;
      while (i < diffLines.length && !diffLines[i].startsWith("@@")) {
        const hunkLine = diffLines[i];
        if (hunkLine.startsWith("-")) {
          searchLines.push(hunkLine.substring(1));
        } else if (hunkLine.startsWith("+")) {
          replaceLines.push(hunkLine.substring(1));
        } else if (hunkLine.startsWith(" ")) {
          searchLines.push(hunkLine.substring(1));
          replaceLines.push(hunkLine.substring(1));
        }
        i++;
      }

      hunks.push({ startIdx, searchLines, replaceLines });
    } else {
      i++;
    }
  }

  hunks.reverse();

  for (const hunk of hunks) {
    let startIdx = hunk.startIdx;

    for (
      let j = Math.max(0, startIdx - 5);
      j <= Math.min(lines.length - hunk.searchLines.length, startIdx + 5);
      j++
    ) {
      let match = true;
      for (let k = 0; k < hunk.searchLines.length && j + k < lines.length; k++) {
        if (lines[j + k] !== hunk.searchLines[k]) {
          match = false;
          break;
        }
      }
      if (match) {
        startIdx = j;
        break;
      }
    }

    lines.splice(startIdx, hunk.searchLines.length, ...hunk.replaceLines);
  }

  return lines.join("\n");
}

// --- Public API ---

/**
 * Save an edit to history
 */
export async function saveEdit(
  accessToken: string,
  rootFolderId: string,
  settings: EditHistorySettings,
  params: {
    path: string;
    modifiedContent: string;
    source: "workflow" | "propose_edit" | "manual" | "auto";
    workflowName?: string;
    model?: string;
  }
): Promise<EditHistoryEntry | null> {
  if (!settings.enabled) return null;

  const historyFolderId = await ensureEditHistoryFolderId(accessToken, rootFolderId);

  const { content: snapshot, fileId: snapshotFileId } = await loadSnapshot(
    accessToken,
    historyFolderId,
    params.path
  );
  const base = snapshot ?? "";

  const { diff, stats } = createDiffStr(params.modifiedContent, base, settings.diff.contextLines);

  if (stats.additions === 0 && stats.deletions === 0) return null;

  const entry: EditHistoryEntry = {
    id: generateId(),
    timestamp: new Date().toISOString(),
    source: params.source,
    workflowName: params.workflowName,
    model: params.model,
    diff,
    stats,
  };

  const { history, fileId: historyFileId } = await loadHistoryFile(
    accessToken,
    historyFolderId,
    params.path
  );

  history.entries.push(entry);

  if (settings.retention.maxEntriesPerFile > 0) {
    while (history.entries.length > settings.retention.maxEntriesPerFile) {
      history.entries.shift();
    }
  }

  await saveHistoryFile(accessToken, historyFolderId, params.path, history, historyFileId);
  await saveSnapshot(accessToken, historyFolderId, params.path, params.modifiedContent, snapshotFileId);

  return entry;
}

/**
 * Get history for a file
 */
export async function getHistory(
  accessToken: string,
  rootFolderId: string,
  filePath: string
): Promise<EditHistoryEntry[]> {
  const historyFolderId = await ensureEditHistoryFolderId(accessToken, rootFolderId);
  const { history } = await loadHistoryFile(accessToken, historyFolderId, filePath);
  return history.entries;
}

/**
 * Get content at a specific history entry
 */
export async function getContentAt(
  accessToken: string,
  rootFolderId: string,
  filePath: string,
  entryId: string
): Promise<string | null> {
  const historyFolderId = await ensureEditHistoryFolderId(accessToken, rootFolderId);

  const { content: snapshot } = await loadSnapshot(accessToken, historyFolderId, filePath);
  if (snapshot === null) return null;

  const { history } = await loadHistoryFile(accessToken, historyFolderId, filePath);
  const targetIndex = history.entries.findIndex((e) => e.id === entryId);
  if (targetIndex === -1) return null;

  let content = snapshot;
  for (let i = history.entries.length - 1; i >= targetIndex; i--) {
    content = applyPatch(content, history.entries[i].diff);
  }

  return content;
}

/**
 * Restore file to a specific history entry (returns content to write)
 */
export async function restoreTo(
  accessToken: string,
  rootFolderId: string,
  filePath: string,
  entryId: string
): Promise<string | null> {
  const content = await getContentAt(accessToken, rootFolderId, filePath, entryId);
  if (content === null) return null;

  // Update snapshot and clear history
  const historyFolderId = await ensureEditHistoryFolderId(accessToken, rootFolderId);
  const { fileId: snapshotFileId } = await loadSnapshot(accessToken, historyFolderId, filePath);
  await saveSnapshot(accessToken, historyFolderId, filePath, content, snapshotFileId);

  // Delete history
  const historyFileName = pathToHistoryFileName(filePath);
  const historyFileId = await findFileByName(accessToken, historyFolderId, historyFileName);
  if (historyFileId) {
    await deleteFile(accessToken, historyFileId);
  }

  return content;
}

/**
 * Prune old history entries
 */
export async function prune(
  accessToken: string,
  rootFolderId: string,
  settings: EditHistorySettings
): Promise<{ deletedCount: number }> {
  const historyFolderId = await ensureEditHistoryFolderId(accessToken, rootFolderId);
  const files = await listFiles(accessToken, historyFolderId);
  const maxAgeMs =
    settings.retention.maxAgeInDays > 0
      ? settings.retention.maxAgeInDays * 24 * 60 * 60 * 1000
      : 0;
  const now = Date.now();
  let deletedCount = 0;

  for (const file of files) {
    if (!file.name.endsWith(".history.json")) continue;

    try {
      const content = await readFile(accessToken, file.id);
      const history = JSON.parse(content) as EditHistoryFile;
      const originalCount = history.entries.length;

      if (maxAgeMs > 0) {
        history.entries = history.entries.filter(
          (e) => now - new Date(e.timestamp).getTime() < maxAgeMs
        );
      }

      if (settings.retention.maxEntriesPerFile > 0 && history.entries.length > settings.retention.maxEntriesPerFile) {
        history.entries = history.entries.slice(-settings.retention.maxEntriesPerFile);
      }

      deletedCount += originalCount - history.entries.length;

      if (history.entries.length === 0) {
        await deleteFile(accessToken, file.id);
      } else if (history.entries.length !== originalCount) {
        await updateFile(accessToken, file.id, JSON.stringify(history, null, 2), "application/json");
      }
    } catch {
      // Skip
    }
  }

  return { deletedCount };
}

/**
 * Get statistics about edit history
 */
export async function getStats(
  accessToken: string,
  rootFolderId: string
): Promise<EditHistoryStats> {
  const historyFolderId = await ensureEditHistoryFolderId(accessToken, rootFolderId);
  const files = await listFiles(accessToken, historyFolderId);
  let totalFiles = 0;
  let totalEntries = 0;

  for (const file of files) {
    if (!file.name.endsWith(".history.json")) continue;

    try {
      totalFiles++;
      const content = await readFile(accessToken, file.id);
      const history = JSON.parse(content) as EditHistoryFile;
      totalEntries += history.entries.length;
    } catch {
      // Skip
    }
  }

  return { totalFiles, totalEntries };
}
