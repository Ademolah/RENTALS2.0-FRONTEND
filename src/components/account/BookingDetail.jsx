import { useEffect, useState } from 'react';
import { X, ShieldCheck, Printer, Star, Loader2, MapPin, Navigation } from 'lucide-react';
import { Button } from '../ui';
import { useToast } from '../Toast';
import { statusBadge } from './BookingCard';
import { getArrivalGuide, confirmArrival, cancelBookingApi, submitReview, errorText } from '../../api/trips';

const fmt = (d) => d.toLocaleDateString('en-GB', { weekday: 'short', day: 'numeric', month: 'short', year: 'numeric' });
const REFUND_NOTE = 'Terms and conditions apply. Payment processing fees are non-refundable, so the refund amount may differ from the original payment.';

const ARRIVE_LABEL = { CAR: 'Confirm pickup', VIP: 'Confirm arrival', VIP_SERVICE: 'Confirm service delivered' };

export default function BookingDetail({ booking, onClose, onChange }) {
  const [guide, setGuide] = useState(undefined);
  const [busy, setBusy] = useState('');
  const toast = useToast();
  const [cancelling, setCancelling] = useState(false);
  const [rating, setRating] = useState(0);
  const [comment, setComment] = useState('');
  const [reviewed, setReviewed] = useState(false);

  useEffect(() => {
    const onKey = (e) => e.key === 'Escape' && onClose();
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [onClose]);

  useEffect(() => {
    let live = true;
    setGuide(undefined);
    if (booking.paid && !booking.cancelled && booking.type !== 'CAR') {
      getArrivalGuide(booking.id).then((g) => live && setGuide(g)).catch(() => live && setGuide(null));
    } else setGuide(null);
    return () => { live = false; };
  }, [booking.id, booking.paid, booking.cancelled, booking.type]);

  const run = async (key, fn, okText) => {
    setBusy(key);
    try {
      await fn();
      toast.success(okText);
    } catch (e) {
      toast.error(errorText(e, 'That did not work. Please try again.'));
    } finally {
      setBusy('');
    }
  };

  const doConfirm = () =>
    run('confirm', async () => {
      const r = await confirmArrival(booking);
      onChange(booking.id, { guestConfirmed: true, ...(r.released ? { released: true, completed: true, bucket: 'past' } : {}) });
    }, 'Confirmed. Thank you.');

  const doCancel = () =>
    run('cancel', async () => {
      await cancelBookingApi(booking.id);
      onChange(booking.id, { cancelled: true, canCancel: false, bucket: 'cancelled' });
      setCancelling(false);
    }, 'Booking cancelled. Rentals Africa will review and process any refund due.');

  const doReview = () =>
    run('review', async () => {
      await submitReview(booking.listingId, rating, comment.trim());
      setReviewed(true);
    }, 'Thank you for your review.');

  const canReview = booking.completed && booking.listingId && !reviewed;
  const canArrive = booking.paid && !booking.cancelled && !booking.completed && !booking.guestConfirmed;
  const showEnd = booking.end && booking.type !== 'VIP' && booking.type !== 'VIP_SERVICE';

  return (
    <div className="fixed inset-0 z-[100000] flex justify-end print:static" role="dialog" aria-modal="true" aria-label="Booking details">
      <div className="absolute inset-0 bg-brand-dark/60 backdrop-blur-sm print:hidden" onClick={onClose} />
      <div className="relative bg-white w-full max-w-xl h-full overflow-y-auto shadow-elevated animate-fade-up">
        <div className="sticky top-0 bg-white z-10 flex items-center justify-between px-6 py-4 border-b border-gray-100">
          <p className="text-sm font-bold uppercase tracking-wider text-brand-text-muted">Booking {booking.reference}</p>
          <div className="flex gap-2 print:hidden">
            <button onClick={() => window.print()} aria-label="Print" className="p-2 rounded-full hover:bg-gray-100"><Printer className="w-5 h-5" /></button>
            <button onClick={onClose} aria-label="Close" className="p-2 rounded-full hover:bg-gray-100"><X className="w-5 h-5" /></button>
          </div>
        </div>

        <img src={booking.image} alt={booking.title} className="w-full h-56 object-cover" />

        <div className="p-6 space-y-7">
          <div>
            <div className="flex items-start justify-between gap-3">
              <h2 className="text-2xl font-display font-bold text-brand-dark">{booking.title}</h2>
              {statusBadge(booking)}
            </div>
            <p className="flex items-center gap-1.5 text-base text-brand-text-secondary mt-2"><MapPin className="w-4 h-4" />{booking.location}</p>
            <a
              href={`https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(`${booking.title} ${booking.location}`)}`}
              target="_blank"
              rel="noreferrer"
              className="inline-flex items-center gap-2 mt-3 px-4 py-2 rounded-xl border border-gray-200 text-base font-semibold text-brand-dark hover:border-brand-dark transition-colors print:hidden"
            >
              <Navigation className="w-4 h-4" /> Get directions
            </a>
          </div>

          <dl className="grid grid-cols-2 gap-5 text-base">
            <div>
              <dt className="text-sm font-bold uppercase tracking-wider text-brand-text-muted">{booking.type === 'CAR' ? 'Pickup' : 'Start'}</dt>
              <dd className="font-semibold text-brand-dark mt-1">{fmt(booking.start)}</dd>
            </div>
            {showEnd && (
              <div>
                <dt className="text-sm font-bold uppercase tracking-wider text-brand-text-muted">{booking.type === 'CAR' ? 'Return' : 'End'}</dt>
                <dd className="font-semibold text-brand-dark mt-1">{fmt(booking.end)}</dd>
              </div>
            )}
            <div>
              <dt className="text-sm font-bold uppercase tracking-wider text-brand-text-muted">Total</dt>
              <dd className="font-display font-bold text-xl text-brand-dark mt-1">₦{booking.total.toLocaleString()}</dd>
            </div>
            <div>
              <dt className="text-sm font-bold uppercase tracking-wider text-brand-text-muted">Managed by</dt>
              <dd className="font-semibold text-brand-dark mt-1">Rentals Africa</dd>
            </div>
          </dl>

          {guide === undefined && booking.paid && !booking.cancelled && booking.type !== 'CAR' && (
            <div className="h-24 rounded-2xl bg-gray-50 animate-pulse-soft" />
          )}
          {guide && (
            <section>
              <h3 className="text-lg font-display font-bold text-brand-dark mb-3">Arrival guide</h3>
              {guide.notes && <p className="text-base text-brand-text-secondary leading-relaxed whitespace-pre-line">{guide.notes}</p>}
              {guide.photos.length > 0 && (
                <div className="grid grid-cols-3 gap-2 mt-3">
                  {guide.photos.map((u) => <img key={u} src={u} alt="Arrival" loading="lazy" className="aspect-square object-cover rounded-xl" />)}
                </div>
              )}
            </section>
          )}

          {canReview && (
            <section className="print:hidden">
              <h3 className="text-lg font-display font-bold text-brand-dark mb-3">How was your stay?</h3>
              <div className="flex gap-1 mb-3">
                {[1, 2, 3, 4, 5].map((n) => (
                  <button key={n} type="button" onClick={() => setRating(n)} aria-label={`${n} stars`}>
                    <Star className={`w-8 h-8 ${n <= rating ? 'fill-brand-star text-brand-star' : 'text-gray-300'}`} />
                  </button>
                ))}
              </div>
              <textarea
                value={comment}
                onChange={(e) => setComment(e.target.value)}
                maxLength={500}
                rows={3}
                placeholder="Tell others about your experience"
                className="w-full p-4 border border-gray-200 rounded-xl text-base outline-none focus:ring-2 focus:ring-brand-primary"
              />
              <Button className="mt-3" disabled={!rating || busy === 'review'} onClick={doReview}>
                {busy === 'review' ? <Loader2 className="w-4 h-4 animate-spin" /> : 'Submit review'}
              </Button>
            </section>
          )}

          <div className="print:hidden space-y-3">
            {canArrive && (
              <Button variant="dark" className="w-full" disabled={!!busy} onClick={doConfirm}>
                {busy === 'confirm' ? <Loader2 className="w-4 h-4 animate-spin" /> : <ShieldCheck className="w-5 h-5" />}
                {ARRIVE_LABEL[booking.type] || 'Confirm check-in'}
              </Button>
            )}

            {booking.canCancel && !cancelling && (
              <Button variant="outline" className="w-full text-red-600" onClick={() => setCancelling(true)}>Cancel booking</Button>
            )}
            {cancelling && (
              <div className="border border-red-100 bg-red-50/60 rounded-2xl p-5 space-y-4">
                <p className="text-base font-semibold text-brand-dark">Cancel this booking?</p>
                <p className="text-base text-brand-text-secondary leading-relaxed">{REFUND_NOTE} Rentals Africa reviews and processes refunds.</p>
                <div className="flex gap-3">
                  <Button variant="outline" className="flex-1" onClick={() => setCancelling(false)}>Keep booking</Button>
                  <Button className="flex-1 !bg-red-600 hover:!bg-red-700 !shadow-none" disabled={busy === 'cancel'} onClick={doCancel}>
                    {busy === 'cancel' ? <Loader2 className="w-4 h-4 animate-spin" /> : 'Confirm cancel'}
                  </Button>
                </div>
              </div>
            )}
            {!booking.canCancel && !booking.cancelled && !booking.completed && (
              <p className="text-sm text-brand-text-muted">Bookings cannot be cancelled after check-in, pickup or service start.</p>
            )}
            {booking.cancelled && <p className="text-base text-brand-text-secondary">{REFUND_NOTE}</p>}
          </div>
        </div>
      </div>
    </div>
  );
}
