// Local plugin loader for development — reads plugins from the `plugins/` directory
// Only active in development mode (NODE_ENV !== "production")

import fs from "node:fs";
import path from "node:path";
import type { PluginConfig } from "~/types/settings";

const PLUGINS_DIR = path.resolve("plugins");
const ALLOWED_FILES = new Set(["main.js", "styles.css", "manifest.json"]);

/**
 * Scan the `plugins/` directory and return PluginConfig entries for each valid plugin.
 * A valid plugin has a `plugins/{id}/manifest.json` file.
 * Returns an empty array in production or if the directory does not exist.
 */
export function getLocalPlugins(): PluginConfig[] {
  if (process.env.NODE_ENV === "production") return [];

  let entries: string[];
  try {
    entries = fs.readdirSync(PLUGINS_DIR);
  } catch {
    return [];
  }

  const plugins: PluginConfig[] = [];
  for (const name of entries) {
    const dir = path.join(PLUGINS_DIR, name);
    try {
      if (!fs.statSync(dir).isDirectory()) continue;
    } catch {
      continue;
    }
    const manifestPath = path.join(dir, "manifest.json");
    if (!fs.existsSync(manifestPath)) continue;

    try {
      const manifest = JSON.parse(fs.readFileSync(manifestPath, "utf-8"));
      plugins.push({
        id: manifest.id || name,
        repo: "local",
        version: "dev",
        enabled: true,
        source: "local",
      });
    } catch {
      // skip plugins with invalid manifest
    }
  }
  return plugins;
}

/**
 * Read a file from a local plugin directory.
 * Only serves allowed files (main.js, styles.css, manifest.json).
 * Returns null if the file does not exist or is not allowed.
 */
export function getLocalPluginFile(
  pluginId: string,
  fileName: string
): string | null {
  if (process.env.NODE_ENV === "production") return null;
  if (!ALLOWED_FILES.has(fileName)) return null;

  const filePath = path.resolve(PLUGINS_DIR, pluginId, fileName);
  // Prevent path traversal — resolved path must stay within PLUGINS_DIR
  if (!filePath.startsWith(PLUGINS_DIR + path.sep)) return null;

  try {
    return fs.readFileSync(filePath, "utf-8");
  } catch {
    return null;
  }
}

/**
 * Check if a plugin ID corresponds to a local plugin.
 */
export function isLocalPlugin(pluginId: string): boolean {
  if (process.env.NODE_ENV === "production") return false;

  const filePath = path.resolve(PLUGINS_DIR, pluginId, "manifest.json");
  if (!filePath.startsWith(PLUGINS_DIR + path.sep)) return false;

  return fs.existsSync(filePath);
}

/**
 * Read data.json for a local plugin. Returns {} if not found.
 */
export function getLocalPluginData(
  pluginId: string
): Record<string, unknown> {
  const filePath = path.resolve(PLUGINS_DIR, pluginId, "data.json");
  if (!filePath.startsWith(PLUGINS_DIR + path.sep)) return {};

  try {
    return JSON.parse(fs.readFileSync(filePath, "utf-8"));
  } catch {
    return {};
  }
}

/**
 * Save data.json for a local plugin.
 */
export function saveLocalPluginData(
  pluginId: string,
  data: Record<string, unknown>
): void {
  const filePath = path.resolve(PLUGINS_DIR, pluginId, "data.json");
  if (!filePath.startsWith(PLUGINS_DIR + path.sep)) {
    throw new Error("Invalid plugin ID");
  }

  fs.writeFileSync(filePath, JSON.stringify(data, null, 2), "utf-8");
}

/**
 * Uninstall a local plugin by deleting its directory.
 */
export function uninstallLocalPlugin(pluginId: string): void {
  const dirPath = path.resolve(PLUGINS_DIR, pluginId);
  if (!dirPath.startsWith(PLUGINS_DIR + path.sep)) {
    throw new Error("Invalid plugin ID");
  }
  if (!fs.existsSync(dirPath)) {
    throw new Error(`Plugin directory not found: ${pluginId}`);
  }
  fs.rmSync(dirPath, { recursive: true, force: true });
}
