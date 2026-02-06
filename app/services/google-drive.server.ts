import type { SessionTokens } from "./session.server";

const DRIVE_API = "https://www.googleapis.com/drive/v3";
const DRIVE_UPLOAD_API = "https://www.googleapis.com/upload/drive/v3";
const ROOT_FOLDER_NAME = "gemini-hub";
const WORKFLOWS_FOLDER = "workflows";
const HISTORY_FOLDER = "history";

export interface DriveFile {
  id: string;
  name: string;
  mimeType: string;
  modifiedTime?: string;
  createdTime?: string;
  parents?: string[];
  webViewLink?: string;
  md5Checksum?: string;
}

interface DriveListResponse {
  files: DriveFile[];
  nextPageToken?: string;
}

async function driveRequest(
  url: string,
  accessToken: string,
  options: RequestInit = {}
): Promise<Response> {
  const response = await fetch(url, {
    ...options,
    headers: {
      Authorization: `Bearer ${accessToken}`,
      ...options.headers,
    },
  });

  if (!response.ok) {
    const text = await response.text();
    throw new Error(`Drive API error ${response.status}: ${text}`);
  }

  return response;
}

// Find or create the root app folder
export async function ensureRootFolder(accessToken: string, folderName?: string): Promise<string> {
  const name = folderName || ROOT_FOLDER_NAME;
  // Search for existing folder
  const query = `name='${name}' and mimeType='application/vnd.google-apps.folder' and trashed=false`;
  const res = await driveRequest(
    `${DRIVE_API}/files?q=${encodeURIComponent(query)}&fields=files(id,name)`,
    accessToken
  );
  const data: DriveListResponse = await res.json();

  if (data.files.length > 0) {
    return data.files[0].id;
  }

  // Create root folder
  const createRes = await driveRequest(`${DRIVE_API}/files`, accessToken, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      name,
      mimeType: "application/vnd.google-apps.folder",
    }),
  });
  const folder: DriveFile = await createRes.json();
  return folder.id;
}

// Ensure a subfolder exists
async function ensureSubFolder(
  accessToken: string,
  parentId: string,
  folderName: string
): Promise<string> {
  const query = `name='${folderName}' and '${parentId}' in parents and mimeType='application/vnd.google-apps.folder' and trashed=false`;
  const res = await driveRequest(
    `${DRIVE_API}/files?q=${encodeURIComponent(query)}&fields=files(id,name)`,
    accessToken
  );
  const data: DriveListResponse = await res.json();

  if (data.files.length > 0) {
    return data.files[0].id;
  }

  const createRes = await driveRequest(`${DRIVE_API}/files`, accessToken, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      name: folderName,
      mimeType: "application/vnd.google-apps.folder",
      parents: [parentId],
    }),
  });
  const folder: DriveFile = await createRes.json();
  return folder.id;
}

export async function getWorkflowsFolderId(
  accessToken: string,
  rootFolderId: string
): Promise<string> {
  return ensureSubFolder(accessToken, rootFolderId, WORKFLOWS_FOLDER);
}

export async function getHistoryFolderId(
  accessToken: string,
  rootFolderId: string
): Promise<string> {
  return ensureSubFolder(accessToken, rootFolderId, HISTORY_FOLDER);
}

// List files in a folder
export async function listFiles(
  accessToken: string,
  folderId: string,
  mimeType?: string
): Promise<DriveFile[]> {
  let query = `'${folderId}' in parents and trashed=false`;
  if (mimeType) {
    query += ` and mimeType='${mimeType}'`;
  }

  const res = await driveRequest(
    `${DRIVE_API}/files?q=${encodeURIComponent(query)}&fields=files(id,name,mimeType,modifiedTime,createdTime,webViewLink,md5Checksum)&orderBy=modifiedTime desc`,
    accessToken
  );
  const data: DriveListResponse = await res.json();
  return data.files;
}

// Read file content
export async function readFile(
  accessToken: string,
  fileId: string
): Promise<string> {
  const res = await driveRequest(
    `${DRIVE_API}/files/${fileId}?alt=media`,
    accessToken
  );
  return res.text();
}

// Read file as raw Response (for binary files like PDF)
export async function readFileRaw(
  accessToken: string,
  fileId: string
): Promise<Response> {
  return driveRequest(
    `${DRIVE_API}/files/${fileId}?alt=media`,
    accessToken
  );
}

// Get file metadata
export async function getFileMetadata(
  accessToken: string,
  fileId: string
): Promise<DriveFile> {
  const res = await driveRequest(
    `${DRIVE_API}/files/${fileId}?fields=id,name,mimeType,modifiedTime,createdTime,parents,webViewLink,md5Checksum`,
    accessToken
  );
  return res.json();
}

// Create a new file
export async function createFile(
  accessToken: string,
  name: string,
  content: string,
  parentId: string,
  mimeType: string = "text/plain"
): Promise<DriveFile> {
  const metadata = {
    name,
    parents: [parentId],
    mimeType,
  };

  const boundary = "-------boundary" + Date.now();
  const body =
    `--${boundary}\r\n` +
    `Content-Type: application/json; charset=UTF-8\r\n\r\n` +
    `${JSON.stringify(metadata)}\r\n` +
    `--${boundary}\r\n` +
    `Content-Type: ${mimeType}\r\n\r\n` +
    `${content}\r\n` +
    `--${boundary}--`;

  const res = await driveRequest(
    `${DRIVE_UPLOAD_API}/files?uploadType=multipart&fields=id,name,mimeType,modifiedTime,createdTime,webViewLink,md5Checksum`,
    accessToken,
    {
      method: "POST",
      headers: {
        "Content-Type": `multipart/related; boundary=${boundary}`,
      },
      body,
    }
  );
  return res.json();
}

