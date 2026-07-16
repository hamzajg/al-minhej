import { useEffect, useState } from "react";

/**
 * Minimal localStorage-backed state hook.
 * Used for lightweight progress persistence (bookmarks, reflections,
 * discovered vocabulary) ahead of a real backend / account system.
 */
export function useLocalStorage<T>(key: string, initial: T) {
  const [value, setValue] = useState<T>(() => {
    try {
      const raw = window.localStorage.getItem(key);
      return raw ? (JSON.parse(raw) as T) : initial;
    } catch {
      return initial;
    }
  });

  useEffect(() => {
    try {
      window.localStorage.setItem(key, JSON.stringify(value));
    } catch {
      /* storage unavailable — fail silently, in-memory state still works */
    }
  }, [key, value]);

  return [value, setValue] as const;
}
