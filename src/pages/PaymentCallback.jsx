import { useEffect, useState } from 'react';
import { useSearchParams, useNavigate, Link } from 'react-router-dom';
// Icons via Font Awesome CDN (index.html) — no lucide-react
import { apiClient } from '../api/client';
import { consumePaymentReturn, inferPaymentOutcomeFromNotifications } from '../utils/paymentReturn';
import { getNotifications } from '../api/notifications';

export default function PaymentCallback() {
  const [params] = useSearchParams();
  const navigate = useNavigate();
  const reference = params.get('reference') || params.get('trxref');

  // 'loading' | 'success' | 'failed' (backend explicitly says payment didn't go through —
  // safe to let the guest try again) | 'unknown' (we couldn't confirm either way — Paystack
  // already took the money, so we must NOT invite a second payment attempt here)
  const [status, setStatus] = useState('loading');
  const [booking, setBooking] = useState(null);
  // Read once on mount — reads the `return` query param if present, else the page saved
  // just before heading to Paystack, and clears it so a later payment doesn't reuse it.
  const [returnPath] = useState(() => consumePaymentReturn(params));

  useEffect(() => {
    if (!reference) {
      setStatus('unknown');
      return;
    }

    apiClient.get(`/reservations/verify/${reference}`)
      .then(res => {
        const data = res.data?.data || res.data;
        if (data?.status === 'success' || data?.paid === true || res.data?.status === 'success') {
          setBooking(data?.booking || data?.reservation || null);
          setStatus('success');
        } else {
          // The backend responded, and explicitly says the payment didn't succeed — this
          // is the one case where "didn't go through, try again" is actually accurate.
          setStatus('failed');
        }
      })
      .catch(async (err) => {
        // The verification request itself failed (wrong route, network error, backend
        // down, etc.) — fall back to the backend's own notification feed, which the
        // webhook populates the moment it processes the transaction. We genuinely must
        // not tell the guest to pay again unless we have a real signal the payment failed.
        console.error('[PaymentCallback] Could not verify payment, checking notifications:', err);
        try {
          const res = await getNotifications();
          const list = res?.data?.notifications || res?.notifications || res?.data || [];
          const outcome = inferPaymentOutcomeFromNotifications(list);
          setStatus(outcome || 'unknown');
        } catch (notifErr) {
          console.error('[PaymentCallback] Notification fallback also failed:', notifErr);
          setStatus('unknown');
        }
      });
  }, [reference]);

  if (status === 'loading') return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-gray-50">
      <i className="fa-solid fa-spinner fa-spin text-4xl text-brand-primary mb-4" />
      <p className="text-gray-600 font-medium">Confirming your payment…</p>
      <p className="text-gray-400 text-sm mt-1">Please do not close this page.</p>
    </div>
  );

  if (status === 'success') return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-gray-50 px-4">
      <div className="bg-white rounded-3xl shadow-[0_10px_40px_rgba(0,0,0,0.08)] p-10 max-w-md w-full text-center">
        <div className="w-20 h-20 bg-emerald-50 rounded-full flex items-center justify-center mx-auto mb-6">
          <i className="fa-solid fa-circle-check text-3xl text-emerald-500" />
        </div>
        <h1 className="text-2xl font-extrabold text-gray-900 mb-2">Booking Confirmed!</h1>
        <p className="text-gray-500 mb-6">
          Your payment was received and your booking is secured. You will receive a confirmation shortly.
        </p>

        {booking && (
          <div className="bg-gray-50 rounded-2xl p-4 text-sm text-left space-y-2 mb-6 border border-gray-100">
            {booking.id && (
              <div className="flex justify-between">
                <span className="text-gray-500">Booking ref</span>
                <span className="font-semibold text-gray-900">{booking.id}</span>
              </div>
            )}
            {booking.totalAmount && (
              <div className="flex justify-between">
                <span className="text-gray-500">Amount paid</span>
                <span className="font-semibold text-gray-900">₦{Number(booking.totalAmount).toLocaleString()}</span>
              </div>
            )}
            {(booking.checkInDate || booking.startDate) && (
              <div className="flex justify-between">
                <span className="text-gray-500">Check-in</span>
                <span className="font-semibold text-gray-900">
                  {new Date(booking.checkInDate || booking.startDate).toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' })}
                </span>
              </div>
            )}
          </div>
        )}

        <div className="space-y-3">
          {returnPath && (
            <button onClick={() => navigate(returnPath, { replace: true })} className="block w-full py-3 bg-gray-900 text-white rounded-xl font-bold text-sm hover:bg-brand-primary transition-colors">
              Continue Where You Left Off
            </button>
          )}
          {booking?.id && (
            <Link to={`/bookings/${booking.id}`} className="block w-full py-3 border border-gray-200 text-gray-700 rounded-xl font-bold text-sm hover:bg-gray-50 transition-colors">
              View Booking Details
            </Link>
          )}
          <Link to="/dashboard/guest" className="block w-full py-3 border border-gray-200 text-gray-700 rounded-xl font-bold text-sm hover:bg-gray-50 transition-colors">
            Go to My Trips
          </Link>
        </div>
      </div>
    </div>
  );

  if (status === 'failed') return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-gray-50 px-4">
      <div className="bg-white rounded-3xl shadow-[0_10px_40px_rgba(0,0,0,0.08)] p-10 max-w-md w-full text-center">
        <div className="w-20 h-20 bg-red-50 rounded-full flex items-center justify-center mx-auto mb-6">
          <i className="fa-solid fa-circle-xmark text-3xl text-red-400" />
        </div>
        <h1 className="text-2xl font-extrabold text-gray-900 mb-2">Payment Not Completed</h1>
        <p className="text-gray-500 mb-6">Your payment was not completed. No charge has been made.</p>

        <div className="space-y-3">
          <button
            onClick={() => returnPath ? navigate(returnPath, { replace: true }) : window.history.back()}
            className="w-full py-3 bg-gray-900 text-white rounded-xl font-bold text-sm hover:bg-brand-primary transition-colors"
          >
            Try Again
          </button>
          <Link to="/" className="flex items-center justify-center gap-2 w-full py-3 border border-gray-200 text-gray-700 rounded-xl font-bold text-sm hover:bg-gray-50 transition-colors">
            <i className="fa-solid fa-house text-sm" />
            Back to Home
          </Link>
        </div>

        <p className="text-xs text-gray-400 mt-6">
          Need help?{' '}
          <a href="https://wa.me/2347063688222" target="_blank" rel="noreferrer" className="underline text-gray-500 hover:text-gray-900">
            Contact support on WhatsApp
          </a>
        </p>
      </div>
    </div>
  );

  // We could not confirm the payment either way (verification request itself failed).
  // Paystack already processed the charge, so this never offers to "try again" — that
  // would risk a second charge for the same booking.
  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-gray-50 px-4">
      <div className="bg-white rounded-3xl shadow-[0_10px_40px_rgba(0,0,0,0.08)] p-10 max-w-md w-full text-center">
        <div className="w-20 h-20 bg-amber-50 rounded-full flex items-center justify-center mx-auto mb-6">
          <i className="fa-solid fa-shield-halved text-3xl text-amber-500" />
        </div>
        <h1 className="text-2xl font-extrabold text-gray-900 mb-2">Confirming Your Booking</h1>
        <p className="text-gray-500 mb-6">
          We couldn't confirm your booking status right now. If you completed payment on Paystack, it has very likely gone through — please check My Bookings, or contact support before making another payment.
        </p>

        {reference && (
          <div className="bg-gray-50 rounded-2xl p-4 text-sm text-left space-y-2 mb-6 border border-gray-100">
            <div className="flex justify-between">
              <span className="text-gray-500">Reference</span>
              <span className="font-semibold text-gray-900 font-mono">{reference}</span>
            </div>
          </div>
        )}

        <div className="space-y-3">
          <Link to="/dashboard/guest" className="block w-full py-3 bg-gray-900 text-white rounded-xl font-bold text-sm hover:bg-brand-primary transition-colors">
            Go to My Trips
          </Link>
          <Link to="/" className="flex items-center justify-center gap-2 w-full py-3 border border-gray-200 text-gray-700 rounded-xl font-bold text-sm hover:bg-gray-50 transition-colors">
            <i className="fa-solid fa-house text-sm" />
            Back to Home
          </Link>
        </div>

        <p className="text-xs text-gray-400 mt-6">
          Need help?{' '}
          <a href="https://wa.me/2347063688222" target="_blank" rel="noreferrer" className="underline text-gray-500 hover:text-gray-900">
            Contact support on WhatsApp
          </a> — share the reference above.
        </p>
      </div>
    </div>
  );
}