// Update file content
export async function updateFile(
  accessToken: string,
  fileId: string,
  content: string,
  mimeType: string = "text/plain"
): Promise<DriveFile> {
  const res = await driveRequest(
    `${DRIVE_UPLOAD_API}/files/${fileId}?uploadType=media&fields=id,name,mimeType,modifiedTime,createdTime,webViewLink,md5Checksum`,
    accessToken,
    {
      method: "PATCH",
      headers: { "Content-Type": mimeType },
      body: content,
    }
  );
  return res.json();
}

// Rename a file
export async function renameFile(
  accessToken: string,
  fileId: string,
  newName: string
): Promise<DriveFile> {
  const res = await driveRequest(
    `${DRIVE_API}/files/${fileId}?fields=id,name,mimeType,modifiedTime,createdTime,webViewLink,md5Checksum`,
    accessToken,
    {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ name: newName }),
    }
  );
  return res.json();
}

// Delete a file
export async function deleteFile(
  accessToken: string,
  fileId: string
): Promise<void> {
  await driveRequest(`${DRIVE_API}/files/${fileId}`, accessToken, {
    method: "DELETE",
  });
}

// Search files by name or content
export async function searchFiles(
  accessToken: string,
  rootFolderId: string,
  query: string,
  searchContent: boolean = false
): Promise<DriveFile[]> {
  let driveQuery: string;
  if (searchContent) {
    driveQuery = `fullText contains '${query.replace(/'/g, "\\'")}' and '${rootFolderId}' in parents and trashed=false`;
  } else {
    driveQuery = `name contains '${query.replace(/'/g, "\\'")}' and '${rootFolderId}' in parents and trashed=false`;
  }

  const res = await driveRequest(
    `${DRIVE_API}/files?q=${encodeURIComponent(driveQuery)}&fields=files(id,name,mimeType,modifiedTime,createdTime,webViewLink,md5Checksum)`,
    accessToken
  );
  const data: DriveListResponse = await res.json();
  return data.files;
}

// List folders under a parent
export async function listFolders(
  accessToken: string,
  parentId: string
): Promise<DriveFile[]> {
  const query = `'${parentId}' in parents and mimeType='application/vnd.google-apps.folder' and trashed=false`;
  const res = await driveRequest(
    `${DRIVE_API}/files?q=${encodeURIComponent(query)}&fields=files(id,name,mimeType)&orderBy=name`,
    accessToken
  );
  const data: DriveListResponse = await res.json();
  return data.files;
}

// Create a folder
export async function createFolder(
  accessToken: string,
  name: string,
  parentId: string
): Promise<DriveFile> {
  const res = await driveRequest(`${DRIVE_API}/files`, accessToken, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      name,
      mimeType: "application/vnd.google-apps.folder",
      parents: [parentId],
    }),
  });
  return res.json();
}

// Create a file with binary content (for file uploads)
export async function createFileBinary(
  accessToken: string,
  name: string,
  contentBuffer: Buffer,
  parentId: string,
  mimeType: string = "application/octet-stream"
): Promise<DriveFile> {
  const metadata = JSON.stringify({
    name,
    parents: [parentId],
    mimeType,
  });

  const boundary = "-------boundary" + Date.now();
  const preamble = Buffer.from(
    `--${boundary}\r\nContent-Type: application/json; charset=UTF-8\r\n\r\n${metadata}\r\n--${boundary}\r\nContent-Type: ${mimeType}\r\n\r\n`,
    "utf-8"
  );
  const epilogue = Buffer.from(`\r\n--${boundary}--`, "utf-8");
  const body = Buffer.concat([preamble, contentBuffer, epilogue]);

  const res = await driveRequest(
    `${DRIVE_UPLOAD_API}/files?uploadType=multipart&fields=id,name,mimeType,modifiedTime,createdTime,webViewLink,md5Checksum`,
    accessToken,
    {
      method: "POST",
      headers: {
        "Content-Type": `multipart/related; boundary=${boundary}`,
      },
      body,
    }
  );
  return res.json();
}

// Helper to get Drive service context for workflow execution
export interface DriveServiceContext {
  accessToken: string;
  rootFolderId: string;
  workflowsFolderId: string;
  historyFolderId: string;
}

export async function getDriveContext(
  tokens: SessionTokens
): Promise<DriveServiceContext> {
  const workflowsFolderId = await getWorkflowsFolderId(
    tokens.accessToken,
    tokens.rootFolderId
  );
  const historyFolderId = await getHistoryFolderId(
    tokens.accessToken,
    tokens.rootFolderId
  );

  return {
    accessToken: tokens.accessToken,
    rootFolderId: tokens.rootFolderId,
    workflowsFolderId,
    historyFolderId,
  };
}
