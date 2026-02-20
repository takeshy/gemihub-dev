import type { Route } from "./+types/api.obsidian.temp-edit-token";
import { refreshAccessToken } from "~/services/google-auth.server";
import { encryptTempEditToken } from "~/services/temp-edit-token.server";

export async function action({ request }: Route.ActionArgs) {
  if (request.method !== "POST") {
    return new Response("Method not allowed", { status: 405 });
  }

  let body: {
    refreshToken?: string;
    fileId?: string;
    fileName?: string;
    rootFolderId?: string;
  };
  try {
    body = await request.json();
  } catch {
    return Response.json({ error: "Invalid JSON" }, { status: 400 });
  }

  const { refreshToken, fileId, fileName, rootFolderId } = body;
  if (!refreshToken || typeof refreshToken !== "string") {
    return Response.json({ error: "refreshToken is required" }, { status: 400 });
  }
  if (!fileId || typeof fileId !== "string") {
    return Response.json({ error: "fileId is required" }, { status: 400 });
  }
  if (!fileName || typeof fileName !== "string") {
    return Response.json({ error: "fileName is required" }, { status: 400 });
  }
  if (!rootFolderId || typeof rootFolderId !== "string") {
    return Response.json({ error: "rootFolderId is required" }, { status: 400 });
  }

  try {
    // Refresh access token for a full 1-hour window
    const { accessToken } = await refreshAccessToken(refreshToken);
    const createdAt = new Date().toISOString();

    const token = encryptTempEditToken({
      accessToken,
      rootFolderId,
      fileId,
      fileName,
      createdAt,
    });

    return Response.json({ token });
  } catch (err) {
    const message = err instanceof Error ? err.message : "Token generation failed";
    return Response.json({ error: message }, { status: 401 });
  }
}
