import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useState,
  type ReactNode,
} from "react";
import { authRepository } from "@/application/container";
import type { AuthSession, AuthUser } from "@/domain/auth";

/**
 * The reader's session — real auth (§5.A's `/v1/auth/*`), and the identity
 * `hooks/useIdentity.ts` hands to the state hooks. The token is kept in
 * `localStorage` so a reload keeps you signed in; on boot it is checked against
 * `/v1/auth/me`, so a token the server no longer knows (it restarted, or the
 * session was logged out elsewhere) is dropped rather than trusted.
 *
 * With no backend (`authRepository` is `null`) there is nothing to sign in to:
 * `enabled` is false, `status` is `ready`, and the app runs on the anonymous
 * local identity exactly as it did before auth existed.
 */
const SESSION_KEY = "alminhej:session";

interface AuthState {
  user: AuthUser | null;
  token: string | null;
  /** `loading` only while a persisted token is being verified on boot. */
  status: "loading" | "ready";
  /** False when no backend is configured — sign-in is not available. */
  enabled: boolean;
  register: (email: string, password: string) => Promise<void>;
  login: (email: string, password: string) => Promise<void>;
  logout: () => Promise<void>;
}

const AuthContext = createContext<AuthState | null>(null);

function readStoredToken(): string | null {
  try {
    return window.localStorage.getItem(SESSION_KEY);
  } catch {
    return null;
  }
}

function writeStoredToken(token: string | null) {
  try {
    if (token) window.localStorage.setItem(SESSION_KEY, token);
    else window.localStorage.removeItem(SESSION_KEY);
  } catch {
    /* storage unavailable — the session still works for this tab */
  }
}

export function AuthProvider({ children }: { children: ReactNode }) {
  const [token, setToken] = useState<string | null>(() =>
    authRepository ? readStoredToken() : null
  );
  const [user, setUser] = useState<AuthUser | null>(null);
  const [status, setStatus] = useState<AuthState["status"]>(() =>
    authRepository && readStoredToken() ? "loading" : "ready"
  );

  // Verify a restored session once, on boot. If the token is no longer valid,
  // drop it; if the server is simply unreachable, keep it and try again next
  // load rather than silently signing the reader out.
  useEffect(() => {
    if (!authRepository || !token) return;
    let cancelled = false;
    authRepository
      .me(token)
      .then((found) => {
        if (cancelled) return;
        if (found) {
          setUser(found);
        } else {
          writeStoredToken(null);
          setToken(null);
        }
        setStatus("ready");
      })
      .catch(() => {
        if (!cancelled) setStatus("ready");
      });
    return () => {
      cancelled = true;
    };
    // Boot only: re-validating on every token change would re-check the token
    // that register/login just minted.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const apply = useCallback((session: AuthSession) => {
    writeStoredToken(session.token);
    setToken(session.token);
    setUser(session.user);
    setStatus("ready");
  }, []);

  const register = useCallback(
    async (email: string, password: string) => {
      if (!authRepository) throw new Error("Sign-in requires the AlMinhej API backend");
      apply(await authRepository.register(email, password));
    },
    [apply]
  );

  const login = useCallback(
    async (email: string, password: string) => {
      if (!authRepository) throw new Error("Sign-in requires the AlMinhej API backend");
      apply(await authRepository.login(email, password));
    },
    [apply]
  );

  const logout = useCallback(async () => {
    const current = token;
    // Clear locally first, so the UI leaves the signed-in state immediately...
    writeStoredToken(null);
    setToken(null);
    setUser(null);
    // ...then invalidate server-side. Best-effort: the token is gone either way.
    if (authRepository && current) {
      await authRepository.logout(current).catch(() => undefined);
    }
  }, [token]);

  const value: AuthState = {
    user,
    token,
    status,
    enabled: authRepository !== null,
    register,
    login,
    logout,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth must be used within AuthProvider");
  return ctx;
}
