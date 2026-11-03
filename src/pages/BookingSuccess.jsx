import { useEffect, useState } from 'react';
import { useSearchParams, useNavigate, Link } from 'react-router-dom';
import { CheckCircle2, CalendarCheck, Home, ShieldCheck, Copy, Check, XCircle } from 'lucide-react';
import { apiClient } from '../api/client';
import { consumePaymentReturn, inferPaymentOutcomeFromNotifications } from '../utils/paymentReturn';
import { getNotifications } from '../api/notifications';

export default function BookingSuccess() {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const [copied, setCopied] = useState(false);

  // Paystack appends ?reference=XXX or ?trxref=XXX to the callbackUrl
  const reference = searchParams.get('reference') || searchParams.get('trxref');

  // 'loading' | 'success' | 'failed' (backend explicitly says payment didn't go through —
  // safe to let the guest try again) | 'unknown' (we couldn't confirm either way — Paystack
  // already took the money, so we must NOT invite a second payment attempt here)
  const [status, setStatus] = useState('loading');
  // This route carries no `return` query param (the backend's callback_url is a static
  // /booking-success), so this always falls back to the page saved in sessionStorage
  // right before heading to Paystack — that's what lets a guest finish the booking
  // process on the exact page they started from.
  const [returnPath] = useState(() => consumePaymentReturn(searchParams));

  useEffect(() => {
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }, []);

  useEffect(() => {
    if (!reference) {
      setStatus('unknown');
      return;
    }

    apiClient.get(`/reservations/verify/${reference}`)
      .then(res => {
        const data = res.data?.data || res.data;
        if (data?.status === 'success' || data?.paid === true || res.data?.status === 'success') {
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
        console.error('[BookingSuccess] Could not verify payment, checking notifications:', err);
        try {
          const res = await getNotifications();
          const list = res?.data?.notifications || res?.notifications || res?.data || [];
          const outcome = inferPaymentOutcomeFromNotifications(list);
          setStatus(outcome || 'unknown');
        } catch (notifErr) {
          console.error('[BookingSuccess] Notification fallback also failed:', notifErr);
          setStatus('unknown');
        }
      });
  }, [reference]);

  const handleCopy = () => {
    if (reference) {
      navigator.clipboard.writeText(reference);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };

  if (status === 'loading') return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-gray-50">
      <i className="fa-solid fa-spinner fa-spin text-4xl text-brand-primary mb-4" />
      <p className="text-gray-600 font-medium">Confirming your payment…</p>
      <p className="text-gray-400 text-sm mt-1">Please do not close this page.</p>
    </div>
  );

  if (status === 'failed') return (
    <main className="min-h-screen bg-gray-50 flex flex-col items-center justify-center p-4 sm:p-6">
      <div className="max-w-md w-full animate-in fade-in slide-in-from-bottom-8 duration-700">
        <div className="bg-white p-8 sm:p-10 rounded-3xl shadow-[0_20px_60px_rgba(0,0,0,0.05)] border border-gray-100 text-center">
          <div className="relative w-20 h-20 mx-auto mb-6 bg-red-50 rounded-full flex items-center justify-center">
            <XCircle className="w-10 h-10 text-red-400" />
          </div>
          <h1 className="text-2xl font-black text-gray-900 tracking-tight mb-3">Payment Not Completed</h1>
          <p className="text-gray-500 text-sm leading-relaxed mb-8">
            Your payment was not completed. No charge has been made.
          </p>

          <div className="space-y-3">
            <button
              onClick={() => returnPath ? navigate(returnPath, { replace: true }) : window.history.back()}
              className="w-full py-4 bg-gray-900 text-white font-bold text-sm rounded-xl hover:bg-black transition-all shadow-md"
            >
              Try Again
            </button>
            <Link to="/" className="w-full flex items-center justify-center bg-white border border-gray-200 text-gray-700 font-bold text-sm py-4 rounded-xl hover:bg-gray-50 transition-colors">
              <Home className="w-4 h-4 mr-2" />
              Return to Home
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
    </main>
  );

  // We could not confirm the payment either way (verification request itself failed).
  // Paystack already processed the charge, so this never offers to "try again" — that
  // would risk a second charge for the same booking.
  if (status === 'unknown') return (
    <main className="min-h-screen bg-gray-50 flex flex-col items-center justify-center p-4 sm:p-6">
      <div className="max-w-md w-full animate-in fade-in slide-in-from-bottom-8 duration-700">
        <div className="bg-white p-8 sm:p-10 rounded-3xl shadow-[0_20px_60px_rgba(0,0,0,0.05)] border border-gray-100 text-center">
          <div className="relative w-20 h-20 mx-auto mb-6 bg-amber-50 rounded-full flex items-center justify-center">
            <ShieldCheck className="w-10 h-10 text-amber-500" />
          </div>
          <h1 className="text-2xl font-black text-gray-900 tracking-tight mb-3">Confirming Your Booking</h1>
          <p className="text-gray-500 text-sm leading-relaxed mb-8">
            We couldn't confirm your booking status right now. If you completed payment on Paystack, it has very likely gone through — please check My Bookings, or contact support before making another payment.
          </p>

          {reference && (
            <div className="bg-gray-50 border border-gray-200 rounded-2xl p-4 mb-8 text-left relative overflow-hidden">
              <div className="absolute top-0 left-0 w-1 h-full bg-gray-900" />
              <span className="block text-[10px] font-extrabold uppercase tracking-widest text-gray-400 mb-1.5 ml-2">
                Transaction Reference
              </span>
              <div className="flex items-center justify-between ml-2">
                <span className="text-sm font-bold text-gray-900 font-mono tracking-tight">{reference}</span>
                <button
                  onClick={handleCopy}
                  className="p-2 bg-white rounded-lg border border-gray-200 hover:border-gray-300 hover:bg-gray-50 text-gray-600 transition-colors"
                  title="Copy Reference"
                >
                  {copied ? <Check className="w-4 h-4 text-green-600" /> : <Copy className="w-4 h-4" />}
                </button>
              </div>
            </div>
          )}

          <div className="space-y-3">
            <Link to="/dashboard/guest" className="w-full flex items-center justify-center bg-gray-900 text-white font-bold text-sm py-4 rounded-xl hover:bg-black transition-colors">
              <CalendarCheck className="w-4 h-4 mr-2" />
              View My Bookings
            </Link>
            <Link to="/" className="w-full flex items-center justify-center bg-white border border-gray-200 text-gray-700 font-bold text-sm py-4 rounded-xl hover:bg-gray-50 transition-colors">
              <Home className="w-4 h-4 mr-2" />
              Return to Home
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
    </main>
  );

  return (
    <main className="min-h-screen bg-gray-50 flex flex-col items-center justify-center p-4 sm:p-6 relative overflow-hidden">

      {/* Subtle Background Glow */}
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] bg-green-400/10 rounded-full blur-[100px] pointer-events-none" />

      <div className="max-w-md w-full relative z-10 animate-in fade-in slide-in-from-bottom-8 duration-700">

        {/* Main Card */}
        <div className="bg-white p-8 sm:p-10 rounded-3xl shadow-[0_20px_60px_rgba(0,0,0,0.05)] border border-gray-100 text-center">

          {/* Animated Success Icon */}
          <div className="relative w-24 h-24 mx-auto mb-8 animate-in zoom-in duration-500 delay-150">
            <div className="absolute inset-0 bg-green-100 rounded-full animate-ping opacity-70 duration-1000" />
            <div className="relative bg-green-500 text-white w-full h-full rounded-full flex items-center justify-center shadow-lg shadow-green-500/30 border-4 border-white">
              <CheckCircle2 className="w-12 h-12" />
            </div>
          </div>

          <h1 className="text-3xl font-black text-gray-900 tracking-tight mb-3">
            Reservation Secured
          </h1>
          <p className="text-gray-500 text-sm leading-relaxed mb-8">
            Your payment was successful and your booking is confirmed. We have sent the receipt and check-in details to your email.
          </p>

          {/* Reference Card */}
          {reference && (
            <div className="bg-gray-50 border border-gray-200 rounded-2xl p-4 mb-8 text-left relative overflow-hidden">
              <div className="absolute top-0 left-0 w-1 h-full bg-gray-900" />
              <span className="block text-[10px] font-extrabold uppercase tracking-widest text-gray-400 mb-1.5 ml-2">
                Transaction Reference
              </span>
              <div className="flex items-center justify-between ml-2">
                <span className="text-sm font-bold text-gray-900 font-mono tracking-tight">
                  {reference}
                </span>
                <button
                  onClick={handleCopy}
                  className="p-2 bg-white rounded-lg border border-gray-200 hover:border-gray-300 hover:bg-gray-50 text-gray-600 transition-colors"
                  title="Copy Reference"
                >
                  {copied ? <Check className="w-4 h-4 text-green-600" /> : <Copy className="w-4 h-4" />}
                </button>
              </div>
            </div>
          )}

          {/* Actions */}
          <div className="space-y-3">
            <Link
              to="/dashboard/guest"
              className="w-full flex items-center justify-center bg-white border border-gray-200 text-gray-700 font-bold text-sm py-4 rounded-xl hover:bg-gray-50 transition-colors"
            >
              <CalendarCheck className="w-4 h-4 mr-2" />
              View My Bookings
            </Link>

            <Link
              to="/"
              className="w-full flex items-center justify-center bg-white border border-gray-200 text-gray-700 font-bold text-sm py-4 rounded-xl hover:bg-gray-50 transition-colors"
            >
              <Home className="w-4 h-4 mr-2" />
              Return to Home
            </Link>
          </div>
        </div>

        {/* Security Footer */}
        <div className="mt-8 flex items-center justify-center space-x-2 text-gray-400 animate-in fade-in duration-1000 delay-300">
          <ShieldCheck className="w-4 h-4" />
          <span className="text-xs font-semibold uppercase tracking-wider">
            Secured by Rentals Africa
          </span>
        </div>
      </div>
    </main>
  );
}
