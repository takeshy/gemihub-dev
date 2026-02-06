import type { Route } from "./+types/api.settings.edit-history";
import { requireAuth } from "~/services/session.server";
import { getValidTokens } from "~/services/google-auth.server";
import { getHistory, clearHistory } from "~/services/edit-history.server";

export async function loader({ request }: Route.LoaderArgs) {
  const tokens = await requireAuth(request);
  const { tokens: validTokens } = await getValidTokens(request, tokens);

  const url = new URL(request.url);
  const filePath = url.searchParams.get("filePath");

  if (!filePath) {
    return Response.json({ error: "Missing filePath" }, { status: 400 });
  }

  try {
    const entries = await getHistory(
      validTokens.accessToken,
      validTokens.rootFolderId,
      filePath
    );
    return Response.json({ entries });
  } catch (error) {
    return Response.json(
      { error: error instanceof Error ? error.message : "Failed to get history" },
      { status: 500 }
    );
  }
}

export async function action({ request }: Route.ActionArgs) {
  if (request.method !== "DELETE") {
    return Response.json({ error: "Method not allowed" }, { status: 405 });
  }

  const tokens = await requireAuth(request);
  const { tokens: validTokens } = await getValidTokens(request, tokens);

  const body = await request.json();
  const filePath = body.filePath;

  if (!filePath) {
    return Response.json({ error: "Missing filePath" }, { status: 400 });
  }

  try {
    await clearHistory(
      validTokens.accessToken,
      validTokens.rootFolderId,
      filePath
    );
    return Response.json({ success: true });
  } catch (error) {
    return Response.json(
      { error: error instanceof Error ? error.message : "Failed to clear history" },
      { status: 500 }
    );
  }
}
