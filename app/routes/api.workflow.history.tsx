import type { Route } from "./+types/api.workflow.history";
import { requireAuth } from "~/services/session.server";
import { getValidTokens } from "~/services/google-auth.server";
import {
  listExecutionRecords,
  loadExecutionRecord,
  deleteExecutionRecord,
} from "~/services/workflow-history.server";

export async function loader({ request }: Route.LoaderArgs) {
  const tokens = await requireAuth(request);
  const { tokens: validTokens } = await getValidTokens(request, tokens);

  const url = new URL(request.url);
  const fileId = url.searchParams.get("fileId");
  const workflowId = url.searchParams.get("workflowId");

  if (fileId) {
    const record = await loadExecutionRecord(validTokens.accessToken, fileId);
    return Response.json({ record });
  }

  const records = await listExecutionRecords(
    validTokens.accessToken,
    validTokens.rootFolderId,
    workflowId || undefined
  );
  return Response.json({ records });
}

export async function action({ request }: Route.ActionArgs) {
  const tokens = await requireAuth(request);
  const { tokens: validTokens } = await getValidTokens(request, tokens);

  const body = await request.json();
  const { action: act, fileId } = body;

  if (act === "delete" && fileId) {
    await deleteExecutionRecord(validTokens.accessToken, fileId);
    return Response.json({ success: true });
  }

  return Response.json({ error: "Invalid action" }, { status: 400 });
}
