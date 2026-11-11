/**
 * The verified identity behind a session (§5.A's `/v1/auth/*`), as opposed to
 * the client-minted token Prompt 6 shipped. There, the client invented a value
 * and the server took it on faith; here the server resolves the user from a
 * bearer token it issued, and that token is the only thing the client holds.
 *
 * `AuthSession` is what a register or login returns: an opaque token plus the
 * user it belongs to. The token is the credential — it travels in
 * `Authorization: Bearer`, and the server decides which account it maps to.
 */
export interface AuthUser {
  id: string;
  email: string;
}

export interface AuthSession {
  token: string;
  user: AuthUser;
}
