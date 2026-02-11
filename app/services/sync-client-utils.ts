export const SYNC_EXCLUDED_FILE_NAMES = new Set(["_sync-meta.json", "settings.json"]);
export const SYNC_EXCLUDED_PREFIXES = [
  "history/",
  "trash/",
  "sync_conflicts/",
  "__TEMP__/",
  "plugins/",
];

export function isSyncExcludedPath(fileName: string): boolean {
  const normalized = fileName.replace(/^\/+/, "");
  if (SYNC_EXCLUDED_FILE_NAMES.has(normalized)) return true;
  return SYNC_EXCLUDED_PREFIXES.some((prefix) => normalized.startsWith(prefix));
}

export type SyncCompletionStatus = "idle" | "warning";

export function getSyncCompletionStatus(
  skippedCount: number,
  label: "Push" | "Full push"
): { status: SyncCompletionStatus; error: string | null } {
  if (skippedCount > 0) {
    return {
      status: "warning",
      error: `${label} completed with warning: skipped ${skippedCount} file(s).`,
    };
  }
  return { status: "idle", error: null };
}
