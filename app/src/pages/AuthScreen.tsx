import { useState, type FormEvent } from "react";
import { Link, useNavigate } from "react-router-dom";
import { useAuth } from "@/context/AuthContext";
import { useSettings } from "@/context/SettingsContext";
import { BackendError } from "@/infrastructure/http/httpClient";

/**
 * §5.A's `/v1/auth/*`, as a screen. One form for both register and login —
 * they differ only in which call they make, and keeping them together makes
 * the "have an account?" swap a single state change rather than two pages.
 *
 * Validation is the browser's (a `form` with `required` and `type="email"`),
 * so the messages match the reader's locale without this file re-implementing
 * them. The server's error `code` is what decides the message for everything
 * the browser can't catch — a taken email, a wrong password, an unreachable
 * server — so those stay accurate even though the server only speaks English.
 */
const field =
  "w-full rounded-lg border border-[var(--color-line)] bg-[var(--color-panel-2)] px-3 py-2 text-[13px] text-[var(--color-ink)] outline-none focus:border-[var(--color-gold)]";
const label = "block text-[10px] uppercase tracking-[0.08em] text-[var(--color-sub)] mb-1";

export default function AuthScreen() {
  const { t, dir } = useSettings();
  const { enabled, register, login } = useAuth();
  const navigate = useNavigate();

  const [mode, setMode] = useState<"signin" | "register">("signin");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const isRegister = mode === "register";

  const messageFor = (cause: unknown): string => {
    const code = cause instanceof BackendError ? cause.code : "";
    switch (code) {
      case "EMAIL_TAKEN":
        return t.authEmailTaken;
      case "INVALID_CREDENTIALS":
        return t.authInvalidCredentials;
      case "NETWORK_ERROR":
        return t.authNetworkError;
      default:
        return t.authGenericError;
    }
  };

  const onSubmit = async (event: FormEvent) => {
    event.preventDefault();
    if (busy) return;
    setBusy(true);
    setError(null);
    try {
      if (isRegister) await register(email.trim(), password);
      else await login(email.trim(), password);
      navigate("/", { replace: true });
    } catch (cause) {
      setError(messageFor(cause));
    } finally {
      setBusy(false);
    }
  };

  const switchMode = () => {
    setMode(isRegister ? "signin" : "register");
    setError(null);
  };

  return (
    <div
      dir={dir}
      className="min-h-screen bg-[var(--color-bg)] text-[var(--color-ink)] grid place-items-center px-4 py-10"
    >
      <div className="w-full max-w-[380px]">
        <div className="mb-5 flex items-center gap-2.5">
          <div className="w-8 h-8 rounded-lg bg-[var(--color-emerald)] grid place-items-center">
            <span className="font-arabic text-[16px] text-[var(--color-gold-light)]">ن</span>
          </div>
          <span className="font-display text-[19px] font-semibold">{t.appName}</span>
        </div>

        <div className="rounded-xl border border-[var(--color-line)] bg-[var(--color-panel)] p-5">
          <h1 className="font-display text-[20px] font-semibold">
            {isRegister ? t.authRegisterTitle : t.authSignInTitle}
          </h1>
          <p className="mt-1 text-[12px] text-[var(--color-sub)]">
            {isRegister ? t.authRegisterSubtitle : t.authSignInSubtitle}
          </p>

          {!enabled ? (
            <div className="mt-4 rounded-lg border border-[var(--color-line)] bg-[var(--color-panel-2)] p-3 text-[11.5px] text-[var(--color-sub)]">
              {t.authUnavailable}
            </div>
          ) : (
            <form className="mt-4 grid gap-3" onSubmit={onSubmit}>
              <div>
                <label className={label} htmlFor="auth-email">
                  {t.authEmailLabel}
                </label>
                <input
                  id="auth-email"
                  className={field}
                  type="email"
                  autoComplete="email"
                  required
                  dir="ltr"
                  value={email}
                  onChange={(event) => setEmail(event.target.value)}
                />
              </div>
              <div>
                <label className={label} htmlFor="auth-password">
                  {t.authPasswordLabel}
                </label>
                <input
                  id="auth-password"
                  className={field}
                  type="password"
                  autoComplete={isRegister ? "new-password" : "current-password"}
                  required
                  minLength={8}
                  dir="ltr"
                  value={password}
                  onChange={(event) => setPassword(event.target.value)}
                />
              </div>

              {error && (
                <div
                  className="rounded-lg px-3 py-2 text-[11.5px]"
                  style={{ background: "rgba(176,120,90,.16)", color: "var(--color-ink)" }}
                >
                  {error}
                </div>
              )}

              <button
                type="submit"
                disabled={busy}
                className="rounded-lg px-3 py-2 text-[12.5px] font-medium disabled:opacity-45 disabled:cursor-not-allowed"
                style={{ background: "var(--color-emerald)", color: "#F4EFE2" }}
              >
                {busy ? t.authWorking : isRegister ? t.authRegisterCta : t.authSignInCta}
              </button>

              <button
                type="button"
                onClick={switchMode}
                className="text-[11.5px] text-[var(--color-sub)] underline"
              >
                {isRegister ? t.authToSignIn : t.authToRegister}
              </button>
            </form>
          )}
        </div>

        <Link to="/" className="mt-4 inline-block text-[11.5px] text-[var(--color-sub)] underline">
          {t.authBackHome}
        </Link>
      </div>
    </div>
  );
}
