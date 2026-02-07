import type { WorkflowNode, ExecutionContext, ServiceContext } from "../types";
import { replaceVariables } from "./utils";
import { getFileListFromMeta } from "~/services/sync-meta.server";

// Handle drive-list node (was: note-list)
export async function handleDriveListNode(
  node: WorkflowNode,
  context: ExecutionContext,
  serviceContext: ServiceContext
): Promise<void> {
  const folder = replaceVariables(node.properties["folder"] || "", context);
  const limitStr = node.properties["limit"] || "50";
  const limit = parseInt(limitStr, 10) || 50;
  const saveTo = node.properties["saveTo"];

  if (!saveTo) throw new Error("drive-list node missing 'saveTo' property");

  const accessToken = serviceContext.driveAccessToken;

  // List all user files from meta (fast path)
  const { files: allFiles } = await getFileListFromMeta(accessToken, serviceContext.driveRootFolderId);

  // Filter by virtual folder prefix
  const prefix = folder ? folder + "/" : "";
  const filtered = folder
    ? allFiles.filter(f => f.name.startsWith(prefix))
    : allFiles;
  const limitedFiles = filtered.slice(0, limit);

  const results = limitedFiles.map(f => ({
    id: f.id,
    name: f.name,
    modifiedTime: f.modifiedTime,
    createdTime: f.createdTime,
  }));

  context.variables.set(
    saveTo,
    JSON.stringify({
      notes: results,
      count: results.length,
      totalCount: filtered.length,
      hasMore: filtered.length > limit,
    })
  );
}

// Handle drive-folder-list node (was: folder-list)
// In flat storage, "folders" are virtual — derived from path prefixes in file names
export async function handleDriveFolderListNode(
  node: WorkflowNode,
  context: ExecutionContext,
  serviceContext: ServiceContext
): Promise<void> {
  const parentFolder = replaceVariables(node.properties["folder"] || "", context);
  const saveTo = node.properties["saveTo"];

  if (!saveTo) throw new Error("drive-folder-list node missing 'saveTo' property");

  const accessToken = serviceContext.driveAccessToken;
  const { files: allFiles } = await getFileListFromMeta(accessToken, serviceContext.driveRootFolderId);

  // Extract immediate virtual subfolder names under parentFolder
  const prefix = parentFolder ? parentFolder + "/" : "";
  const folderNames = new Set<string>();

  for (const f of allFiles) {
    const name = parentFolder ? (f.name.startsWith(prefix) ? f.name.slice(prefix.length) : null) : f.name;
    if (name === null) continue;
    const slashIndex = name.indexOf("/");
    if (slashIndex !== -1) {
      folderNames.add(name.slice(0, slashIndex));
    }
  }

  const sortedFolders = Array.from(folderNames).sort();

  context.variables.set(
    saveTo,
    JSON.stringify({
      folders: sortedFolders.map(name => ({ name })),
      count: sortedFolders.length,
    })
  );
}
