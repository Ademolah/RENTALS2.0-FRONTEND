import { useCallback, useEffect, useRef } from 'react';
import { useToast } from '../../Toast';

// A stable notify(message, type) so effects that call it do not re-run on every render.
export function useNotify() {
  const toast = useToast();
  const latest = useRef(toast);
  useEffect(() => { latest.current = toast; });
  return useCallback((message, type = 'error') => (
    type === 'success' ? latest.current.success(message) : latest.current.error(message)
  ), []);
}
