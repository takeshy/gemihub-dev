import type { Route } from "./+types/api.sync";
import { requireAuth } from "~/services/session.server";
import { getValidTokens } from "~/services/google-auth.server";
import {
  listFiles,
  readFile,
  getFileMetadata,
  getWorkflowsFolderId,
} from "~/services/google-drive.server";
import {
  readRemoteSyncMeta,
  writeRemoteSyncMeta,
  computeSyncDiff,
  type SyncMeta,
} from "~/services/sync-meta.server";

// GET: Fetch remote sync meta + current file list
export async function loader({ request }: Route.LoaderArgs) {
  const tokens = await requireAuth(request);
  const { tokens: validTokens } = await getValidTokens(request, tokens);

  const workflowsFolderId = await getWorkflowsFolderId(
    validTokens.accessToken,
    validTokens.rootFolderId
  );

  const [remoteMeta, files] = await Promise.all([
    readRemoteSyncMeta(validTokens.accessToken, workflowsFolderId),
    listFiles(validTokens.accessToken, workflowsFolderId),
  ]);

  return Response.json({
    remoteMeta,
    files: files.map((f) => ({
      id: f.id,
      name: f.name,
      mimeType: f.mimeType,
      md5Checksum: f.md5Checksum,
      modifiedTime: f.modifiedTime,
    })),
  });
}

// POST: diff / push / pull / resolve actions
export async function action({ request }: Route.ActionArgs) {
  const tokens = await requireAuth(request);
  const { tokens: validTokens } = await getValidTokens(request, tokens);

  const body = await request.json();
  const { action: actionType } = body;

  const workflowsFolderId = await getWorkflowsFolderId(
    validTokens.accessToken,
    validTokens.rootFolderId
  );

  switch (actionType) {
    case "diff": {
      const localMeta = body.localMeta as SyncMeta | null;
      const [remoteMeta, files] = await Promise.all([
        readRemoteSyncMeta(validTokens.accessToken, workflowsFolderId),
        listFiles(validTokens.accessToken, workflowsFolderId),
      ]);
      const diff = computeSyncDiff(localMeta, remoteMeta, files);
      return Response.json({ diff, remoteMeta });
    }

    case "push": {
      // Update remote meta with the provided local meta for specified file IDs
      const fileIds = body.fileIds as string[];
      const localMeta = body.localMeta as SyncMeta;

      const remoteMeta =
        (await readRemoteSyncMeta(
          validTokens.accessToken,
          workflowsFolderId
        )) ?? {
          lastUpdatedAt: new Date().toISOString(),
          files: {},
        };

      // Update remote meta entries for pushed files
      for (const fileId of fileIds) {
        if (localMeta.files[fileId]) {
          remoteMeta.files[fileId] = localMeta.files[fileId];
        }
      }
      remoteMeta.lastUpdatedAt = new Date().toISOString();

      await writeRemoteSyncMeta(
        validTokens.accessToken,
        workflowsFolderId,
        remoteMeta
      );

      return Response.json({ remoteMeta });
    }

    case "pull": {
      // Return file contents + metadata for specified file IDs
      const fileIds = body.fileIds as string[];
      const results: Array<{
        fileId: string;
        content: string;
        md5Checksum: string;
        modifiedTime: string;
        fileName: string;
      }> = [];

      for (const fileId of fileIds) {
        const [content, meta] = await Promise.all([
          readFile(validTokens.accessToken, fileId),
          getFileMetadata(validTokens.accessToken, fileId),
        ]);
        results.push({
          fileId,
          content,
          md5Checksum: meta.md5Checksum ?? "",
          modifiedTime: meta.modifiedTime ?? "",
          fileName: meta.name,
        });
      }

      return Response.json({ files: results });
    }

    case "resolve": {
      // Resolve a conflict by choosing local or remote
      const { fileId, choice } = body as {
        fileId: string;
        choice: "local" | "remote";
      };

      const remoteMeta =
        (await readRemoteSyncMeta(
          validTokens.accessToken,
          workflowsFolderId
        )) ?? {
          lastUpdatedAt: new Date().toISOString(),
          files: {},
        };

      if (choice === "local") {
        // Local wins — update remote meta with local's checksum
        const localMeta = body.localMeta as SyncMeta;
        if (localMeta?.files[fileId]) {
          remoteMeta.files[fileId] = localMeta.files[fileId];
        }
      } else {
        // Remote wins — get current remote file metadata and update remote meta
        const meta = await getFileMetadata(
          validTokens.accessToken,
          fileId
        );
        remoteMeta.files[fileId] = {
          md5Checksum: meta.md5Checksum ?? "",
          modifiedTime: meta.modifiedTime ?? "",
        };
      }

      remoteMeta.lastUpdatedAt = new Date().toISOString();
      await writeRemoteSyncMeta(
        validTokens.accessToken,
        workflowsFolderId,
        remoteMeta
      );

      // If remote wins, return the file content
      if (choice === "remote") {
        const [content, meta] = await Promise.all([
          readFile(validTokens.accessToken, fileId),
          getFileMetadata(validTokens.accessToken, fileId),
        ]);
        return Response.json({
          remoteMeta,
          file: {
            fileId,
            content,
            md5Checksum: meta.md5Checksum ?? "",
            modifiedTime: meta.modifiedTime ?? "",
            fileName: meta.name,
          },
        });
      }

      return Response.json({ remoteMeta });
    }

    default:
      return Response.json({ error: "Unknown action" }, { status: 400 });
  }
}
