import { authRepository } from "@/application/container";
import { useAuth } from "@/context/AuthContext";
import { useAccount } from "./useAccount";

/**
 * The account key the per-account state hooks (`useLearningPath`,
 * `useReaderState`) store under — the one place that reconciles the two
 * identity sources.
 *
 * With a backend, identity is the *verified* session: the bearer token for the
 * signed-in user, and `null` when nobody is signed in (there is no server-side
 * account to read or write, so the hooks no-op). Without a backend there is
 * nothing to verify against, so it is the local anonymous id, exactly as
 * before auth existed. Returning `null` here is meaningful: it means "signed
 * out against a real backend", not "no key yet".
 */
export function useIdentity(): string | null {
  const { token, user } = useAuth();
  const anonymousId = useAccount();

  if (authRepository) return user && token ? token : null;
  return anonymousId;
}
