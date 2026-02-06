// Chat history CRUD via Google Drive

import {
  listFiles,
  readFile,
  createFile,
  updateFile,
  deleteFile,
} from "./google-drive.server";
import type { ChatHistory, ChatHistoryItem } from "~/types/chat";

const CHATS_FOLDER = "chats";

/**
 * Ensure the chats subfolder exists
 */
async function ensureChatsFolderId(
  accessToken: string,
  rootFolderId: string
): Promise<string> {
  // Import ensureSubFolder functionality inline
  const DRIVE_API = "https://www.googleapis.com/drive/v3";

  const query = `name='${CHATS_FOLDER}' and '${rootFolderId}' in parents and mimeType='application/vnd.google-apps.folder' and trashed=false`;
  const res = await fetch(
    `${DRIVE_API}/files?q=${encodeURIComponent(query)}&fields=files(id,name)`,
    {
      headers: { Authorization: `Bearer ${accessToken}` },
    }
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
      name: CHATS_FOLDER,
      mimeType: "application/vnd.google-apps.folder",
      parents: [rootFolderId],
    }),
  });
  const folder = await createRes.json();
  return folder.id;
}

/**
 * List all chat histories (metadata only)
 */
export async function listChatHistories(
  accessToken: string,
  rootFolderId: string
): Promise<ChatHistoryItem[]> {
  const chatsFolderId = await ensureChatsFolderId(accessToken, rootFolderId);
  const files = await listFiles(accessToken, chatsFolderId);

  const items: ChatHistoryItem[] = [];
  for (const file of files) {
    if (!file.name.endsWith(".json")) continue;

    try {
      const content = await readFile(accessToken, file.id);
      const chat = JSON.parse(content) as ChatHistory;
      items.push({
        id: chat.id,
        fileId: file.id,
        title: chat.title,
        createdAt: chat.createdAt,
        updatedAt: chat.updatedAt,
        isEncrypted: chat.isEncrypted,
      });
    } catch {
      // Skip invalid files
    }
  }

  // Sort by updatedAt descending
  items.sort((a, b) => b.updatedAt - a.updatedAt);
  return items;
}

/**
 * Load a specific chat
 */
export async function loadChat(
  accessToken: string,
  chatFileId: string
): Promise<ChatHistory> {
  const content = await readFile(accessToken, chatFileId);
  return JSON.parse(content) as ChatHistory;
}

/**
 * Save a chat (create or update)
 */
export async function saveChat(
  accessToken: string,
  rootFolderId: string,
  chatHistory: ChatHistory
): Promise<string> {
  const chatsFolderId = await ensureChatsFolderId(accessToken, rootFolderId);
  const content = JSON.stringify(chatHistory, null, 2);
  const fileName = `chat_${chatHistory.id}.json`;

  // Check if file already exists
  const files = await listFiles(accessToken, chatsFolderId);
  const existing = files.find((f) => f.name === fileName);

  if (existing) {
    await updateFile(accessToken, existing.id, content, "application/json");
    return existing.id;
  } else {
    const file = await createFile(accessToken, fileName, content, chatsFolderId, "application/json");
    return file.id;
  }
}

/**
 * Delete a chat
 */
export async function deleteChat(
  accessToken: string,
  chatFileId: string
): Promise<void> {
  await deleteFile(accessToken, chatFileId);
}
