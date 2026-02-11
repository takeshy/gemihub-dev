import assert from "node:assert/strict";
import test from "node:test";
import { handleRagAction } from "~/services/sync-rag.server";
import { DEFAULT_RAG_SETTING, DEFAULT_RAG_STORE_KEY } from "~/types/settings";

test("ragRegister -> ragSave -> ragRetryPending uses bytes", async () => {
  const settings: any = {
    ragRegistrationOnPush: true,
    ragSettings: {},
    ragEnabled: false,
    selectedRagSetting: null,
  };

  const capturedContents: Array<unknown> = [];
  const deps = {
    getSettings: async () => settings,
    saveSettings: async (_accessToken: string, _rootFolderId: string, next: any) => {
      Object.assign(settings, next);
    },
    getOrCreateStore: async () => "stores/test",
    registerSingleFile: async (
      _apiKey: string,
      _storeName: string,
      _fileName: string,
      content: unknown
    ) => {
      capturedContents.push(content);
      return { checksum: "chk", fileId: "doc1" };
    },
    calculateChecksum: async (_content: unknown) => "chk",
    deleteSingleFileFromRag: async () => true,
    readFileBytes: async () => new Uint8Array([1, 2, 3, 4]),
    rebuildSyncMeta: async () => ({
      lastUpdatedAt: new Date().toISOString(),
      files: {
        file999: {
          name: "pending.pdf",
          mimeType: "application/pdf",
          md5Checksum: "",
          modifiedTime: new Date().toISOString(),
        },
      },
    }),
  };

  const validTokens = {
    accessToken: "token",
    rootFolderId: "root",
    geminiApiKey: "api-key",
  };

  const jsonWithCookie = (data: unknown, init?: ResponseInit) => Response.json(data, init);

  const registerResponse = await handleRagAction(
    "ragRegister",
    { action: "ragRegister", fileId: "file123", fileName: "doc.pdf", content: "text" },
    { validTokens, jsonWithCookie },
    deps
  );
  const registerData = await registerResponse.json();
  assert.equal(registerData.ok, true);
  assert.ok(capturedContents[0] instanceof Uint8Array);

  const saveResponse = await handleRagAction(
    "ragSave",
    {
      action: "ragSave",
      updates: [
        {
          fileName: "pending.pdf",
          ragFileInfo: { checksum: "", uploadedAt: Date.now(), fileId: null, status: "pending" },
        },
      ],
      storeName: "stores/test",
    },
    { validTokens, jsonWithCookie },
    deps
  );
  const saveData = await saveResponse.json();
  assert.equal(saveData.ok, true);

  const retryResponse = await handleRagAction(
    "ragRetryPending",
    { action: "ragRetryPending" },
    { validTokens, jsonWithCookie },
    deps
  );
  const retryData = await retryResponse.json();
  assert.equal(retryData.retried, 1);
  assert.ok(capturedContents[1] instanceof Uint8Array);

  const ragSetting = settings.ragSettings[DEFAULT_RAG_STORE_KEY] ?? { ...DEFAULT_RAG_SETTING };
  assert.equal(ragSetting.files["pending.pdf"].status, "registered");
});
