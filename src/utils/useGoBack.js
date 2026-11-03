import { useNavigate } from 'react-router-dom';

// `navigate(-1)` only works when the SPA actually has a previous entry in this tab's
// history. If a guest opened this page directly — a fresh link, a bookmark, a reload, or
// landing here right after the full-page round trip to Paystack — there is nothing to go
// back to, and the button silently does nothing. react-router's history keeps an `idx`
// counter in `window.history.state` that increments on every in-app navigation; idx 0
// means this is the first entry, so we fall back to a concrete destination instead.
export default function useGoBack(fallbackPath = '/') {
  const navigate = useNavigate();
  return () => {
    const idx = window.history.state?.idx;
    if (typeof idx === 'number' && idx > 0) {
      navigate(-1);
    } else {
      navigate(fallbackPath);
    }
  };
}
