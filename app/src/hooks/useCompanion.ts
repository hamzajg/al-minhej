import { useCallback, useState } from "react";
import { useSettings } from "@/context/SettingsContext";
import { companionApiBaseUrl } from "@/application/container";
import { askCompanion } from "@/infrastructure/http/companionClient";
import { BackendError } from "@/infrastructure/http/httpClient";

export type CompanionStatus =
  | "idle" // nothing asked yet
  | "thinking" // request in flight
  | "answered" // a grounded answer is showing
  | "unavailable" // no server / no key configured — not an error the reader caused
  | "error"; // the call failed for some other reason

export interface CompanionState {
  status: CompanionStatus;
  answer: string | null;
  error: string | null;
  ask: (question: string) => void;
  reset: () => void;
}

/**
 * Drives the grounded companion call for one node.
 *
 * The two failure modes are kept apart on purpose: "the companion isn't
 * configured / can't be reached" (`unavailable`) is a state the reader can
 * understand and act on, while a genuine model failure (`error`) is a bug to
 * show plainly. Collapsing them would tell a reader their backend is broken
 * when in fact the companion was simply never switched on.
 */
export function useCompanion(nodeId: string): CompanionState {
  const { uiLang } = useSettings();
  const [status, setStatus] = useState<CompanionStatus>("idle");
  const [answer, setAnswer] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const ask = useCallback(
    (question: string) => {
      const trimmed = question.trim();
      if (!trimmed || status === "thinking") return;

      if (!companionApiBaseUrl) {
        // No API base URL → the browser has no route to ask. Say so.
        setStatus("unavailable");
        setAnswer(null);
        return;
      }

      setStatus("thinking");
      setError(null);
      setAnswer(null);

      askCompanion(companionApiBaseUrl, nodeId, trimmed, uiLang)
        .then((result) => {
          setAnswer(result.answer);
          setStatus("answered");
        })
        .catch((cause: unknown) => {
          const code = cause instanceof BackendError ? cause.code : "UNKNOWN";
          // A missing key, or a server we can't reach at all, is a
          // configuration/availability answer — not a crash to alarm anyone with.
          setStatus(code === "COMPANION_UNAVAILABLE" || code === "NETWORK_ERROR" ? "unavailable" : "error");
          setError(cause instanceof Error ? cause.message : String(cause));
        });
    },
    [nodeId, uiLang, status]
  );

  const reset = useCallback(() => {
    setStatus("idle");
    setAnswer(null);
    setError(null);
  }, []);

  return { status, answer, error, ask, reset };
}
