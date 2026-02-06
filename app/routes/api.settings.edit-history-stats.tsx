import type { Route } from "./+types/api.settings.edit-history-stats";
import { requireAuth } from "~/services/session.server";
import { getValidTokens } from "~/services/google-auth.server";
import { getStats } from "~/services/edit-history.server";

export async function loader({ request }: Route.LoaderArgs) {
  const tokens = await requireAuth(request);
  const { tokens: validTokens } = await getValidTokens(request, tokens);

  try {
    const stats = await getStats(
      validTokens.accessToken,
      validTokens.rootFolderId
    );
    return Response.json(stats);
  } catch (error) {
    return Response.json(
      { error: error instanceof Error ? error.message : "Failed to get stats" },
      { status: 500 }
    );
  }
}
