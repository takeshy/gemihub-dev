import {
  getHistoryFolderId,
  listFiles,
  readFile,
  createFile,
  updateFile,
  deleteFile,
} from "./google-drive.server";
import type { ExecutionRecord, ExecutionRecordItem } from "~/engine/types";

const EXEC_HISTORY_FOLDER = "execution-history";
const DRIVE_API = "https://www.googleapis.com/drive/v3";

async function ensureExecHistoryFolderId(
  accessToken: string,
  rootFolderId: string
): Promise<string> {
  const historyFolderId = await getHistoryFolderId(accessToken, rootFolderId);

  const query = `name='${EXEC_HISTORY_FOLDER}' and '${historyFolderId}' in parents and mimeType='application/vnd.google-apps.folder' and trashed=false`;
  const res = await fetch(
    `${DRIVE_API}/files?q=${encodeURIComponent(query)}&fields=files(id,name)`,
    { headers: { Authorization: `Bearer ${accessToken}` } }
  );
  const data = await res.json();

  if (data.files && data.files.length > 0) {
    return data.files[0].id;
  }

  const createRes = await fetch(`${DRIVE_API}/files`, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${accessToken}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      name: EXEC_HISTORY_FOLDER,
      mimeType: "application/vnd.google-apps.folder",
      parents: [historyFolderId],
    }),
  });
  const folder = await createRes.json();
  return folder.id;
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
