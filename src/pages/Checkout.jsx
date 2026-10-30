import { useEffect, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { ChevronLeft, ShieldCheck, Lock, CalendarDays, MapPin, Info, ShoppingBag } from 'lucide-react';
import { Container, Card, Button, EmptyState } from '../components/ui';
import { useToast } from '../components/Toast';
import { useAuth } from '../context/AuthContext';
import { useDocumentMeta } from '../lib/seo';
import { initiateBooking, loadCheckoutDraft, clearCheckoutDraft } from '../api/reservation';
import { createCarReservation } from '../api/car';

const naira = (n) => `₦${Number(n || 0).toLocaleString()}`;

export default function Checkout() {
  useDocumentMeta('Checkout', 'Review your booking and pay securely on Rentals Africa.');
  const navigate = useNavigate();
  const toast = useToast();
  const { user, setShowAuthModal } = useAuth();
  const [draft] = useState(() => loadCheckoutDraft());
  const [paying, setPaying] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => { window.scrollTo(0, 0); }, []);

  if (!draft) {
    return (
      <Container className="py-16">
        <Card>
          <EmptyState
            icon={ShoppingBag}
            title="Nothing to check out"
            text="Choose a stay, hotel room or car first, then continue to payment."
            action={<Button to="/">Browse listings</Button>}
          />
        </Card>
      </Container>
    );
  }

  const pay = async () => {
    if (!user) {
      setShowAuthModal?.(true);
      return;
    }
    setPaying(true);
    setError('');
    try {
      const body = { ...draft.payload, callbackUrl: `${window.location.origin}/trips` };
      const res = draft.kind === 'car' ? await createCarReservation(body) : await initiateBooking(body);
      const url = res?.data?.checkoutUrl || res?.checkoutUrl || res?.authorization_url;
      if (!url) throw new Error('The payment page could not be opened. Please try again.');
      clearCheckoutDraft();
      window.location.href = url;
    } catch (e) {
      const msg = e?.response?.data?.message || e?.message || 'Could not complete your booking. Please try again.';
      setError(msg);
      toast.error(msg);
      setPaying(false);
    }
  };

  return (
    <div className="bg-gray-50 min-h-screen py-10">
      <Container>
        <button onClick={() => navigate(draft.backTo || -1)} className="flex items-center text-base font-semibold text-brand-text-secondary hover:text-brand-dark mb-6">
          <ChevronLeft className="w-5 h-5 mr-1" /> Back
        </button>
        <h1 className="text-4xl font-display font-bold text-brand-dark tracking-tight mb-8">Confirm and pay</h1>

        <div className="grid grid-cols-1 lg:grid-cols-5 gap-8 items-start">
          <div className="lg:col-span-3 space-y-6">
            <Card className="p-6 flex gap-5">
              {draft.image && <img src={draft.image} alt="" className="w-32 h-28 sm:w-40 sm:h-32 rounded-2xl object-cover shrink-0" />}
              <div className="min-w-0">
                <p className="text-sm font-bold uppercase tracking-widest text-brand-primary mb-1">{draft.tag}</p>
                <h2 className="text-2xl font-display font-bold text-brand-dark leading-tight">{draft.title}</h2>
                {draft.subtitle && (
                  <p className="mt-2 flex items-center text-base text-brand-text-secondary"><MapPin className="w-4 h-4 mr-1.5 shrink-0" />{draft.subtitle}</p>
                )}
                <p className="mt-2 text-base text-brand-text-secondary">Managed by Rentals Africa</p>
              </div>
            </Card>

            <Card className="p-6">
              <h3 className="text-xl font-display font-bold text-brand-dark mb-4 flex items-center"><CalendarDays className="w-5 h-5 mr-2 text-brand-text-muted" />Your trip</h3>
              <dl className="divide-y divide-gray-100">
                {(draft.details || []).map((d) => (
                  <div key={d.label} className="flex justify-between gap-4 py-3 text-base">
                    <dt className="text-brand-text-secondary">{d.label}</dt>
                    <dd className="font-semibold text-brand-dark text-right">{d.value}</dd>
                  </div>
                ))}
              </dl>
            </Card>

            <Card className="p-6 flex gap-4 bg-status-available-soft border-status-available/20">
              <ShieldCheck className="w-7 h-7 text-status-available shrink-0" />
              <div>
                <h3 className="text-lg font-bold text-brand-dark">Rentals Guarantee</h3>
                <p className="text-base text-brand-text-secondary mt-1 leading-relaxed">
                  Your payment is held securely by Rentals Africa and only released to the host after check-in, pickup or arrival is confirmed.
                </p>
              </div>
            </Card>
          </div>

          <aside className="lg:col-span-2 lg:sticky lg:top-28">
            <Card className="p-6 shadow-elevated">
              <h3 className="text-xl font-display font-bold text-brand-dark mb-4">Price details</h3>
              <div className="space-y-3">
                {draft.lines.map((l) => (
                  <div key={l.label} className="flex justify-between gap-4 text-base text-brand-text-secondary">
                    <span>{l.label}</span>
                    <span className="text-brand-dark font-medium">{naira(l.amount)}</span>
                  </div>
                ))}
              </div>
              <div className="flex justify-between items-baseline mt-5 pt-5 border-t border-gray-200">
                <span className="text-lg font-bold text-brand-dark">Total</span>
                <span className="text-3xl font-display font-bold text-brand-dark">{naira(draft.total)}</span>
              </div>

              {error && <div role="alert" className="mt-5 p-3 rounded-xl bg-red-50 border border-red-100 text-base text-red-700 font-medium">{error}</div>}

              {!user && <p className="mt-5 text-base text-brand-text-secondary">Sign in to complete your booking.</p>}
              <Button size="lg" className="w-full mt-6" onClick={pay} disabled={paying}>
                <Lock className="w-5 h-5" />
                {paying ? 'Opening secure payment...' : user ? `Confirm and pay ${naira(draft.total)}` : 'Sign in to pay'}
              </Button>

              <p className="mt-5 flex gap-2 text-sm text-brand-text-secondary leading-relaxed">
                <Info className="w-4 h-4 mt-0.5 shrink-0" />
                <span>
                  Terms and conditions apply. Payment processing fees are non-refundable, so the refund amount may differ from the original payment. Rentals Africa reviews and processes refunds. You can cancel from <Link to="/trips" className="underline font-semibold">Trips</Link> before check-in, pickup or arrival.
                </span>
              </p>
            </Card>
          </aside>
        </div>
      </Container>
    </div>
  );
}
