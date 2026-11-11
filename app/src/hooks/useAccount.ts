import { useState } from "react";

const ACCOUNT_KEY = "alminhej:account";

function newAccountId(): string {
  const c = globalThis.crypto;
  if (c && typeof c.randomUUID === "function") return c.randomUUID();
  return `acct-${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 10)}`;
}

/**
 * The *anonymous* local identity — the account key used when there is no
 * backend to authenticate against (`VITE_ALMINHEJ_API_BASE_URL` unset), so the
 * app still persists per-account state in `localStorage` in offline dev. With
 * a backend, real auth (§5.A's `/v1/auth/*`) supersedes this entirely and the
 * session token is the account key instead; `hooks/useIdentity.ts` is the one
 * place that picks between them, and it is what the state hooks read.
 *
 * It is a key, not a credential: there is no password and nothing is verified,
 * so losing it means losing that account's state. That is honest only because
 * there is no server to protect — never use this where a session exists.
 */
export function useAccount(): string {
  const [accountId] = useState(() => {
    try {
      const existing = window.localStorage.getItem(ACCOUNT_KEY);
      if (existing) return existing;
      const created = newAccountId();
      window.localStorage.setItem(ACCOUNT_KEY, created);
      return created;
    } catch {
      // Storage unavailable: use a session-only identity rather than a shared
      // constant, which would merge every reader into one account.
      return newAccountId();
    }
  });

  return accountId;
}
