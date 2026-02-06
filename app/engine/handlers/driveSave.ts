import type { WorkflowNode, ExecutionContext, FileExplorerData, ServiceContext } from "../types";
import { replaceVariables } from "./utils";
import * as driveService from "~/services/google-drive.server";
import { saveEdit } from "~/services/edit-history.server";

// Handle drive-save node (was: file-save) - save FileExplorerData to Drive
export async function handleDriveSaveNode(
  node: WorkflowNode,
  context: ExecutionContext,
  serviceContext: ServiceContext
): Promise<void> {
  const sourceVar = node.properties["source"] || "";
  const path = replaceVariables(node.properties["path"] || "", context);
  const savePathTo = node.properties["savePathTo"];

  if (!sourceVar) throw new Error("drive-save node missing 'source' property");
  if (!path) throw new Error("drive-save node missing 'path' property");

  const sourceValue = context.variables.get(sourceVar);
  if (sourceValue === undefined) {
    throw new Error(`Variable '${sourceVar}' not found`);
  }

  let fileData: FileExplorerData;
  try {
    fileData = JSON.parse(String(sourceValue));
  } catch {
    throw new Error(`Variable '${sourceVar}' does not contain valid FileExplorerData JSON`);
  }

  // Determine filename
  let fileName = path;
  if (!fileName.includes(".") && fileData.extension) {
    fileName = `${fileName}.${fileData.extension}`;
  }

  const accessToken = serviceContext.driveAccessToken;
  const folderId = serviceContext.driveWorkflowsFolderId;

  // Create or update the file
  const content = fileData.contentType === "binary"
    ? fileData.data  // Base64 encoded
    : fileData.data;

  const driveFile = await driveService.createFile(
    accessToken,
    fileName,
    content,
    folderId,
    fileData.mimeType
  );

  if (savePathTo) {
    context.variables.set(savePathTo, driveFile.name);
  }

  // Save edit history
  if (serviceContext.editHistorySettings && fileData.contentType !== "binary") {
    try {
      await saveEdit(
        accessToken,
        serviceContext.driveRootFolderId,
        serviceContext.editHistorySettings,
        { path: fileName, modifiedContent: content, source: "workflow" }
      );
    } catch { /* don't fail workflow on history error */ }
  }
}
