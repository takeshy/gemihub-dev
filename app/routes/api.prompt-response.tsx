import type { Route } from "./+types/api.prompt-response";
import { requireAuth } from "~/services/session.server";
import { resolvePrompt } from "~/services/execution-store.server";

export async function action({ request }: Route.ActionArgs) {
  await requireAuth(request);

  const body = await request.json();
  const { executionId, value } = body;

  if (!executionId) {
    return Response.json({ error: "Missing executionId" }, { status: 400 });
  }

  resolvePrompt(executionId, value);

  return Response.json({ ok: true });
}
