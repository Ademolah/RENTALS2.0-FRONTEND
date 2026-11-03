// Remembers which page a guest was on before being sent off-site to Paystack, so the
// payment result page can send them back to continue from there instead of stranding
// them on a generic confirmation screen.
//
// sessionStorage is the reliable part: it is tied to the browser tab, not to which URL
// is loaded, so it survives the full-page round trip to Paystack's domain and back as
// long as the guest doesn't close the tab. The `return` query param is a bonus for flows
// whose callback URL we control end-to-end (currently VIP) and is preferred when present.
const STORAGE_KEY = 'rentals_payment_return';

export function savePaymentReturn(path) {
  try { sessionStorage.setItem(STORAGE_KEY, path); } catch {}
}

export function consumePaymentReturn(searchParams) {
  const fromQuery = searchParams?.get('return');
  let path = fromQuery ? decodeURIComponent(fromQuery) : null;
  if (!path) {
    try { path = sessionStorage.getItem(STORAGE_KEY); } catch { path = null; }
  }
  try { sessionStorage.removeItem(STORAGE_KEY); } catch {}
  // Only ever hand back an in-app path — never let a query param send a guest from our
  // own payment callback page to an external site.
  return (path && path.startsWith('/') && !path.startsWith('//')) ? path : null;
}

// Fallback payment-outcome signal for when the dedicated verify endpoint isn't working:
// the backend's webhook pushes a notification ("Payment Successful!" / a decline message)
// the moment it processes the Paystack transaction — often faster and more reliable than
// a frontend verify call. A notification created within the last few minutes is treated
// as describing *this* payment, since a guest's booking-success page only loads seconds
// after completing checkout.
const RECENT_NOTIFICATION_WINDOW_MS = 5 * 60 * 1000;

export function inferPaymentOutcomeFromNotifications(notifications) {
  if (!Array.isArray(notifications)) return null;
  const now = Date.now();

  for (const n of notifications) {
    const text = `${n.title || ''} ${n.message || n.body || n.description || ''}`.toLowerCase();
    const createdAt = new Date(n.createdAt || n.date || n.timestamp || 0).getTime();
    if (!createdAt || now - createdAt > RECENT_NOTIFICATION_WINDOW_MS) continue;

    if (/payment\s*(was\s*)?(successful|confirmed|received)/.test(text) || /booking\s*confirmed/.test(text)) {
      return 'success';
    }
    if (/payment\s*(failed|declined|unsuccessful|not\s*completed)/.test(text)) {
      return 'failed';
    }
  }
  return null;
}
