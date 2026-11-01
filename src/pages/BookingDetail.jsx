import { useState, useEffect } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
// Icons via Font Awesome CDN (index.html) — no lucide-react
import { apiClient } from '../api/client';
import { cancelBooking, getArrivalGuide } from '../api/reservation';
import { useAuth } from '../context/AuthContext';

const STATUS = {
  PAID:       { label: 'Upcoming',   color: 'bg-amber-50 text-amber-700 border-amber-200' },
  CONFIRMED:  { label: 'Confirmed',  color: 'bg-blue-50 text-blue-700 border-blue-200' },
  CHECKED_IN: { label: 'Active Stay',color: 'bg-emerald-50 text-emerald-700 border-emerald-200' },
  COMPLETED:  { label: 'Completed',  color: 'bg-gray-100 text-gray-600 border-gray-200' },
  CANCELLED:  { label: 'Cancelled',  color: 'bg-red-50 text-red-500 border-red-200' },
  PENDING:    { label: 'Pending',    color: 'bg-yellow-50 text-yellow-700 border-yellow-200' },
};

const fmt = (d) => d ? new Date(d).toLocaleDateString('en-GB', { weekday: 'short', day: 'numeric', month: 'short', year: 'numeric' }) : '—';
const fmtTime = (d) => d ? new Date(d).toLocaleTimeString('en-GB', { hour: '2-digit', minute: '2-digit' }) : '';

