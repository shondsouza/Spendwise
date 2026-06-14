/**
 * useDraftPersist
 *
 * Persists and restores a form draft from localStorage.
 * - Saves the draft on every value change (debounced 600ms).
 * - Exposes `hasDraft`, `restoreDraft`, `clearDraft`.
 * - On successful submit the caller should call `clearDraft()`.
 *
 * Usage:
 *   const { hasDraft, restoreDraft, clearDraft, saveDraft } =
 *     useDraftPersist<MyFormValues>('my-form-key');
 */

import { useCallback, useEffect, useRef, useState } from 'react';

interface UseDraftPersistReturn<T> {
  /** true when a saved draft exists in localStorage */
  hasDraft: boolean;
  /** Call this to load the saved draft — returns the saved values */
  restoreDraft: () => T | null;
  /** Removes the draft from localStorage */
  clearDraft: () => void;
  /** Saves current values — call this from a watch/useEffect */
  saveDraft: (values: T) => void;
}

export function useDraftPersist<T extends object>(key: string): UseDraftPersistReturn<T> {
  const [hasDraft, setHasDraft] = useState(false);
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  // Check on mount whether a draft already exists
  useEffect(() => {
    try {
      const raw = localStorage.getItem(key);
      setHasDraft(!!raw);
    } catch {
      // localStorage unavailable (SSR / private browsing edge case)
    }
  }, [key]);

  const saveDraft = useCallback(
    (values: T) => {
      if (timerRef.current) clearTimeout(timerRef.current);
      timerRef.current = setTimeout(() => {
        try {
          localStorage.setItem(key, JSON.stringify(values));
          setHasDraft(true);
        } catch {
          // quota exceeded or unavailable — silently ignore
        }
      }, 600);
    },
    [key],
  );

  const restoreDraft = useCallback((): T | null => {
    try {
      const raw = localStorage.getItem(key);
      if (!raw) return null;
      return JSON.parse(raw) as T;
    } catch {
      return null;
    }
  }, [key]);

  const clearDraft = useCallback(() => {
    if (timerRef.current) clearTimeout(timerRef.current);
    try {
      localStorage.removeItem(key);
      setHasDraft(false);
    } catch {
      //
    }
  }, [key]);

  // Cleanup debounce timer on unmount
  useEffect(() => {
    return () => {
      if (timerRef.current) clearTimeout(timerRef.current);
    };
  }, []);

  return { hasDraft, restoreDraft, clearDraft, saveDraft };
}
