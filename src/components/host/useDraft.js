import { useEffect, useRef, useState } from 'react';

// Saves plain form values to localStorage while a listing form is open so a host can exit and come back.
// Files cannot be stored, so photos and videos are never part of a draft.
export function useDraft(key, isOpen, values, restore) {
  const [savedAt, setSavedAt] = useState(null);
  const ready = useRef(false);
  const initial = useRef(null);
  const json = JSON.stringify(values);

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
          restore(draft.values);
          setSavedAt(draft.savedAt || Date.now());
        }
      }
    } catch {
      /* storage unavailable or corrupt draft */
    }
  }, [isOpen]);

  useEffect(() => {
    if (!isOpen || !ready.current || json === initial.current) return undefined;
    const timer = setTimeout(() => {
      try {
        const now = Date.now();
        localStorage.setItem(key, JSON.stringify({ savedAt: now, values }));
        setSavedAt(now);
      } catch {
        /* storage unavailable */
      }
    }, 800);
    return () => clearTimeout(timer);
  }, [isOpen, json]);

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
