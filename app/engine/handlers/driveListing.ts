import type { WorkflowNode, ExecutionContext, ServiceContext } from "../types";
import { replaceVariables } from "./utils";
import * as driveService from "~/services/google-drive.server";

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

  // If folder is specified, search for it; otherwise use workflows folder
  let folderId = serviceContext.driveWorkflowsFolderId;
  if (folder) {
    const folders = await driveService.listFolders(accessToken, serviceContext.driveRootFolderId);
    const found = folders.find(f => f.name === folder);
    if (found) folderId = found.id;
  }

  const files = await driveService.listFiles(accessToken, folderId);
  const limitedFiles = files.slice(0, limit);

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
      totalCount: files.length,
      hasMore: files.length > limit,
    })
  );
}

// Handle drive-folder-list node (was: folder-list)
export async function handleDriveFolderListNode(
  node: WorkflowNode,
  context: ExecutionContext,
  serviceContext: ServiceContext
): Promise<void> {
  const parentFolder = replaceVariables(node.properties["folder"] || "", context);
  const saveTo = node.properties["saveTo"];

  if (!saveTo) throw new Error("drive-folder-list node missing 'saveTo' property");

  const accessToken = serviceContext.driveAccessToken;

  let parentId = serviceContext.driveRootFolderId;
  if (parentFolder) {
    const folders = await driveService.listFolders(accessToken, serviceContext.driveRootFolderId);
    const found = folders.find(f => f.name === parentFolder);
    if (found) parentId = found.id;
  }

  const folders = await driveService.listFolders(accessToken, parentId);

  context.variables.set(
    saveTo,
    JSON.stringify({
      folders: folders.map(f => ({ id: f.id, name: f.name })),
      count: folders.length,
    })
  );
}
