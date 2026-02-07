# Sync

Manual push/pull synchronization between the browser (IndexedDB) and Google Drive.

## Features

- **Manual Sync**: Push and pull changes when you want
- **Offline-First**: Files are cached in IndexedDB for instant access
- **Conflict Resolution**: Choose local or remote version with automatic backup
- **Auto-Check**: Detects changes every 5 minutes
- **Full Push / Full Pull**: Bulk sync for initial setup or recovery
- **Exclude Patterns**: Skip files by regex pattern
- **Untracked File Management**: Detect, restore, or delete orphaned remote files

## Commands

| Command | Description |
|---------|-------------|
| **Push** | Upload local changes (incremental) |
| **Pull** | Download remote changes (incremental) |
| **Full Push** | Merge all local metadata into remote |
| **Full Pull** | Download entire remote vault (skip matching hashes) |

Header buttons: Upload icon = Push, Download icon = Pull

---

## How Sync Works

### Overview

The system tracks file states using metadata:
- **Local Meta**: Stored in IndexedDB (`syncMeta` store, key `"current"`)
- **Remote Meta**: `_sync-meta.json` file on Google Drive

Each metadata contains:
- `lastUpdatedAt`: Timestamp of last sync
- `files`: MD5 checksum and modification time for each file (keyed by file ID)

File contents are cached in the IndexedDB `files` store. All edits update this cache directly. The MD5 checksum is provided by the Google Drive API on every file operation (create, update, read).

### Three-Way Diff

The diff algorithm compares three data sources:

| Source | Description |
|--------|-------------|
| **Local Meta** | Client's last-synced snapshot (IndexedDB) |
| **Remote Meta** | Server's last-synced snapshot (`_sync-meta.json`) |
| **Current Remote** | Live Drive API file listing (rebuilt on every diff) |

Detection logic per file:

| Local Changed | Remote Changed | Result |
|:-------------:|:--------------:|--------|
| No | No | Skip (unchanged) |
| Yes | No | **toPush** |
| No | Yes | **toPull** |
| Yes | Yes | **Conflict** |
| Local only | - | **localOnly** |
| - | Remote only | **remoteOnly** |

Where:
- `localChanged = local.md5Checksum !== remoteSynced.md5Checksum`
- `remoteChanged = currentRemote.md5Checksum !== remoteSynced.md5Checksum`

---

## Push Changes (Incremental)

Uploads only locally-changed files to remote.

### Flow

1. **Apply temp files** (flatten `__TEMP__/` files into real paths)
2. **Compute diff** using three-way comparison
3. **Check conflicts** — if any, stop and show conflict UI
4. **Check `lastUpdatedAt`** — reject if remote is newer AND has pending pulls
5. **Upload changed checksums** to remote `_sync-meta.json`
6. **Refresh diff** to update status

### Preconditions

| Local Meta | Remote Meta | Remote Newer | Action |
|:----------:|:-----------:|:------------:|--------|
| - | - | - | Nothing to push |
| - | exists | - | Nothing to push |
| exists | exists | Yes (with pending pulls) | Error: "Pull required" |
| exists | exists | No | Proceed with Push |

### Important Notes

- Push does **NOT** upload file contents — Drive already has the latest content because edits go directly to Drive. Push only synchronizes the metadata (checksums).
- Push does **NOT** delete remote files.
- Deleted local files become "untracked" on remote (recoverable via settings).

---

## Pull Changes (Incremental)

Downloads only remotely-changed files to local cache.

### Flow

1. **Compute diff** using three-way comparison
2. **Check conflicts** — if any, stop and show conflict UI
3. **Combine** `toPull` + `remoteOnly` arrays
4. **Download file contents** in parallel (max 5 concurrent)
5. **Update IndexedDB cache** with downloaded files
6. **Update local sync meta** with new checksums
7. **Refresh diff** to update status

### Decision Tables

#### Files in Both Metas

| Local Meta | Remote Meta | Action |
|:----------:|:-----------:|--------|
| A | A | Skip (unchanged) |
| B | A | Skip (local-only change, uploads on next Push) |
| A | B | **Download** (remote changed) |
| B | C | **Conflict** (both changed) |

#### Files Only in Local Meta (Remote Deleted)

| Local Meta | Remote Meta | Current Remote | Action |
|:----------:|:-----------:|:--------------:|--------|
| A | - | - | **localOnly** (kept locally, can push later) |

#### Files Only in Remote (New Remote)

| Local Meta | Remote Meta | Current Remote | Action |
|:----------:|:-----------:|:--------------:|--------|
| - | - | exists | **remoteOnly** → Download |

---

## Full Pull

Downloads all remote files, skipping those with matching hashes.

### Flow

1. **Build `skipHashes`** from all IndexedDB cached files (`fileId → md5Checksum`)
2. **Rebuild remote meta** from Drive API (full scan)
3. **Filter out** system files (`_sync-meta.json`, `settings.json`)
4. **Skip** files where `skipHashes[fileId] === remoteMeta.md5Checksum`
5. **Download** all non-skipped files in parallel (max 5 concurrent)
6. **Replace local sync meta** entirely with remote meta
7. **Update IndexedDB cache** with downloaded files

