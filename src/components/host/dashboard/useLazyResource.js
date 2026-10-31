import { useCallback, useEffect, useRef, useState } from 'react';

// Loads data once when `enabled` first becomes true. `status` is 'loading' until the first result.
// reload() starts a fresh load (used by "Try again" buttons). A previous result stays visible while reloading.
export function useLazyResource(enabled, load) {
  const [result, setResult] = useState({ status: 'loading', data: null });
  const [token, setToken] = useState(0);
  const fetchedToken = useRef(-1);
  const mounted = useRef(true);

  useEffect(() => {
    mounted.current = true;
    return () => { mounted.current = false; };
  }, []);

  useEffect(() => {
    if (!enabled || fetchedToken.current === token) return;
    fetchedToken.current = token;
    load()
      .then((data) => { if (mounted.current) setResult({ status: 'ready', data }); })
      .catch(() => { if (mounted.current) setResult((prev) => ({ ...prev, status: 'error' })); });
  }, [enabled, token, load]);

  const reload = useCallback(() => {
    setResult((prev) => ({ ...prev, status: 'loading' }));
    setToken((t) => t + 1);
  }, []);

  return { ...result, reload };
}
