import { createHash } from "node:crypto";

// ---------------------------------------------------------------------------
// Structured logging for Cloud Run → Cloud Logging → BigQuery pipeline
// ---------------------------------------------------------------------------

const userIdCache = new Map<string, string>();

/** Hash rootFolderId to a 16-char pseudonymous userId */
export function hashUserId(rootFolderId: string): string {
  const cached = userIdCache.get(rootFolderId);
  if (cached) return cached;
  const hash = createHash("sha256").update(rootFolderId).digest("hex").slice(0, 16);
  userIdCache.set(rootFolderId, hash);
  return hash;
}

export interface LogContext {
  requestId: string;
  timestamp: string;
  userId: string;
  route: string;
  method: string;
  action?: string;
  startTime: number;
  details: Record<string, unknown>;
}

/** Create a log context at the start of a request handler */
export function createLogContext(
  request: Request,
  route: string,
  rootFolderId: string,
): LogContext {
  return {
    requestId: crypto.randomUUID(),
    timestamp: new Date().toISOString(),
    userId: hashUserId(rootFolderId),
    route,
    method: request.method,
    startTime: performance.now(),
    details: {},
  };
}

/** Emit a structured JSON log line to stdout */
export function emitLog(
  ctx: LogContext,
  statusCode: number,
  options?: { error?: string },
): void {
  const durationMs = Math.round(performance.now() - ctx.startTime);
  const severity = statusCode >= 500 ? "ERROR" : statusCode >= 400 ? "WARNING" : "INFO";

  const log = {
    severity,
    message: `${ctx.method} ${ctx.route} ${statusCode} ${durationMs}ms`,
    logType: "api_request",
    requestId: ctx.requestId,
    timestamp: ctx.timestamp,
    userId: ctx.userId,
    route: ctx.route,
    method: ctx.method,
    action: ctx.action ?? null,
    statusCode,
    durationMs,
    error: options?.error ?? null,
    details: ctx.details,
  };

  console.log(JSON.stringify(log));
}
