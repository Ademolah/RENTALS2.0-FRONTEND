import { useEffect, useRef, useState } from 'react';

// Saves plain form values to localStorage while a listing form is open so a host can exit and come back.
// Files cannot be stored, so photos and videos are never part of a draft.
export function useDraft(key, isOpen, values, restore) {
  const [savedAt, setSavedAt] = useState(null);
  const ready = useRef(false);
  const initial = useRef(null);
  const json = JSON.stringify(values);

  // Always-current copies for the effects below, so they only re-run when the form opens or its values change.
  const latest = useRef({ values, restore });
  useEffect(() => {
    latest.current = { values, restore };
  });

  useEffect(() => {
    if (!isOpen) {
      ready.current = false;
      return;
    }
    if (ready.current) return;
    ready.current = true;
    if (initial.current === null) initial.current = json;
    try {
      const raw = localStorage.getItem(key);
      if (raw) {
        const draft = JSON.parse(raw);
        if (draft?.values) {
          latest.current.restore(draft.values);
          // eslint-disable-next-line react-hooks/set-state-in-effect -- restoring a saved draft happens once when the form opens and also sets the parent's fields
          setSavedAt(draft.savedAt || Date.now());
        }
      }
    } catch {
      /* storage unavailable or corrupt draft */
    }
    // json is read only to remember the form's starting values; re-running on every change would re-restore the draft
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isOpen, key]);

  useEffect(() => {
    if (!isOpen || !ready.current || json === initial.current) return undefined;
    const timer = setTimeout(() => {
      try {
        const now = Date.now();
        localStorage.setItem(key, JSON.stringify({ savedAt: now, values: latest.current.values }));
        setSavedAt(now);
      } catch {
        /* storage unavailable */
      }
    }, 800);
    return () => clearTimeout(timer);
  }, [isOpen, json, key]);

  const clearDraft = () => {
    try {
      localStorage.removeItem(key);
    } catch {
      /* storage unavailable */
    }
    setSavedAt(null);
  };

  return { savedAt, clearDraft };
}
