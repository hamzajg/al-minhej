import type { LearningPath } from "@/domain/learning";
import type { ReaderState } from "@/domain/readerState";
import { BackendError } from "./httpClient";

/**
 * §5.A's `/v1/me/*` surface — the reader's own state, as opposed to the shared
 * graph. Every call carries the session token as `Authorization: Bearer`, and
 * the server — not this client — resolves that token to an account. A missing
 * or invalid token is a `401`, which this client surfaces as a `BackendError`
 * with the server's `code` so the caller can react (today: no-op, since the
 * hooks only run when a session exists).
 *
 * `apiGet` can't be reused here: it sets no such header, and it turns a 404
 * into `null` — which would hide "your session was rejected" behind a silent
 * "no path". This client surfaces every non-2xx as a `BackendError`, preserving
 * the server's error `code`.
 */
interface ErrorEnvelope {
  error?: { code?: string; message?: string };
}

async function meSend<T>(
  baseUrl: string,
  token: string,
  method: "GET" | "PUT",
  path: string,
  body?: unknown
): Promise<T> {
  const url = `${baseUrl.replace(/\/+$/, "")}${path}`;
  const headers: Record<string, string> = {
    accept: "application/json",
    authorization: `Bearer ${token}`,
  };
  if (body !== undefined) headers["content-type"] = "application/json";

  let response: Response;
  try {
    response = await fetch(url, {
      method,
      headers,
      body: body === undefined ? undefined : JSON.stringify(body),
    });
  } catch (cause) {
    const detail = cause instanceof Error ? cause.message : String(cause);
    throw new BackendError("NETWORK_ERROR", `Could not reach the AlMinhej API at ${url} (${detail})`);
  }

  const payload = (await response.json().catch(() => null)) as (T & ErrorEnvelope) | null;

  if (!response.ok) {
    throw new BackendError(
      payload?.error?.code ?? "HTTP_ERROR",
      payload?.error?.message ?? `Request to ${url} failed with ${response.status}`,
      response.status
    );
  }

  return payload as T;
}

export function getMyPath(baseUrl: string, token: string): Promise<LearningPath> {
  return meSend<LearningPath>(baseUrl, token, "GET", "/v1/me/path");
}

export function saveMyPath(baseUrl: string, token: string, path: LearningPath): Promise<LearningPath> {
  return meSend<LearningPath>(baseUrl, token, "PUT", "/v1/me/path", path);
}

/**
 * The reader's per-node state, one document per `(account, node)` — the same
 * transport, a narrower scope than the path. The node id is URL-encoded
 * because ids are opaque strings, not slugs.
 */
export function getMyNodeState(
  baseUrl: string,
  token: string,
  nodeId: string
): Promise<ReaderState> {
  return meSend<ReaderState>(
    baseUrl,
    token,
    "GET",
    `/v1/me/nodes/${encodeURIComponent(nodeId)}/state`
  );
}

export function saveMyNodeState(
  baseUrl: string,
  token: string,
  nodeId: string,
  state: ReaderState
): Promise<ReaderState> {
  return meSend<ReaderState>(
    baseUrl,
    token,
    "PUT",
    `/v1/me/nodes/${encodeURIComponent(nodeId)}/state`,
    state
  );
}
