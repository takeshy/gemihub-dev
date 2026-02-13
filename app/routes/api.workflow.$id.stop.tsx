import type { ActionFunctionArgs } from "react-router";
import { requireAuth } from "~/services/session.server";
import {
  getExecution,
  isExecutionOwnedBy,
  stopExecution,
} from "~/services/execution-store.server";
import { createLogContext, emitLog } from "~/services/logger.server";

export async function action({ request, params }: ActionFunctionArgs) {
  const tokens = await requireAuth(request);
  const logCtx = createLogContext(request, "/api/workflow/stop", tokens.rootFolderId);

  const body = await request.json().catch(() => ({}));
  const executionId = typeof body?.executionId === "string"
    ? body.executionId
    : "";

  if (!executionId) {
    emitLog(logCtx, 400, { error: "Missing executionId" });
    return Response.json({ error: "Missing executionId" }, { status: 400 });
  }

  logCtx.details = { executionId };

  const execution = getExecution(executionId);
  if (
    !execution ||
    execution.workflowId !== params.id ||
    !isExecutionOwnedBy(executionId, tokens.rootFolderId)
  ) {
    emitLog(logCtx, 404, { error: "Execution not found" });
    return Response.json({ error: "Execution not found" }, { status: 404 });
  }

  stopExecution(executionId);
  emitLog(logCtx, 200);
  return Response.json({ ok: true });
}
