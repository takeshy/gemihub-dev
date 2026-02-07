import type { Route } from "./+types/api.workflow.request-history";
import { requireAuth } from "~/services/session.server";
import { getValidTokens } from "~/services/google-auth.server";
import {
  listRequestRecords,
  loadRequestRecord,
  saveRequestRecord,
  deleteRequestRecord,
} from "~/services/workflow-request-history.server";

export async function loader({ request }: Route.LoaderArgs) {
  const tokens = await requireAuth(request);
  const { tokens: validTokens } = await getValidTokens(request, tokens);

  const url = new URL(request.url);
  const fileId = url.searchParams.get("fileId");
  const workflowId = url.searchParams.get("workflowId");

  if (fileId) {
    const record = await loadRequestRecord(validTokens.accessToken, fileId);
    return Response.json({ record });
  }

  const records = await listRequestRecords(
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
  const { action: act, fileId, record } = body;

  if (act === "save" && record) {
    const id = await saveRequestRecord(
      validTokens.accessToken,
      validTokens.rootFolderId,
      record
    );
    return Response.json({ success: true, fileId: id });
  }

  if (act === "delete" && fileId) {
    await deleteRequestRecord(validTokens.accessToken, fileId);
    return Response.json({ success: true });
  }

  return Response.json({ error: "Invalid action" }, { status: 400 });
}
