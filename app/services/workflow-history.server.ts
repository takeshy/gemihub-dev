import {
  getHistoryFolderId,
  ensureSubFolder,
  listFiles,
  readFile,
  createFile,
  updateFile,
  deleteFile,
} from "./google-drive.server";
import type { ExecutionRecord, ExecutionRecordItem } from "~/engine/types";

const EXEC_HISTORY_FOLDER = "execution";

async function ensureExecHistoryFolderId(
  accessToken: string,
  rootFolderId: string
): Promise<string> {
  const historyFolderId = await getHistoryFolderId(accessToken, rootFolderId);
  return ensureSubFolder(accessToken, historyFolderId, EXEC_HISTORY_FOLDER);
}

export async function saveExecutionRecord(
  accessToken: string,
  rootFolderId: string,
  record: ExecutionRecord
): Promise<string> {
  const folderId = await ensureExecHistoryFolderId(accessToken, rootFolderId);
  const content = JSON.stringify(record, null, 2);
  const fileName = `exec_${record.id}.json`;

  const files = await listFiles(accessToken, folderId);
  const existing = files.find((f) => f.name === fileName);

  if (existing) {
    await updateFile(accessToken, existing.id, content, "application/json");
    return existing.id;
  } else {
    const file = await createFile(
      accessToken,
      fileName,
      content,
      folderId,
      "application/json"
    );
    return file.id;
  }
}

export async function listExecutionRecords(
  accessToken: string,
  rootFolderId: string,
  workflowId?: string
): Promise<ExecutionRecordItem[]> {
  const folderId = await ensureExecHistoryFolderId(accessToken, rootFolderId);
  const files = await listFiles(accessToken, folderId);

  const items: ExecutionRecordItem[] = [];
  for (const file of files) {
    if (!file.name.endsWith(".json")) continue;

    try {
      const content = await readFile(accessToken, file.id);
      const record = JSON.parse(content) as ExecutionRecord;

      if (workflowId && record.workflowId !== workflowId) continue;

      items.push({
        id: record.id,
        fileId: file.id,
        workflowId: record.workflowId,
        workflowName: record.workflowName,
        startTime: record.startTime,
        endTime: record.endTime,
        status: record.status,
        stepCount: record.steps?.length || 0,
      });
    } catch {
      // Skip invalid files
    }
  }

  items.sort(
    (a, b) => new Date(b.startTime).getTime() - new Date(a.startTime).getTime()
  );
  return items;
}

export async function loadExecutionRecord(
  accessToken: string,
  fileId: string
): Promise<ExecutionRecord> {
  const content = await readFile(accessToken, fileId);
  return JSON.parse(content) as ExecutionRecord;
}

export async function deleteExecutionRecord(
  accessToken: string,
  fileId: string
): Promise<void> {
  await deleteFile(accessToken, fileId);
}
