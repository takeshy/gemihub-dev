import type { Route } from "./+types/api.temp-edit.$uuid.$fileName";
import {
  readTempEditFile,
  updateTempEditContent,
} from "~/services/temp-edit-file.server";

const GET_EXPIRY_MS = 30 * 60 * 1000; // 30 minutes
const PUT_EXPIRY_MS = 24 * 60 * 60 * 1000; // 1 day
const MAX_PUT_BODY = 10 * 1024 * 1024; // 10 MB

const UUID_RE = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

function guessContentType(name: string): string {
  const ext = name.split(".").pop()?.toLowerCase();
  const map: Record<string, string> = {
    html: "text/html; charset=utf-8",
    htm: "text/html; charset=utf-8",
    css: "text/css; charset=utf-8",
    js: "application/javascript; charset=utf-8",
    mjs: "application/javascript; charset=utf-8",
    json: "application/json; charset=utf-8",
    md: "text/markdown; charset=utf-8",
    txt: "text/plain; charset=utf-8",
    xml: "application/xml; charset=utf-8",
    svg: "image/svg+xml; charset=utf-8",
    yaml: "text/yaml; charset=utf-8",
    yml: "text/yaml; charset=utf-8",
    csv: "text/csv; charset=utf-8",
    pdf: "application/pdf",
    png: "image/png",
    jpg: "image/jpeg",
    jpeg: "image/jpeg",
    gif: "image/gif",
    webp: "image/webp",
    bmp: "image/bmp",
    ico: "image/x-icon",
    ts: "text/plain; charset=utf-8",
    tsx: "text/plain; charset=utf-8",
    jsx: "text/plain; charset=utf-8",
  };
  return (ext && map[ext]) || "text/plain; charset=utf-8";
}

function getSafeHeaders(contentType: string): Record<string, string> {
  const headers: Record<string, string> = {
    "X-Content-Type-Options": "nosniff",
  };
  if (contentType.startsWith("text/html")) {
    // Allow HTML rendering with inline styles/images, but sandbox to prevent navigation
    headers["Content-Security-Policy"] =
      "default-src 'none'; style-src 'unsafe-inline'; img-src data: blob: https:; font-src data:; sandbox";
  } else {
    headers["Content-Security-Policy"] = "default-src 'none'; sandbox";
  }
  return headers;
}

const ERROR_HEADERS = {
  "X-Content-Type-Options": "nosniff",
  "Content-Security-Policy": "default-src 'none'; sandbox",
};

export async function loader({ params }: Route.LoaderArgs) {
  const { uuid, fileName } = params;
  if (!uuid || !fileName || !UUID_RE.test(uuid)) {
    return new Response("Bad request", { status: 400 });
  }

  const entry = readTempEditFile(uuid);
  if (!entry) {
    return new Response("Not found", { status: 404, headers: ERROR_HEADERS });
  }

  // Validate fileName matches stored entry
  if (entry.fileName !== fileName) {
    return new Response("Not found", { status: 404, headers: ERROR_HEADERS });
  }

  const age = Date.now() - new Date(entry.createdAt).getTime();
  if (age > GET_EXPIRY_MS) {
    return new Response("Gone — edit URL expired (30 min limit for GET)", {
      status: 410,
      headers: ERROR_HEADERS,
    });
  }

  const contentType = guessContentType(fileName);
  const isBinary = !contentType.startsWith("text/") &&
    !contentType.startsWith("application/json") &&
    !contentType.startsWith("application/javascript") &&
    !contentType.startsWith("application/xml") &&
    !contentType.startsWith("image/svg+xml");

  if (isBinary && entry.content) {
    // Binary content is stored as base64 — decode to raw bytes
    try {
      const bytes = Buffer.from(entry.content, "base64");
      return new Response(bytes, {
        headers: { "Content-Type": contentType, ...getSafeHeaders(contentType) },
      });
    } catch {
      // Fallback: return as-is if not valid base64
    }
  }

  return new Response(entry.content, {
    headers: { "Content-Type": contentType, ...getSafeHeaders(contentType) },
  });
}

export async function action({ request, params }: Route.ActionArgs) {
  if (request.method !== "PUT") {
    return new Response("Method not allowed", { status: 405 });
  }

  const { uuid, fileName } = params;
  if (!uuid || !fileName || !UUID_RE.test(uuid)) {
    return new Response("Bad request", { status: 400 });
  }

  // Body size check
  const contentLength = parseInt(request.headers.get("content-length") || "0", 10);
  if (contentLength > MAX_PUT_BODY) {
    return new Response("Payload too large", { status: 413 });
  }

  const entry = readTempEditFile(uuid);
  if (!entry) {
    return new Response("Not found", { status: 404 });
  }

  // Validate fileName matches stored entry
  if (entry.fileName !== fileName) {
    return new Response("Not found", { status: 404 });
  }

  const age = Date.now() - new Date(entry.createdAt).getTime();
  if (age > PUT_EXPIRY_MS) {
    return new Response("Gone — edit URL expired (1 day limit for PUT)", {
      status: 410,
    });
  }

  const content = await request.text();
  if (content.length > MAX_PUT_BODY) {
    return new Response("Payload too large", { status: 413 });
  }
  updateTempEditContent(uuid, content);
  return new Response("OK", { status: 200 });
}
