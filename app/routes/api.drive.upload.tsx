import type { Route } from "./+types/api.drive.upload";
import { requireAuth } from "~/services/session.server";
import { getValidTokens } from "~/services/google-auth.server";
import {
  createFileBinary,
  getWorkflowsFolderId,
} from "~/services/google-drive.server";

const MAX_FILE_SIZE = 5 * 1024 * 1024; // 5MB per file (Drive multipart limit)

export async function action({ request }: Route.ActionArgs) {
  const tokens = await requireAuth(request);
  const { tokens: validTokens } = await getValidTokens(request, tokens);

  const formData = await request.formData();
  const folderId = formData.get("folderId") as string | null;
  const files = formData.getAll("files") as File[];

  if (files.length === 0) {
    return Response.json({ error: "No files provided" }, { status: 400 });
  }

  const targetFolderId =
    folderId ||
    (await getWorkflowsFolderId(
      validTokens.accessToken,
      validTokens.rootFolderId
    ));

  const results: { name: string; file?: unknown; error?: string }[] = [];

  for (const file of files) {
    if (file.size > MAX_FILE_SIZE) {
      results.push({
        name: file.name,
        error: `File too large (${(file.size / 1024 / 1024).toFixed(1)}MB). Max 5MB per file.`,
      });
      continue;
    }

    try {
      const arrayBuffer = await file.arrayBuffer();
      const buffer = Buffer.from(arrayBuffer);
      const driveFile = await createFileBinary(
        validTokens.accessToken,
        file.name,
        buffer,
        targetFolderId,
        file.type || "application/octet-stream"
      );
      results.push({ name: file.name, file: driveFile });
    } catch (e) {
      results.push({
        name: file.name,
        error: e instanceof Error ? e.message : "Upload failed",
      });
    }
  }

  return Response.json({ results });
}
