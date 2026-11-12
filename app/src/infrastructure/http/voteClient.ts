import type { VoteTally } from "@/domain/votes";
import { BackendError } from "./httpClient";

/**
 * §5.A's `/v1/nodes/{id}/votes` surface — the public prioritization tally.
 *
 * Unlike `meClient.ts` the GET is *public*: the count is for everyone, so the
 * bearer token is optional and only ever attached when the caller happens to
 * be signed in (it is what lets the server answer `votedByMe` honestly).
 * The POST is the opposite — casting is per-account, so the token is required
 * and a missing one comes back `401`, surfaced here as a `BackendError` with
 * the server's `code`.
 *
 * `Idempotency-Key` rides on the POST per §5.A's mutating-endpoint contract:
 * the hook generates one per (account, node) vote intent so a retried request
 * replays the first tally instead of double-counting.
 */
interface ErrorEnvelope {
  error?: { code?: string; message?: string };
}

async function voteSend<T>(
  baseUrl: string,
  method: "GET" | "POST",
  path: string,
  options: { token?: string | null; idempotencyKey?: string } = {}
): Promise<T> {
  const url = `${baseUrl.replace(/\/+$/, "")}${path}`;
  const headers: Record<string, string> = { accept: "application/json" };
  if (options.token) headers.authorization = `Bearer ${options.token}`;
  if (method === "POST") {
    headers["content-type"] = "application/json";
    if (options.idempotencyKey) headers["idempotency-key"] = options.idempotencyKey;
  }

  let response: Response;
  try {
    response = await fetch(url, {
      method,
      headers,
      body: method === "POST" ? "{}" : undefined,
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

const votesPath = (nodeId: string) => `/v1/nodes/${encodeURIComponent(nodeId)}/votes`;

/** The public tally. `token` is the session when signed in, else `null`. */
export function getVoteTally(
  baseUrl: string,
  token: string | null,
  nodeId: string
): Promise<VoteTally | null> {
  return voteSend<VoteTally | null>(baseUrl, "GET", votesPath(nodeId), { token });
}

/** Cast (or idempotently replay) this account's vote on the node. */
export function castVote(
  baseUrl: string,
  token: string,
  nodeId: string,
  idempotencyKey: string
): Promise<VoteTally | null> {
  return voteSend<VoteTally | null>(baseUrl, "POST", votesPath(nodeId), {
    token,
    idempotencyKey,
  });
}
