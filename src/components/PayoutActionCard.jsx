import { useState } from 'react';
import { Banknote, CheckCircle, Clock, Loader2 } from 'lucide-react';
import { executePayout } from '../api/payouts';
import { Badge, Button, Card } from './ui';
import { useToast } from './Toast';

// One payout row on the host dashboard. Payout is 95% of the booking (5% platform commission).
export default function PayoutActionCard({ booking, typeLabel, onReleased, onNeedBank }) {
  const toast = useToast();
  const [busy, setBusy] = useState(false);

  const isCar = booking.type === 'CAR';
  const hostConfirmed = isCar ? booking.ownerConfirmedHandover : booking.checkInConfirmedByHost;
  const guestConfirmed = isCar ? booking.guestConfirmedPickup : booking.checkInConfirmedByGuest;
  const released = booking.escrowStatus === 'RELEASED';
  const ready = !released && hostConfirmed && guestConfirmed;
  const gross = Number(booking.payoutAmount) || 0;
  const net = Math.round(gross * 0.95);

  const request = async () => {
    setBusy(true);
    try {
      await executePayout(booking._id);
      onReleased?.(booking._id);
      toast.success('Payout requested. Funds are on their way to your bank account.');
    } catch (e) {
      const message = e?.response?.data?.message || 'The payout could not be completed. Make sure your bank details are verified.';
      toast.error(message);
      onNeedBank?.();
    } finally {
      setBusy(false);
    }
  };

  return (
    <Card className="p-5 flex flex-col md:flex-row md:items-center justify-between gap-5">
      <div className="min-w-0">
        <p className="text-sm font-bold uppercase tracking-wider text-brand-text-muted">
          Booking #{String(booking._id).slice(-6).toUpperCase()} · Managed by Rentals Africa
        </p>
        <h3 className="text-lg font-display font-bold text-brand-dark truncate mt-1">{booking.asset.title}</h3>
        <p className="text-base text-brand-text-secondary">{typeLabel} · {booking.dates}</p>
      </div>

      <div className="flex flex-wrap items-center gap-5">
        <div className="text-right">
          <p className="text-sm text-brand-text-muted">Your payout (after 5%)</p>
          <p className="text-2xl font-display font-bold text-brand-dark">₦{net.toLocaleString()}</p>
          <p className="text-sm text-brand-text-muted">Booking total ₦{gross.toLocaleString()}</p>
        </div>

        {released ? (
          <Badge tone="green"><CheckCircle className="w-4 h-4" /> Released</Badge>
        ) : ready ? (
          <Button variant="primary" onClick={request} disabled={busy}>
            {busy ? <Loader2 className="w-4 h-4 animate-spin" /> : <Banknote className="w-5 h-5" />}
            {busy ? 'Requesting...' : 'Request payout'}
          </Button>
        ) : (
          <Badge tone="amber"><Clock className="w-4 h-4" /> {hostConfirmed ? 'Waiting for guest' : 'Waiting for check-in'}</Badge>
        )}
      </div>
    </Card>
  );
}
