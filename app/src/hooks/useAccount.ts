import { useState } from "react";

const ACCOUNT_KEY = "alminhej:account";

function newAccountId(): string {
  const c = globalThis.crypto;
  if (c && typeof c.randomUUID === "function") return c.randomUUID();
  return `acct-${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 10)}`;
}

/**
 * The reader's account token — the minimal identity `PROMPTS.md` Prompt 6 was
 * scoped to (full auth, §5.A's `/v1/auth/*`, is its own piece of work). It is
 * minted once and kept in `localStorage`; the server treats it as the identity
 * for `/v1/me/*`.
 *
 * It is a token, not a credential: there is no password and nothing is
 * verified, so losing it means losing that account's path. That is the honest
 * ceiling of "per-account" without an auth prompt, and the whole reason the
 * header/in-memory server store is documented as a stand-in.
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
