/**
 * The only shared plumbing between the two HTTP repositories.
 *
 * Deliberately thin, and deliberately opinionated about one thing: a 404
 * means *absent*, not *broken*. `domain/repositories.ts` already draws that
 * line — `findById`/`findBySlug` return `null` when there is no such node —
 * so a missing record resolves to `null` while a dead server, a timeout, or
 * a 500 all surface as a thrown `BackendError`. Collapsing the two would let
 * "the backend is down" render as "Not found.", which is exactly the failure
 * mode Prompt 2's second acceptance criterion exists to prevent.
 */

export class BackendError extends Error {
  readonly code: string;
  readonly status: number | undefined;

  constructor(code: string, message: string, status?: number) {
    super(message);
    this.name = "BackendError";
    this.code = code;
    this.status = status;
  }
}

interface ErrorEnvelope {
  error?: { code?: string; message?: string };
}

/**
 * `GET {baseUrl}{path}` as JSON. Returns `null` on 404; throws `BackendError`
 * on anything else that isn't a 2xx.
 */
export async function apiGet<T>(baseUrl: string, path: string): Promise<T | null> {
  const url = `${baseUrl.replace(/\/+$/, "")}${path}`;

  let response: Response;
  try {
    response = await fetch(url, { headers: { accept: "application/json" } });
  } catch (cause) {
    const detail = cause instanceof Error ? cause.message : String(cause);
    throw new BackendError("NETWORK_ERROR", `Could not reach the AlMinhej API at ${url} (${detail})`);
  }

  if (response.status === 404) return null;

  if (!response.ok) {
    const payload = (await response.json().catch(() => null)) as ErrorEnvelope | null;
    throw new BackendError(
      payload?.error?.code ?? "HTTP_ERROR",
      payload?.error?.message ?? `Request to ${url} failed with ${response.status}`,
      response.status
    );
  }

  return (await response.json()) as T;
}
