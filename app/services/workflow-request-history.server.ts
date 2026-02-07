import {
  getHistoryFolderId,
  ensureSubFolder,
  listFiles,
  readFile,
  createFile,
  deleteFile,
} from "./google-drive.server";
import type {
  WorkflowRequestRecord,
  WorkflowRequestRecordItem,
} from "~/engine/types";

const REQUEST_HISTORY_FOLDER = "requests";

async function ensureRequestHistoryFolderId(
  accessToken: string,
  rootFolderId: string
): Promise<string> {
  const historyFolderId = await getHistoryFolderId(accessToken, rootFolderId);
  return ensureSubFolder(accessToken, historyFolderId, REQUEST_HISTORY_FOLDER);
}

export async function saveRequestRecord(
  accessToken: string,
  rootFolderId: string,
  record: WorkflowRequestRecord
): Promise<string> {
  const folderId = await ensureRequestHistoryFolderId(accessToken, rootFolderId);
  const content = JSON.stringify(record, null, 2);
  const fileName = `req_${record.id}.json`;

  const file = await createFile(
    accessToken,
    fileName,
    content,
    folderId,
    "application/json"
  );
  return file.id;
}

export async function listRequestRecords(
  accessToken: string,
  rootFolderId: string,
  workflowId?: string
): Promise<WorkflowRequestRecordItem[]> {
  const folderId = await ensureRequestHistoryFolderId(accessToken, rootFolderId);
  const files = await listFiles(accessToken, folderId);

  const items: WorkflowRequestRecordItem[] = [];
  for (const file of files) {
    if (!file.name.endsWith(".json")) continue;

    try {
      const content = await readFile(accessToken, file.id);
      const record = JSON.parse(content) as WorkflowRequestRecord;

      if (workflowId && record.workflowId !== workflowId) continue;

      items.push({
        id: record.id,
        fileId: file.id,
        workflowId: record.workflowId,
        workflowName: record.workflowName,
        createdAt: record.createdAt,
        description: record.description,
        model: record.model,
        mode: record.mode,
      });
    } catch {
      // Skip invalid files
    }
  }

  items.sort(
    (a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
  );
  return items;
}

export async function loadRequestRecord(
  accessToken: string,
  fileId: string
): Promise<WorkflowRequestRecord> {
  const content = await readFile(accessToken, fileId);
  return JSON.parse(content) as WorkflowRequestRecord;
}

export async function deleteRequestRecord(
  accessToken: string,
  fileId: string
): Promise<void> {
  await deleteFile(accessToken, fileId);
}
