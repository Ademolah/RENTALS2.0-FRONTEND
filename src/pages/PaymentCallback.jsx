import { useEffect, useState } from 'react';
import { useSearchParams, Link } from 'react-router-dom';
// Icons via Font Awesome CDN (index.html) — no lucide-react
import { apiClient } from '../api/client';

export default function PaymentCallback() {
  const [params] = useSearchParams();
  const reference = params.get('reference') || params.get('trxref');

  const [status, setStatus] = useState('loading'); // 'loading' | 'success' | 'failed'
  const [booking, setBooking] = useState(null);
  const [message, setMessage] = useState('');

  useEffect(() => {
    if (!reference) {
      setStatus('failed');
      setMessage('No payment reference found.');
      return;
    }

    apiClient.get(`/payments/verify/${reference}`)
      .then(res => {
        const data = res.data?.data || res.data;
        if (data?.status === 'success' || data?.paid === true || res.data?.status === 'success') {
          setBooking(data?.booking || data?.reservation || null);
          setStatus('success');
        } else {
          setStatus('failed');
          setMessage(res.data?.message || 'Payment could not be verified.');
        }
      })
      .catch(err => {
        setStatus('failed');
        setMessage(err.response?.data?.message || 'Unable to verify payment. Please contact support.');
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
          {booking?.id && (
            <Link to={`/bookings/${booking.id}`} className="block w-full py-3 bg-gray-900 text-white rounded-xl font-bold text-sm hover:bg-brand-primary transition-colors">
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

  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-gray-50 px-4">
      <div className="bg-white rounded-3xl shadow-[0_10px_40px_rgba(0,0,0,0.08)] p-10 max-w-md w-full text-center">
        <div className="w-20 h-20 bg-red-50 rounded-full flex items-center justify-center mx-auto mb-6">
          <i className="fa-solid fa-circle-xmark text-3xl text-red-400" />
        </div>
        <h1 className="text-2xl font-extrabold text-gray-900 mb-2">Payment Not Completed</h1>
        <p className="text-gray-500 mb-6">{message || 'Your payment was not completed. No charge has been made.'}</p>

        <div className="space-y-3">
          <button onClick={() => window.history.back()} className="w-full py-3 bg-gray-900 text-white rounded-xl font-bold text-sm hover:bg-brand-primary transition-colors">
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
}
