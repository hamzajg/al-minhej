import { BackendError } from "./httpClient";

/**
 * The client for §7's grounded companion route. Deliberately tiny, and
 * deliberately the *only* client-side trace of the AI layer: the browser never
 * talks to the Anthropic API and never holds a key — it asks this route, and
 * the server does the grounding and the call.
 *
 * Errors keep the server's `code` (`COMPANION_UNAVAILABLE` when the server has
 * no key, `COMPANION_UPSTREAM_ERROR` when the model call failed) so the UI can
 * tell "the companion isn't configured" apart from "the model call broke".
 */

export interface CompanionAnswer {
  answer: string;
  model: string;
}

interface ErrorEnvelope {
  error?: { code?: string; message?: string };
}

export async function askCompanion(
  baseUrl: string,
  nodeId: string,
  question: string,
  lang: "ar" | "en"
): Promise<CompanionAnswer> {
  const url = `${baseUrl.replace(/\/+$/, "")}/v1/nodes/${encodeURIComponent(nodeId)}/companion/ask`;

  let response: Response;
  try {
    response = await fetch(url, {
      method: "POST",
      headers: { "content-type": "application/json", accept: "application/json" },
      body: JSON.stringify({ question, lang }),
    });
  } catch (cause) {
    const detail = cause instanceof Error ? cause.message : String(cause);
    throw new BackendError("NETWORK_ERROR", `Could not reach the AlMinhej API at ${url} (${detail})`);
  }

  const payload = (await response.json().catch(() => null)) as (CompanionAnswer & ErrorEnvelope) | null;

  if (!response.ok) {
    throw new BackendError(
      payload?.error?.code ?? "HTTP_ERROR",
      payload?.error?.message ?? `Request to ${url} failed with ${response.status}`,
      response.status
    );
  }

  return payload as CompanionAnswer;
}
