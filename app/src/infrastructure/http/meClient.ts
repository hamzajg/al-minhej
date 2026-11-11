import type { LearningPath } from "@/domain/learning";
import { BackendError } from "./httpClient";

/**
 * §5.A's `/v1/me/*` surface — the reader's own state, as opposed to the shared
 * graph. Every call carries the account token (`x-alminhej-account`); today
 * that token *is* the identity, since there is no auth yet.
 *
 * `apiGet` can't be reused here: it sets no such header, and it turns a 404
 * into `null` — which would hide "your account header was rejected" behind a
 * silent "no path". This client surfaces every non-2xx as a `BackendError`,
 * preserving the server's error `code`.
 */
const ACCOUNT_HEADER = "x-alminhej-account";

interface ErrorEnvelope {
  error?: { code?: string; message?: string };
}

async function meSend<T>(
  baseUrl: string,
  accountId: string,
  method: "GET" | "PUT",
  path: string,
  body?: unknown
): Promise<T> {
  const url = `${baseUrl.replace(/\/+$/, "")}${path}`;
  const headers: Record<string, string> = {
    accept: "application/json",
    [ACCOUNT_HEADER]: accountId,
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

export function getMyPath(baseUrl: string, accountId: string): Promise<LearningPath> {
  return meSend<LearningPath>(baseUrl, accountId, "GET", "/v1/me/path");
}

export function saveMyPath(
  baseUrl: string,
  accountId: string,
  path: LearningPath
): Promise<LearningPath> {
  return meSend<LearningPath>(baseUrl, accountId, "PUT", "/v1/me/path", path);
}
