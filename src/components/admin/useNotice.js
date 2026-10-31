import { useCallback, useEffect, useRef, useState } from 'react';

// A banner message that clears itself after five seconds.
export function useNotice() {
  const [notice, setNotice] = useState(null);
  const timer = useRef(null);

  const notify = useCallback((message, type = 'error') => {
    clearTimeout(timer.current);
    setNotice({ message, type });
    timer.current = setTimeout(() => setNotice(null), 5000);
  }, []);

  useEffect(() => () => clearTimeout(timer.current), []);

  return { notice, notify };
}
