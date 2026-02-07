import type { Route } from "./+types/api.auth.unlock";
import { requireAuth, getSession, commitSession } from "~/services/session.server";
import { getValidTokens } from "~/services/google-auth.server";
import { getSettings } from "~/services/user-settings.server";
import { decryptPrivateKey } from "~/services/crypto-core";

export async function action({ request }: Route.ActionArgs) {
  const tokens = await requireAuth(request);
  const { tokens: validTokens } = await getValidTokens(request, tokens);
  const settings = await getSettings(validTokens.accessToken, validTokens.rootFolderId);

  const { password } = await request.json();
  if (!password || !settings.encryptedApiKey || !settings.apiKeySalt) {
    return Response.json({ error: "Invalid request" }, { status: 400 });
  }

  try {
    const apiKey = await decryptPrivateKey(settings.encryptedApiKey, settings.apiKeySalt, password);
    const session = await getSession(request);
    session.set("geminiApiKey", apiKey);
    return new Response(JSON.stringify({ success: true }), {
      headers: {
        "Content-Type": "application/json",
        "Set-Cookie": await commitSession(session),
      },
    });
  } catch {
    return Response.json({ error: "Incorrect password" }, { status: 401 });
  }
}