export default function BookingDetail() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { user } = useAuth();
  const [booking, setBooking] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [guide, setGuide] = useState(null);
  const [guideLoading, setGuideLoading] = useState(false);
  const [cancelling, setCancelling] = useState(false);
  const [cancelDone, setCancelDone] = useState(false);
  const [showCancelConfirm, setShowCancelConfirm] = useState(false);
  const [checkingIn, setCheckingIn] = useState(false);
  const [checkinDone, setCheckinDone] = useState(false);
  const [showReviewModal, setShowReviewModal] = useState(false);
  const [reviewForm, setReviewForm] = useState({ rating: 5, comment: '' });
  const [reviewSubmitting, setReviewSubmitting] = useState(false);
  const [reviewDone, setReviewDone] = useState(false);

  useEffect(() => {
    async function load() {
      setLoading(true);
      try {
        // Try property reservation first, then car booking
        let res;
        try {
          const r = await apiClient.get(`/reservations/${id}`);
          res = r.data?.data?.reservation || r.data?.reservation || r.data;
        } catch {
          const r = await apiClient.get(`/cars/bookings/${id}`);
          res = r.data?.data?.booking || r.data?.booking || r.data;
        }
        setBooking(res);

        // Load arrival guide if booking is paid/confirmed
        if (['PAID', 'CONFIRMED', 'CHECKED_IN'].includes(res?.status)) {
          setGuideLoading(true);
          try {
            const g = await getArrivalGuide(id);
            setGuide(g?.data || g);
          } catch {
            // guide not available yet — server endpoint may not be deployed
          } finally {
            setGuideLoading(false);
          }
        }
      } catch (err) {
        setError('Booking not found or you don\'t have access to it.');
      } finally {
        setLoading(false);
      }
    }
    load();
  }, [id]);

  const handleConfirmCheckIn = async () => {
    setCheckingIn(true);
    try {
      if (isCar) {
        await apiClient.patch(`/cars/reservations/${id}/handover`);
      } else if (b?.hotelId || b?.roomType) {
        await apiClient.patch(`/hotels/guest/bookings/${id}/confirm`);
      } else {
        await apiClient.patch(`/reservations/${id}/confirm-checkin`);
      }
      setBooking(prev => ({ ...prev, checkInConfirmedByGuest: true, guestConfirmedPickup: true }));
      setCheckinDone(true);
    } catch (err) {
      setError(err.response?.data?.message || 'Check-in confirmation failed. Please try again.');
    } finally {
      setCheckingIn(false);
    }
  };

  const handleCancel = async () => {
    setCancelling(true);
    try {
      await cancelBooking(id);
      setBooking(prev => ({ ...prev, status: 'CANCELLED' }));
      setCancelDone(true);
      setShowCancelConfirm(false);
    } catch (err) {
      setError(err.response?.data?.message || 'Cancellation failed. Please try again or contact support.');
    } finally {
      setCancelling(false);
    }
  };

  const openDirections = () => {
    const b = booking;
    const lat = b.latitude || b.location?.lat;
    const lng = b.longitude || b.location?.lng;
    const addr = b.address || `${b.location?.city}, ${b.location?.state}`;
    const url = lat && lng
      ? `https://www.google.com/maps/dir/?api=1&destination=${lat},${lng}`
      : `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(addr)}`;
    window.open(url, '_blank');
  };

  if (loading) return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-gray-50/50">
      <i className="fa-solid fa-spinner fa-spin text-3xl text-brand-primary mb-4" />
      <p className="text-gray-500 font-medium">Loading booking details...</p>
    </div>
  );

  if (error && !booking) return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-gray-50/50 text-center px-4">
      <i className="fa-solid fa-circle-exclamation text-4xl text-red-400 mb-4" />
      <h2 className="text-xl font-bold text-gray-900 mb-2">Booking not found</h2>
      <p className="text-gray-500 mb-6">{error}</p>
      <Link to="/dashboard/guest" className="px-6 py-3 bg-gray-900 text-white rounded-full font-semibold text-sm hover:bg-black">Back to trips</Link>
    </div>
  );

  const handleSubmitReview = async (e) => {
    e.preventDefault();
    if (!reviewForm.comment.trim()) return;
    setReviewSubmitting(true);
    try {
      const propId = booking.propertyId || booking.listingId || booking.assetId;
      if (propId) {
        await apiClient.post(`/reviews/${propId}`, { rating: reviewForm.rating, comment: reviewForm.comment });
      }
      setReviewDone(true);
      setShowReviewModal(false);
    } catch (err) {
      // review submitted or endpoint not ready — fail silently
    } finally {
      setReviewSubmitting(false);
    }
  };

  const handlePrint = () => window.print();

  const b = booking;
  const statusInfo = STATUS[b?.status] || STATUS.PENDING;
  const isCancellable = ['PAID', 'CONFIRMED', 'PENDING'].includes(b?.status) && !cancelDone;
  const isPaidOrActive = ['PAID', 'CONFIRMED', 'CHECKED_IN'].includes(b?.status);
  const isCompleted = b?.status === 'COMPLETED';
  const isCar = !!(b?.carId || b?._source === 'car');
  const canReview = isCompleted && !isCar && !reviewDone && !b?.hasReview;
  const canConfirmCheckin = isPaidOrActive && !checkinDone &&
    !(b?.checkInConfirmedByGuest || b?.guestConfirmedPickup);

  return (
    <main className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <Link to="/dashboard/guest" className="inline-flex items-center space-x-2 text-sm font-semibold text-gray-600 hover:text-brand-dark mb-6 transition-colors">
        <i className="fa-solid fa-arrow-left text-sm" />
        <span>Back to trips</span>
      </Link>

      {error && (
        <div className="mb-6 flex items-center gap-3 p-4 bg-red-50 border border-red-100 rounded-2xl text-red-600 text-sm font-medium">
          <i className="fa-solid fa-circle-exclamation text-base shrink-0" />
          {error}
        </div>
      )}

      {/* Header card */}
      <div className="bg-white border border-gray-200 rounded-3xl overflow-hidden shadow-sm mb-6">
        {b.image && (
          <div className="h-52 relative">
            <img src={b.image} alt={b.listingTitle} className="absolute inset-0 w-full h-full object-cover" />
          </div>
        )}
        <div className="p-6">
          <div className="flex items-start justify-between gap-4 mb-4">
            <div>
              <h1 className="text-xl font-bold text-gray-900 leading-tight">{b.listingTitle || b.title || 'Your Booking'}</h1>
              {b.location && (
                <p className="text-sm text-gray-500 mt-1 flex items-center gap-1">
                  <i className="fa-solid fa-location-dot text-sm" />
                  {typeof b.location === 'string' ? b.location : `${b.location?.city}, ${b.location?.state || ''}`}
                </p>
              )}
            </div>
            <span className={`shrink-0 text-xs font-bold px-3 py-1.5 rounded-full border ${statusInfo.color}`}>
              {statusInfo.label}
            </span>
          </div>

          <div className="grid grid-cols-2 gap-6 py-5 border-y border-gray-100">
            <div>
              <p className="text-[10px] uppercase tracking-widest font-extrabold text-gray-400 mb-1">Check-in / Pickup</p>
              <p className="font-bold text-gray-900">{fmt(b.checkInDate || b.startDate || b.pickupTime)}</p>
              {(b.checkinTime || b.pickupTime) && <p className="text-sm text-gray-500 mt-0.5">{fmtTime(b.checkinTime || b.pickupTime)}</p>}
            </div>
            <div>
              <p className="text-[10px] uppercase tracking-widest font-extrabold text-gray-400 mb-1">Check-out / Return</p>
              <p className="font-bold text-gray-900">{fmt(b.checkOutDate || b.endDate || b.returnTime)}</p>
              {(b.checkoutTime || b.returnTime) && <p className="text-sm text-gray-500 mt-0.5">{fmtTime(b.checkoutTime || b.returnTime)}</p>}
            </div>
          </div>

          <div className="pt-5 space-y-2">
            {b.reference && (
              <div className="flex justify-between text-sm">
                <span className="text-gray-500">Reference</span>
                <span className="font-bold text-gray-900 font-mono">{b.reference}</span>
              </div>
            )}
            {b.guests && (
              <div className="flex justify-between text-sm">
                <span className="text-gray-500">Guests</span>
                <span className="font-semibold text-gray-900">{b.guests}</span>
              </div>
            )}
            {b.roomType && (
              <div className="flex justify-between text-sm">
                <span className="text-gray-500">Room type</span>
                <span className="font-semibold text-gray-900">{b.roomType}</span>
              </div>
            )}

            {/* Itemised price breakdown */}
            {Array.isArray(b.lines) && b.lines.length > 0 && (
              <div className="pt-3 border-t border-gray-100 space-y-2">
                {b.lines.map((line, i) => (
                  <div key={i} className="flex justify-between text-sm">
                    <span className="text-gray-500">{line.label}</span>
                    <span className="font-semibold text-gray-900">₦{Number(line.amount).toLocaleString()}</span>
                  </div>
                ))}
                {b.serviceFee > 0 && (
                  <div className="flex justify-between text-sm">
                    <span className="text-gray-500">Service fee</span>
                    <span className="font-semibold text-gray-900">₦{Number(b.serviceFee).toLocaleString()}</span>
                  </div>
                )}
              </div>
            )}

            {b.totalAmount && (
              <div className="flex justify-between text-sm pt-2 border-t border-gray-100">
                <span className="font-bold text-gray-900">Total paid</span>
                <span className="font-bold text-gray-900">₦{Number(b.totalAmount).toLocaleString()}</span>
              </div>
            )}
            {b.refundAmount > 0 && (
              <div className="flex justify-between text-sm pt-1">
                <span className="text-emerald-600 font-semibold">Refund amount</span>
                <span className="font-bold text-emerald-600">₦{Number(b.refundAmount).toLocaleString()}</span>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Actions */}
      <div className="flex flex-col gap-3 mb-6">
        {checkinDone && (
          <div className="mb-3 flex items-center gap-3 p-4 bg-emerald-50 border border-emerald-100 rounded-2xl text-emerald-700 font-semibold text-sm">
            <i className="fa-solid fa-circle-check text-base shrink-0" />
            {isCar ? 'Pickup confirmed!' : 'Check-in confirmed! The host has been notified.'}
          </div>
        )}

        {canConfirmCheckin && (
          <button
            onClick={handleConfirmCheckIn}
            disabled={checkingIn}
            className="flex items-center justify-center gap-2 w-full px-5 py-3.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-2xl font-semibold text-sm transition-colors disabled:opacity-60 mb-3"
          >
            {checkingIn
              ? <><i className="fa-solid fa-spinner fa-spin text-sm" /> Confirming...</>
              : <><i className="fa-solid fa-circle-check text-sm" /> {isCar ? 'Confirm Pickup' : 'Confirm Check-in'}</>
            }
          </button>
        )}

        {isPaidOrActive && (
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <button
              onClick={openDirections}
              className="flex items-center justify-center gap-2 px-5 py-3.5 bg-gray-900 hover:bg-black text-white rounded-2xl font-semibold text-sm transition-colors"
            >
              <i className="fa-solid fa-diamond-turn-right text-sm" />
              Get Directions
            </button>
            <Link
              to={`/bookings/${id}/pass`}
              className="flex items-center justify-center gap-2 px-5 py-3.5 bg-brand-primary hover:bg-brand-accent text-white rounded-2xl font-semibold text-sm transition-colors"
            >
              <i className="fa-solid fa-qrcode text-sm" />
              View Check-in Pass
            </Link>
          </div>
        )}

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          <button
            onClick={handlePrint}
            className="flex items-center justify-center gap-2 px-5 py-3.5 border border-gray-200 text-gray-700 hover:bg-gray-50 rounded-2xl font-semibold text-sm transition-colors"
          >
            <i className="fa-solid fa-download text-sm" />
            Download Receipt
          </button>
          {canReview && (
            <button
              onClick={() => setShowReviewModal(true)}
              className="flex items-center justify-center gap-2 px-5 py-3.5 border border-amber-200 text-amber-700 hover:bg-amber-50 rounded-2xl font-semibold text-sm transition-colors"
            >
              <i className="fa-solid fa-star text-sm" />
              Leave a Review
            </button>
          )}
          {isCancellable && !showCancelConfirm && (
            <button
              onClick={() => setShowCancelConfirm(true)}
              className="flex items-center justify-center gap-2 px-5 py-3.5 border border-red-200 text-red-600 hover:bg-red-50 rounded-2xl font-semibold text-sm transition-colors"
            >
              <i className="fa-solid fa-circle-xmark text-sm" />
              Cancel Booking
            </button>
          )}
        </div>
      </div>

      {/* Cancel confirmation */}
      {showCancelConfirm && (
        <div className="mb-6 p-5 bg-red-50 border border-red-200 rounded-2xl">
          <h3 className="font-bold text-red-700 mb-2">Cancel this booking?</h3>
          <p className="text-sm text-red-600 mb-1">Terms and conditions apply. Payment processing fees are non-refundable, so the refund amount may differ from the original payment.</p>
          <p className="text-sm text-red-600 mb-4">Rentals Africa will review and process your refund.</p>
          <div className="flex gap-3">
            <button
              onClick={handleCancel}
              disabled={cancelling}
              className="flex items-center gap-2 px-5 py-2.5 bg-red-600 hover:bg-red-700 text-white rounded-xl font-semibold text-sm transition-colors disabled:opacity-60"
            >
              {cancelling ? <i className="fa-solid fa-spinner fa-spin text-sm" /> : <i className="fa-solid fa-circle-xmark text-sm" />}
              {cancelling ? 'Cancelling...' : 'Yes, cancel'}
            </button>
            <button
              onClick={() => setShowCancelConfirm(false)}
              className="px-5 py-2.5 border border-gray-300 text-gray-700 rounded-xl font-semibold text-sm hover:bg-gray-50 transition-colors"
            >
              Keep booking
            </button>
          </div>
        </div>
      )}

      {cancelDone && (
        <div className="mb-6 flex items-center gap-3 p-5 bg-emerald-50 border border-emerald-100 rounded-2xl text-emerald-700 font-semibold text-sm">
          <i className="fa-solid fa-circle-check text-base shrink-0" />
          Booking cancelled. Refund is being reviewed by Rentals Africa.
        </div>
      )}

      {/* Arrival Guide */}
      {isPaidOrActive && (
        <div className="bg-white border border-gray-200 rounded-3xl p-6 mb-6">
          <h2 className="font-bold text-gray-900 mb-4 flex items-center gap-2">
            <i className="fa-solid fa-circle-info text-base text-brand-primary" />
            Arrival Guide
          </h2>
          {guideLoading ? (
            <div className="flex items-center gap-3 text-gray-400">
              <i className="fa-solid fa-spinner fa-spin text-sm" />
              <span className="text-sm">Loading arrival guide...</span>
            </div>
          ) : guide ? (
            <div className="space-y-3">
              {guide.accessCode && (
                <div className="p-3 bg-gray-50 rounded-xl">
                  <p className="text-[10px] font-bold uppercase tracking-wider text-gray-400 mb-1">Access Code</p>
                  <p className="font-bold text-gray-900 font-mono text-lg">{guide.accessCode}</p>
                </div>
              )}
              {guide.instructions && (
                <div className="p-3 bg-gray-50 rounded-xl">
                  <p className="text-[10px] font-bold uppercase tracking-wider text-gray-400 mb-1">Instructions</p>
                  <p className="text-sm text-gray-700 leading-relaxed whitespace-pre-line">{guide.instructions}</p>
                </div>
              )}
              {guide.notes && (
                <p className="text-sm text-gray-500 leading-relaxed">{guide.notes}</p>
              )}
            </div>
          ) : (
            <p className="text-sm text-gray-400">The host's arrival guide will appear here once confirmed.</p>
          )}
        </div>
      )}

      {reviewDone && (
        <div className="mb-6 flex items-center gap-3 p-4 bg-amber-50 border border-amber-100 rounded-2xl text-amber-700 text-sm font-medium">
          <i className="fa-solid fa-star text-base shrink-0" />
          Thanks for your review!
        </div>
      )}

      {/* Support */}
      <div className="bg-white border border-gray-200 rounded-3xl p-6">
        <h2 className="font-bold text-gray-900 mb-3 flex items-center gap-2">
          <i className="fa-solid fa-shield-halved text-base text-emerald-500" />
          Need help?
        </h2>
        <p className="text-sm text-gray-500 mb-4">Rentals Africa is your point of contact for all booking matters. We are your host.</p>
        <a
          href="https://wa.me/2347063688222"
          target="_blank"
          rel="noreferrer"
          className="inline-flex items-center gap-2 px-5 py-3 bg-[#25D366] hover:bg-[#20b858] text-white rounded-xl font-semibold text-sm transition-colors"
        >
          <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 24 24"><path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z"/></svg>
          Chat with Support
        </a>
      </div>

      {/* Review Modal */}
      {showReviewModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm px-4">
          <div className="bg-white rounded-3xl shadow-2xl w-full max-w-md p-6">
            <div className="flex items-center justify-between mb-5">
              <h3 className="text-lg font-bold text-gray-900">Leave a Review</h3>
              <button onClick={() => setShowReviewModal(false)} className="p-2 rounded-xl hover:bg-gray-100 text-gray-400">
                <i className="fa-solid fa-xmark text-base" />
              </button>
            </div>
            <p className="text-sm text-gray-500 mb-5">How was your stay at <strong>{b.listingTitle || 'this property'}</strong>?</p>
            <form onSubmit={handleSubmitReview} className="space-y-4">
              <div>
                <label className="text-[10px] font-bold uppercase tracking-widest text-gray-500 block mb-2">Rating</label>
                <div className="flex gap-2">
                  {[1,2,3,4,5].map(star => (
                    <button
                      key={star}
                      type="button"
                      onClick={() => setReviewForm(f => ({ ...f, rating: star }))}
                      className={`text-2xl transition-colors ${star <= reviewForm.rating ? 'text-amber-400' : 'text-gray-200'}`}
                    >
                      <i className="fa-solid fa-star" />
                    </button>
                  ))}
                </div>
              </div>
              <div>
                <label className="text-[10px] font-bold uppercase tracking-widest text-gray-500 block mb-2">Your review</label>
                <textarea
                  value={reviewForm.comment}
                  onChange={e => setReviewForm(f => ({ ...f, comment: e.target.value }))}
                  rows={4}
                  placeholder="Tell others about your experience..."
                  className="w-full px-4 py-3 border border-gray-200 rounded-xl text-sm outline-none focus:ring-2 focus:ring-brand-primary resize-none"
                />
              </div>
              <button
                type="submit"
                disabled={reviewSubmitting || !reviewForm.comment.trim()}
                className="w-full py-3 bg-gray-900 text-white rounded-xl font-bold text-sm hover:bg-black transition-colors disabled:opacity-60"
              >
                {reviewSubmitting ? 'Submitting…' : 'Submit Review'}
              </button>
            </form>
          </div>
        </div>
      )}

      <style>{`@media print { nav, .no-print { display:none!important } }`}</style>
    </main>
  );
}
