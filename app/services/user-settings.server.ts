// User settings CRUD via Google Drive (settings.json in root folder)

import { listFiles, readFile, createFile, updateFile } from "./google-drive.server";
import { DEFAULT_USER_SETTINGS, type UserSettings } from "~/types/settings";

const SETTINGS_FILE_NAME = "settings.json";

// In-memory cache per request (avoid repeated reads within the same request)
const settingsCache = new Map<string, { settings: UserSettings; fileId: string | null }>();

/**
 * Find or create the settings.json file ID in the root folder
 */
async function getSettingsFileId(
  accessToken: string,
  rootFolderId: string
): Promise<string | null> {
  const files = await listFiles(accessToken, rootFolderId);
  const settingsFile = files.find((f) => f.name === SETTINGS_FILE_NAME);
  return settingsFile?.id ?? null;
}

/**
 * Load user settings from Drive. Returns defaults if not found.
 */
export async function getSettings(
  accessToken: string,
  rootFolderId: string
): Promise<UserSettings> {
  const cacheKey = `${accessToken}:${rootFolderId}`;
  const cached = settingsCache.get(cacheKey);
  if (cached) {
    return cached.settings;
  }

  try {
    const fileId = await getSettingsFileId(accessToken, rootFolderId);
    if (!fileId) {
      settingsCache.set(cacheKey, { settings: DEFAULT_USER_SETTINGS, fileId: null });
      return DEFAULT_USER_SETTINGS;
    }

    const content = await readFile(accessToken, fileId);
    const parsed = JSON.parse(content) as Partial<UserSettings>;

    // Merge with defaults to handle missing fields from older versions
    const settings: UserSettings = {
      ...DEFAULT_USER_SETTINGS,
      ...parsed,
      encryption: { ...DEFAULT_USER_SETTINGS.encryption, ...parsed.encryption },
      editHistory: {
        ...DEFAULT_USER_SETTINGS.editHistory,
        ...parsed.editHistory,
        retention: {
          ...DEFAULT_USER_SETTINGS.editHistory.retention,
          ...parsed.editHistory?.retention,
        },
        diff: {
          ...DEFAULT_USER_SETTINGS.editHistory.diff,
          ...parsed.editHistory?.diff,
        },
      },
    };

    settingsCache.set(cacheKey, { settings, fileId });
    return settings;
  } catch {
    return DEFAULT_USER_SETTINGS;
  }
}

/**
 * Save user settings to Drive
 */
export async function saveSettings(
  accessToken: string,
  rootFolderId: string,
  settings: UserSettings
): Promise<void> {
  const content = JSON.stringify(settings, null, 2);
  const fileId = await getSettingsFileId(accessToken, rootFolderId);

  if (fileId) {
    await updateFile(accessToken, fileId, content, "application/json");
  } else {
    await createFile(accessToken, SETTINGS_FILE_NAME, content, rootFolderId, "application/json");
  }

  // Update cache
  const cacheKey = `${accessToken}:${rootFolderId}`;
  settingsCache.set(cacheKey, { settings, fileId });
}

/**
 * Clear settings cache (call at end of request if needed)
 */
export function clearSettingsCache(): void {
  settingsCache.clear();
}
