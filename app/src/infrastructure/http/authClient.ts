import type { AuthSession, AuthUser } from "@/domain/auth";
import { BackendError } from "./httpClient";

/**
 * §5.A's `/v1/auth/*` surface — register, login, logout, and "who am I".
 *
 * `apiGet` can't be reused: auth is POST-heavy, and `me` has to treat a 401 as
 * "no one is signed in" (a `null` result) rather than an error, while every
 * other non-2xx — a taken email, a rejected password, a dead server — must
 * surface as a `BackendError` the caller can branch on by `code`.
 */
const trimBase = (baseUrl: string) => baseUrl.replace(/\/+$/, "");

interface ErrorEnvelope {
  error?: { code?: string; message?: string };
}

interface Raw {
  status: number;
  ok: boolean;
  url: string;
  payload: unknown;
}

async function authRequest(
  baseUrl: string,
  method: "GET" | "POST",
  path: string,
  options: { body?: unknown; token?: string } = {}
): Promise<Raw> {
  const url = `${trimBase(baseUrl)}${path}`;
  const headers: Record<string, string> = { accept: "application/json" };
  if (options.body !== undefined) headers["content-type"] = "application/json";
  if (options.token) headers["authorization"] = `Bearer ${options.token}`;

  let response: Response;
  try {
    response = await fetch(url, {
      method,
      headers,
      body: options.body === undefined ? undefined : JSON.stringify(options.body),
    });
  } catch (cause) {
    const detail = cause instanceof Error ? cause.message : String(cause);
    throw new BackendError("NETWORK_ERROR", `Could not reach the AlMinhej API at ${url} (${detail})`);
  }

  return {
    status: response.status,
    ok: response.ok,
    url,
    payload: await response.json().catch(() => null),
  };
}

/** Turn a non-2xx response into a `BackendError`, preserving the server `code`. */
function raise(raw: Raw): never {
  const envelope = raw.payload as ErrorEnvelope | null;
  throw new BackendError(
    envelope?.error?.code ?? "HTTP_ERROR",
    envelope?.error?.message ?? `Request to ${raw.url} failed with ${raw.status}`,
    raw.status
  );
}

export async function register(
  baseUrl: string,
  email: string,
  password: string
): Promise<AuthSession> {
  const raw = await authRequest(baseUrl, "POST", "/v1/auth/register", { body: { email, password } });
  if (!raw.ok) raise(raw);
  return raw.payload as AuthSession;
}

export async function login(baseUrl: string, email: string, password: string): Promise<AuthSession> {
  const raw = await authRequest(baseUrl, "POST", "/v1/auth/login", { body: { email, password } });
  if (!raw.ok) raise(raw);
  return raw.payload as AuthSession;
}

/** The user behind `token`, or `null` when the token is not a live session. */
export async function fetchMe(baseUrl: string, token: string): Promise<AuthUser | null> {
  const raw = await authRequest(baseUrl, "GET", "/v1/auth/me", { token });
  if (raw.status === 401) return null;
  if (!raw.ok) raise(raw);
  return (raw.payload as { user: AuthUser }).user;
}

/** Invalidate `token` server-side. Idempotent — an unknown token is not an error. */
export async function logout(baseUrl: string, token: string): Promise<void> {
  const raw = await authRequest(baseUrl, "POST", "/v1/auth/logout", { token });
  if (!raw.ok) raise(raw);
}
