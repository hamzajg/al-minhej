import type { AuthSession, AuthUser } from "@/domain/auth";
import type { AuthRepository } from "@/domain/repositories";
import { fetchMe, login, logout, register } from "./authClient";

/**
 * The real identity store: register, login, and a token that maps to a user on
 * the server, over §5.A's `/v1/auth/*`. `container.ts` selects this only when
 * `VITE_ALMINHEJ_API_BASE_URL` is set — without a backend there is nothing to
 * verify against, so it exports `null` and the app keeps its anonymous local
 * identity.
 */
export class HttpAuthRepository implements AuthRepository {
  private baseUrl: string;

  constructor(baseUrl: string) {
    this.baseUrl = baseUrl;
  }

  register(email: string, password: string): Promise<AuthSession> {
    return register(this.baseUrl, email, password);
  }

  login(email: string, password: string): Promise<AuthSession> {
    return login(this.baseUrl, email, password);
  }

  me(token: string): Promise<AuthUser | null> {
    return fetchMe(this.baseUrl, token);
  }

  logout(token: string): Promise<void> {
    return logout(this.baseUrl, token);
  }
}
