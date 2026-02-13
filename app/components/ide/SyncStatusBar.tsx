import { useState, useRef, useEffect, useCallback } from "react";
import { ArrowUp, ArrowDown, AlertTriangle, Loader2, Plus, Pencil, Trash2 } from "lucide-react";
import { ICON } from "~/utils/icon-sizes";
import type { SyncStatus, ConflictInfo } from "~/hooks/useSync";
import {
  getCachedRemoteMeta,
  getCachedFile,
  getLocallyModifiedFileIds,
  getLocalSyncMeta,
} from "~/services/indexeddb-cache";
import { computeSyncDiff } from "~/services/sync-diff";

interface SyncStatusBarProps {
  syncStatus: SyncStatus;
  lastSyncTime: string | null;
  error: string | null;
  localModifiedCount: number;
  remoteModifiedCount: number;
  onPush: () => void;
  onPull: () => void;
  onShowConflicts: () => void;
  onSelectFile?: (fileId: string, fileName: string, mimeType: string) => void;
  conflicts: ConflictInfo[];
  compact?: boolean;
}

interface FileListItem {
  id: string;
  name: string;
  type: "new" | "modified" | "deleted";
}

export function SyncStatusBar({
  syncStatus,
  lastSyncTime,
  error,
  localModifiedCount,
  remoteModifiedCount,
  onPush,
  onPull,
  onShowConflicts,
  onSelectFile,
  conflicts,
  compact = false,
}: SyncStatusBarProps) {
  const conflictCount = conflicts.length;
  const isBusy = syncStatus === "pushing" || syncStatus === "pulling";

  const [openList, setOpenList] = useState<"push" | "pull" | null>(null);
  const [listFiles, setListFiles] = useState<FileListItem[]>([]);
  const [listLoading, setListLoading] = useState(false);
  const pushCount = localModifiedCount;
  const popoverRef = useRef<HTMLDivElement>(null);

  // Close on click outside
  useEffect(() => {
    if (!openList) return;
    const handler = (e: MouseEvent) => {
      if (popoverRef.current && !popoverRef.current.contains(e.target as Node)) {
        setOpenList(null);
      }
    };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, [openList]);

  const loadFileList = useCallback(async (type: "push" | "pull") => {
    if (openList === type) {
      setOpenList(null);
      return;
    }

    setListLoading(true);
    setOpenList(type);

    try {
      const remoteMeta = await getCachedRemoteMeta();
      const localMeta = await getLocalSyncMeta();
      const diff = computeSyncDiff(localMeta ?? null, remoteMeta ? { lastUpdatedAt: remoteMeta.lastUpdatedAt, files: remoteMeta.files } : null, await getLocallyModifiedFileIds());

      if (type === "push") {
        const files: FileListItem[] = [];
        const remoteFiles = remoteMeta?.files ?? {};
        const localFiles = localMeta?.files ?? {};

        for (const id of diff.toPush) {
          const name = remoteFiles[id]?.name;
          // Not in localMeta (last sync snapshot) = new file since last sync
          const isNew = !localFiles[id];
          if (name) {
            files.push({ id, name, type: isNew ? "new" : "modified" });
          } else {
            const cached = await getCachedFile(id);
            files.push({ id, name: cached?.fileName || id, type: isNew ? "new" : "modified" });
          }
        }
        for (const id of diff.localOnly) {
          const cached = await getCachedFile(id);
          files.push({ id, name: cached?.fileName || id, type: "new" });
        }
        files.sort((a, b) => a.name.localeCompare(b.name));
        setListFiles(files);
      } else {
        const files: FileListItem[] = [];
        const remoteFiles = remoteMeta?.files ?? {};

        // New remote files
        for (const id of diff.remoteOnly) {
          files.push({ id, name: remoteFiles[id]?.name || id, type: "new" });
        }
        // Modified remote files
        for (const id of diff.toPull) {
          files.push({ id, name: remoteFiles[id]?.name || id, type: "modified" });
        }
        // Locally-only files (deleted on remote)
        for (const id of diff.localOnly) {
          const cached = await getCachedFile(id);
          files.push({ id, name: cached?.fileName || id, type: "deleted" });
        }

        files.sort((a, b) => a.name.localeCompare(b.name));
        setListFiles(files);
      }
    } catch {
      setListFiles([]);
    } finally {
      setListLoading(false);
    }
  }, [openList]);

  const formatLastSync = (time: string | null) => {
    if (!time) return null;
    const d = Date.now() - new Date(time).getTime();
    const minutes = Math.floor(d / 60000);
    if (minutes < 1) return "just now";
    if (minutes < 60) return `${minutes}m ago`;
    const hours = Math.floor(minutes / 60);
    return `${hours}h ago`;
  };

  return (
    <div className="flex items-center gap-1">
      {/* Busy indicator */}
      {isBusy && (
        <Loader2 size={ICON.SM} className="animate-spin text-gray-400" />
      )}

      {/* Push button + count badge */}
      <button
        onClick={onPush}
        disabled={isBusy}
        className="flex items-center gap-1 rounded px-2 py-0.5 text-xs font-medium border border-gray-300 text-gray-600 hover:bg-gray-100 dark:border-gray-600 dark:text-gray-400 dark:hover:bg-gray-800 disabled:opacity-50"
      >
        <ArrowUp size={ICON.SM} />
        {!compact && "Push"}
      </button>
      {pushCount > 0 && (
        <div className="relative" ref={openList === "push" ? popoverRef : undefined}>
          <button
            onClick={() => loadFileList("push")}
            className="rounded-full bg-blue-600 px-1.5 py-0 text-[10px] font-bold leading-4 text-white hover:bg-blue-700 dark:bg-blue-500 dark:hover:bg-blue-600"
          >
            {pushCount}
          </button>
          {openList === "push" && (
            <FileListPopover files={listFiles} loading={listLoading} onSelect={(f) => { setOpenList(null); onSelectFile?.(f.id, f.name, guessMimeType(f.name)); }} />
          )}
        </div>
      )}

      {/* Pull button + remote count badge */}
      <button
        onClick={onPull}
        disabled={isBusy}
        className="flex items-center gap-1 rounded px-2 py-0.5 text-xs font-medium border border-gray-300 text-gray-600 hover:bg-gray-100 dark:border-gray-600 dark:text-gray-400 dark:hover:bg-gray-800 disabled:opacity-50"
      >
        <ArrowDown size={ICON.SM} />
        {!compact && "Pull"}
      </button>
      {remoteModifiedCount > 0 && (
        <div className="relative" ref={openList === "pull" ? popoverRef : undefined}>
          <button
            onClick={() => loadFileList("pull")}
            className="rounded-full bg-green-600 px-1.5 py-0 text-[10px] font-bold leading-4 text-white hover:bg-green-700 dark:bg-green-500 dark:hover:bg-green-600"
          >
            {remoteModifiedCount}
          </button>
          {openList === "pull" && (
            <FileListPopover files={listFiles} loading={listLoading} />
          )}
        </div>
      )}

      {/* Conflict indicator */}
      {conflictCount > 0 && (
        <button
          onClick={onShowConflicts}
          className="flex items-center gap-1 rounded px-1.5 py-0.5 text-sm text-amber-600 hover:bg-amber-50 dark:text-amber-400 dark:hover:bg-amber-900/20"
          title={`${conflictCount} conflict${conflictCount > 1 ? "s" : ""}`}
        >
          <AlertTriangle size={ICON.SM} />
          <span>{conflictCount}</span>
        </button>
      )}

      {/* Error / warning (pushRejected is handled by a dedicated dialog) */}
      {error && syncStatus === "error" && error !== "settings.sync.pushRejected" && (
        <span className="text-xs text-red-500 truncate max-w-[120px]" title={error}>
          Sync error
        </span>
      )}
      {error && syncStatus === "warning" && (
        <span className="text-xs text-amber-600 truncate max-w-[160px] dark:text-amber-400" title={error}>
          Sync warning
        </span>
      )}

      {/* Last sync time */}
      {lastSyncTime && !error && !compact && (
        <span className="text-xs text-gray-400 dark:text-gray-500">
          {formatLastSync(lastSyncTime)}
        </span>
      )}
    </div>
  );
}

function guessMimeType(name: string): string {
  if (name.endsWith(".yaml") || name.endsWith(".yml")) return "text/yaml";
  if (name.endsWith(".json")) return "application/json";
  if (name.endsWith(".md")) return "text/markdown";
  return "text/plain";
}

function FileListPopover({
  files,
  loading,
  onSelect,
}: {
  files: FileListItem[];
  loading: boolean;
  onSelect?: (file: FileListItem) => void;
}) {
  return (
    <div className="absolute left-0 top-full z-50 mt-1 w-64 rounded-md border border-gray-200 bg-white shadow-lg dark:border-gray-700 dark:bg-gray-900">
      {loading ? (
        <div className="flex items-center justify-center py-3">
          <Loader2 size={ICON.MD} className="animate-spin text-gray-400" />
        </div>
      ) : files.length === 0 ? (
        <div className="px-3 py-2 text-xs text-gray-400">No files</div>
      ) : (
        <div className="max-h-48 overflow-y-auto py-1">
          {files.map((f) => {
            const Icon = f.type === "new" ? Plus : f.type === "modified" ? Pencil : Trash2;
            const iconColor = f.type === "new" ? "text-green-500" : f.type === "modified" ? "text-blue-500" : "text-red-500";

            return onSelect ? (
              <button
                key={f.id}
                className="flex items-center gap-2 w-full truncate px-3 py-1 text-left text-xs text-gray-700 hover:bg-gray-100 dark:text-gray-300 dark:hover:bg-gray-800"
                title={f.name}
                onClick={() => onSelect(f)}
              >
                <Icon size={12} className={iconColor} />
                <span className="truncate flex-1">{f.name}</span>
              </button>
            ) : (
              <div
                key={f.id}
                className="flex items-center gap-2 truncate px-3 py-1 text-xs text-gray-700 dark:text-gray-300"
                title={f.name}
              >
                <Icon size={12} className={iconColor} />
                <span className="truncate flex-1">{f.name}</span>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