### When to Use

- Initial setup on a new device/browser
- Recovery after cache corruption
- When you want remote to be authoritative

---

## Full Push

Merges all local metadata into remote metadata.

### Flow

1. **Apply all temp files**
2. **Merge** all local meta entries into remote `_sync-meta.json`
3. **Write** updated remote meta to Drive

### When to Use

- Force remote metadata to match local state
- After bulk local edits that bypassed normal sync

---

## Conflict Resolution

Conflicts occur during Push or Pull when both local and remote versions of a file have changed since the last sync.

| Choice | What Happens |
|--------|--------------|
| **Keep Local** | Back up remote to `sync_conflicts/`, update remote meta with local checksums |
| **Keep Remote** | Back up local to `sync_conflicts/`, download remote content to IndexedDB |

The unselected version is always backed up for manual merging if needed.

### Backup Naming

```
{filename}_{YYYYMMDDTHHmmss}.{ext}
```

Example: `notes/daily.md` → `sync_conflicts/notes_daily_20260207_143000.md`

---

## Temporary Sync

Quick file sharing without full sync overhead. Use when:
- Push/Pull takes too long
- You want to avoid conflict resolution
- You need to quickly share a single file across devices

Files are stored with `__TEMP__/` prefix on Google Drive. **No metadata is updated** — equivalent to making the same edit on both devices manually.

Temp files are automatically flattened (applied to real paths) at the start of every Push.

---

## File Recovery

### Scenario 1: Conflict — Need Both Versions

When a conflict occurs, you choose Keep Local or Keep Remote, but the other version is always saved to `sync_conflicts/`.

**To merge manually:**
1. Open the file you kept
2. Browse `sync_conflicts/` in the file tree to find the other version
3. Copy the parts you need from the backup
4. Delete the backup file when done

### Scenario 2: Recover a Deleted File

When you delete a file locally, it becomes "untracked" on remote.

**To recover:**
1. Settings → Sync tab → Detect Untracked Files
2. Select the file you need
3. Click Restore Selected

### Scenario 3: Restore from Remote

If you accidentally changed or deleted files locally and want to restore from remote.

**To recover:** Use **Full Pull** — this downloads all remote files, skipping only those with matching hashes. Your local cache is replaced entirely.

---

## Settings

| Setting | Description | Default |
|---------|-------------|---------|
| Exclude patterns | Regex patterns for files to exclude from sync diff | `[]` (none) |
| Conflict folder | Folder name for conflict backups | `sync_conflicts` |
| Clear conflict files | Delete all backup files from conflict folder | — |
| Detect Untracked Files | Find/restore/delete untracked remote files | — |
| Full Push | Merge all local metadata to remote | — |
| Full Pull | Download all remote files | — |

### System Files (Always Excluded)

- `_sync-meta.json` — Sync metadata
- `settings.json` — User settings

### Exclude Pattern Examples

Patterns are JavaScript regular expressions:

| Pattern | Effect |
|---------|--------|
| `\.tmp$` | Exclude `.tmp` files |
| `^drafts/` | Exclude files starting with `drafts/` |
| `private` | Exclude files containing "private" in the name |

---

## Architecture

### Data Flow

```
Browser (IndexedDB)          Server                Google Drive
┌──────────────┐      ┌──────────────┐      ┌──────────────┐
│ files store   │      │ /api/sync    │      │ Root folder  │
│ syncMeta      │◄────►│ (diff/push/  │◄────►│ _sync-meta   │
│ remoteMeta    │      │  pull/resolve)│      │ User files   │
│ fileTree      │      │              │      │ sync_conflicts│
└──────────────┘      └──────────────┘      └──────────────┘
```

### Key Files

| File | Role |
|------|------|
| `app/hooks/useSync.ts` | Client-side sync hook (push, pull, conflict, fullPush, fullPull) |
| `app/routes/api.sync.tsx` | Server-side sync API (10 actions) |
| `app/services/sync-meta.server.ts` | Sync metadata read/write/rebuild/diff |
| `app/services/indexeddb-cache.ts` | IndexedDB cache (files, syncMeta, remoteMeta, fileTree) |
| `app/services/google-drive.server.ts` | Google Drive API wrapper |
| `app/utils/parallel.ts` | Parallel processing utility (concurrency limit) |

### API Actions

| Action | Method | Description |
|--------|--------|-------------|
| `diff` | POST | Three-way diff comparison |
| `push` | POST | Update remote meta with local checksums |
| `pull` | POST | Download file contents for specified IDs |
| `resolve` | POST | Resolve conflict (backup loser, update meta) |
| `fullPull` | POST | Download all remote files (skip matching) |
| `fullPush` | POST | Merge all local meta into remote meta |
| `clearConflicts` | POST | Delete all files in conflict folder |
| `detectUntracked` | POST | Find files on Drive not in sync meta |
| `deleteUntracked` | POST | Delete specified untracked files |
| `restoreUntracked` | POST | Add specified files back to sync meta |
